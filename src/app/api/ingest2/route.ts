// src/app/api/ingest2/route.ts
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient, type PostgrestError } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type OpenAIEmbeddingResponse = { data: { embedding: number[] }[] };

// ----- Supabase (lazy)
let _sb: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  if (_sb) return _sb;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum terpasang.");
  }
  _sb = createClient(url, key, { auth: { persistSession: false } });
  return _sb;
}

// ----- Chunker
function splitIntoChunks(text: string, maxWords = 180, overlap = 40): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += Math.max(1, maxWords - overlap)) {
    const part = words.slice(i, i + maxWords).join(" ").trim();
    if (part) chunks.push(part);
  }
  return chunks;
}

// ----- OpenAI embeddings
async function embedWithOpenAI(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY belum terpasang.");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small", // 1536 dims
      input: texts,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${raw.slice(0, 800)}`);
  }

  let parsed: OpenAIEmbeddingResponse;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`OpenAI non-JSON: ${raw.slice(0, 800)}`);
  }

  if (!parsed?.data?.length) throw new Error("Response OpenAI kosong.");
  return parsed.data.map(d => d.embedding);
}

// ----- Handler POST
export async function POST(req: Request) {
  const step: Record<string, string> = {};
  try {
    step.stage = "read-body";
    const { source, text } = await req.json();

    if (!text || !String(text).trim()) {
      return NextResponse.json({ ok: false, error: "Teks kosong." }, { status: 400 });
    }

    const dataset =
      (source && String(source).trim()) ||
      "faq-" + new Date().toISOString().slice(0, 10);

    const envSeen = {
      OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      VERSION: "ingest2-verbose-v4",
    };

    step.stage = "chunk";
    const chunks = splitIntoChunks(String(text));
    if (chunks.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Tidak ada potongan teks yang valid." },
        { status: 400 },
      );
    }

    step.stage = "embed";
    const embeddings = await embedWithOpenAI(chunks);
    if (embeddings.length !== chunks.length) {
      throw new Error("Panjang embeddings tidak sama dengan chunks.");
    }

    step.stage = "insert";
    const rows = chunks.map((chunk, i) => ({
      source: dataset,
      chunk,
      embedding: embeddings[i], // kolom harus vector(1536)
    }));

    const { error } = await supabase().from("faq_chunks").insert(rows);

    if (error) {
      // format error supaya tidak [object Object]
      const e: PostgrestError = error;
      const msg = JSON.stringify(
        { message: e.message, code: e.code, details: e.details },
        null,
        2,
      );
      throw new Error(`Supabase insert error: ${msg}`);
    }

    step.stage = "done";
    return NextResponse.json({ ok: true, inserted: rows.length, envSeen });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object"
        ? JSON.stringify(err)
        : String(err);

    console.error("[INGEST2][ERROR]", step, message);

    return NextResponse.json(
      { ok: false, where: step, error: message },
      { status: 500 },
    );
  }
}

// ----- GET
export async function GET() {
  return NextResponse.json(
    { ok: true, hint: "POST /api/ingest2", version: "ingest2-verbose-v4" },
  );
}
