// app/api/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// *** penting: ENV sudah kamu set di Vercel ***
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side only
);

// Split teks panjang jadi potongan kecil agar embedding akurat & hemat
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
    const { source = "faq", text } = await req.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ ok: false, error: "Body { text } kosong" }, { status: 400 });
    }

    const chunks = splitIntoChunks(text);
    // 1) Buat embedding untuk semua chunk sekaligus
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small", // 1536 dim, murah & multilingual
      input: chunks,
    });

    // 2) Siapkan row untuk insert
    const rows = chunks.map((chunk, i) => ({
      source,
      chunk,
      embedding: emb.data[i].embedding as unknown as any, // supabase-js handle pgvector
    }));

    // 3) Insert ke tabel faq_chunks
    const { error } = await supabase.from("faq_chunks").insert(rows);
    if (error) throw error;

    return NextResponse.json({ ok: true, inserted: rows.length });
  } catch (e: any) {
    console.error("INGEST ERROR:", e);
    return NextResponse.json({ ok: false, error: e.message ?? "Ingest gagal" }, { status: 500 });
  }
}
