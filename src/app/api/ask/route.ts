// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY belum terpasang.");
  return new OpenAI({ apiKey });
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum terpasang.");
  }
  return createClient(url, key);
}

type MatchRow = { source: string; chunk: string; score: number };

const SYSTEM_PROMPT =
  "Kamu adalah asisten toko buket COVAPOSH. " +
  "Jawab SINGKAT, jelas, dan sopan. " +
  "KAMU HANYA BOLEH menggunakan informasi dari KONTEN yang diberikan. " +
  "Jika tidak ada info relevan di KONTEN, katakan belum punya informasinya dan sarankan hubungi WhatsApp.";

function buildUserPrompt(question: string, contexts: MatchRow[]) {
  const ctx =
    contexts.length === 0
      ? "(tidak ada konteks yang cocok)"
      : contexts.map((c, i) => `#${i + 1} [${c.source}] ${c.chunk}`).join("\n");

  return [
    "KONTEN (gunakan hanya ini untuk menjawab):",
    ctx,
    "",
    "TUGAS:",
    "- Jawab pertanyaan memakai KONTEN di atas.",
    "- Jika tidak ada jawaban relevan di KONTEN, katakan belum punya infonya.",
    "- Jika ada alamat/jam/produk/harga, sebutkan ringkas.",
    "",
    `PERTANYAAN: ${question}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { question, topK = 8 } = (await req.json()) as {
      question: string;
      topK?: number; // 1..10
    };

    if (!question?.trim()) {
      return NextResponse.json({ ok: false, error: "Body {question} kosong" }, { status: 400 });
    }

    const openai = getOpenAI();
    const supabase = getSupabase();

    // 1) Embedding pertanyaan
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });
    const queryEmbedding: number[] = emb.data[0].embedding;

    // 2) Ambil Top-K dari Supabase (tanpa filter threshold)
    const { data, error } = await supabase.rpc("match_faq_chunks", {
      query_embedding: queryEmbedding,
      match_count: Math.min(Math.max(topK, 1), 10),
    });
    if (error) {
      return NextResponse.json(
        { ok: false, stage: "match_faq_chunks", error: error.message ?? String(error) },
        { status: 500 }
      );
    }

    const matches: MatchRow[] = (data ?? []) as MatchRow[];

    // Guard: jika skor tertinggi sangat rendah, anggap tidak relevan
    const bestScore = matches[0]?.score ?? 0;
    if (!matches.length || bestScore < 0.05) {
      return NextResponse.json({
        ok: true,
        answer:
          "Maaf, aku belum menemukan informasi yang relevan di basis data. Silakan chat kami via WhatsApp ya 😊",
        references: [],
      });
    }

    // 3) Rangkai jawaban pakai konteks
    const userPrompt = buildUserPrompt(question, matches);
    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const answer =
      chat.choices?.[0]?.message?.content?.trim() ||
      "Maaf, aku belum menemukan informasi yang relevan di basis data. Silakan chat kami via WhatsApp ya 😊";

    return NextResponse.json({
      ok: true,
      answer,
      references: matches.map((m) => ({ source: m.source, score: m.score })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
