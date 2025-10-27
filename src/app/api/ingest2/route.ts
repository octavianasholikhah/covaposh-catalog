// src/app/api/ingest2/route.ts
import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ===== Next route config
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ===== Types
type OpenAIEmbeddingResponse = {
  data: { embedding: number[] }[];
};

// ===== Supabase (lazy init)
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

// ===== Text chunker
function splitIntoChunks(text: string, maxWords = 180, overlap = 40): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += Math.max(1, maxWords - overlap)) {
    const part = words.slice(i, i + maxWords).join(" ").trim();
    if (part) chunks.push(part);
  }
  return chunks;
}

// ===== Embedding via OpenAI (stabil & murah)
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
      model: "text-embedding-3-small", // dimensi 1536
      input: texts,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as OpenAIEmbeddingResponse;
  if (!data?.data?.length) throw new Error("Response OpenAI kosong.");
  return data.data.map((d) => d.embedding);
}

// ===== Handler utama (POST)
export async function POST(req: Request) {
  const step: Record<string, string> = {};
  try {
    step.stage = "read-body";
    const { source, text } = await req.json();

    if (!text || !String(text).trim()) {
      return NextResponse.json(
        { ok: false, error: "Teks kosong." },
        { status: 400 }
      );
    }

    const dataset =
      (source && String(source).trim()) ||
      "faq-" + new Date().toISOString().slice(0, 10);

    // Debug env (boolean saja)
    const envSeen = {
      OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    };
    console.log("[INGEST2] envSeen:", envSeen);

    step.stage = "chunk";
    const chunks = splitIntoChunks(String(text));
    if (chunks.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Tidak ada potongan teks yang valid." },
        { status: 400 }
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
      // NOTE: pastikan kolom 'embedding' di Supabase bertipe: vector(1536)
      embedding: embeddings[i],
    }));

    const { data, error } = await supabase()
      .from("faq_chunks")
      .insert(rows)
      .select();

    if (error) {
      console.error("[INGEST2][INSERT][ERROR RAW]", error);
      const msg =
        (error as any).message ??
        JSON.stringify({
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
        });
      throw new Error(msg);
    }

    step.stage = "done";
    console.log("[INGEST2] success insert:", rows.length);
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
      { status: 500 }
    );
  }
}

// GET → info
export async function GET() {
  return NextResponse.json({ ok: false, error: "Use POST" }, { status: 405 });
}
