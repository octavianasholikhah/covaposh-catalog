// app/api/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// Hindari prerender/collect-data di build
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

type FaqChunkRow = { source: string; chunk: string; embedding: number[] };

function splitIntoChunks(text: string, maxWords = 180, overlap = 40) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; ) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
    i += Math.max(1, maxWords - overlap);
  }
  return chunks;
}

// --- LAZY factories (jangan di top-level) ---
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY belum terpasang di runtime.");
  return new OpenAI({ apiKey });
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum terpasang di runtime.");
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const { source = "faq", text } = (await req.json()) as { source?: string; text: string };
    if (!text?.trim()) {
      return NextResponse.json({ ok: false, error: "Body {text} kosong" }, { status: 400 });
    }

    const openai = getOpenAI();      // ← dibuat di dalam handler
    const supabase = getSupabase();  // ← dibuat di dalam handler

    const chunks = splitIntoChunks(text);

    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks,
    });

    const rows: FaqChunkRow[] = chunks.map((chunk, i) => ({
      source,
      chunk,
      embedding: emb.data[i].embedding,
    }));

    const { error } = await supabase.from("faq_chunks").insert(rows);
    if (error) throw error;

    return NextResponse.json({ ok: true, inserted: rows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
