import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type FaqChunkRow = {
  source: string;
  chunk: string;
  embedding: number[];
};

function splitIntoChunks(text: string, maxWords = 180, overlap = 40) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; ) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
    i += Math.max(1, maxWords - overlap);
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const { source = "faq", text } = (await req.json()) as {
      source?: string;
      text: string;
    };
    if (!text?.trim()) {
      return NextResponse.json({ ok: false, error: "Body {text} kosong" }, { status: 400 });
    }

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
