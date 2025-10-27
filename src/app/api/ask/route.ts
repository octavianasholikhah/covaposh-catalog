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

// Bentuk baris hasil RPC/keyword
type MatchRow = { source: string; chunk: string; score: number };

// Bentuk baris tabel faq_chunks (untuk fallback keyword)
type FaqChunkRow = { source: string; chunk: string };

const SYSTEM_PROMPT =
  "Kamu adalah asisten toko buket COVAPOSH. Jawab SINGKAT, jelas, dan sopan. " +
  "KAMU HANYA BOLEH memakai informasi dari KONTEN yang diberikan. " +
  "Jika tidak ada info relevan di KONTEN, katakan belum punya dan arahkan ke WhatsApp.";

function buildUserPrompt(q: string, ctx: MatchRow[]) {
  const contextText =
    ctx.length === 0
      ? "(tidak ada konteks yang cocok)"
      : ctx.map((c, i) => `#${i + 1} [${c.source}] ${c.chunk}`).join("\n");
  return [
    "KONTEN (gunakan hanya ini untuk menjawab):",
    contextText,
    "",
    "TUGAS:",
    "- Jawab pertanyaan memakai KONTEN di atas.",
    "- Jika tidak ada jawaban relevan di KONTEN, katakan belum punya informasinya.",
    "- Jika ada alamat/jam/produk/harga, sebutkan ringkas.",
    "",
    `PERTANYAAN: ${q}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { question, topK = 5, threshold = 0.2 } = (await req.json()) as {
      question: string;
      topK?: number;
      threshold?: number;
    };

    if (!question?.trim()) {
      return NextResponse.json({ ok: false, error: "Body {question} kosong" }, { status: 400 });
    }

    const openai = getOpenAI();
    const supabase = getSupabase();

    // 1) Embedding pertanyaan
    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });
    const queryEmbedding: number[] = embRes.data[0].embedding;

    // 2) Cari konteks via RPC (pastikan fungsi menerima 3 argumen sesuai schema)
    const {
      data: rpcData,
      error: rpcError,
    } = await supabase.rpc("match_faq_chunks", {
      query_embedding: queryEmbedding,
      match_count: Math.min(Math.max(topK, 1), 10),
      similarity_threshold: Math.min(Math.max(threshold, 0), 0.99),
    });

    let matches: MatchRow[] = (rpcData ?? []) as MatchRow[];

    // 2b) Fallback jika hasil vektor kosong → keyword search sederhana
    if (!matches.length) {
      const kw = question
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3);

      if (kw.length) {
        const { data: kwData } = await supabase
          .from<FaqChunkRow>("faq_chunks")
          .select("source, chunk")
          .or(kw.map((k) => `chunk.ilike.%${k}%`).join(","))
          .limit(topK);

        if (kwData?.length) {
          matches = kwData.map((r) => ({
            source: r.source,
            chunk: r.chunk,
            score: 0.0,
          }));
        }
      }
    }

    if (!matches.length) {
      return NextResponse.json({
        ok: true,
        answer:
          "Maaf, aku belum menemukan informasi yang relevan di basis data. Silakan chat kami via WhatsApp ya 😊",
        references: [],
      });
    }

    const userPrompt = buildUserPrompt(question, matches);
    const chatRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const answer =
      chatRes.choices?.[0]?.message?.content?.trim() ||
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
