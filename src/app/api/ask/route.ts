// src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

// ===== helpers =====
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

// Prompt yang “ketat” agar model hanya menjawab dari konteks
const SYSTEM_PROMPT =
  "Kamu adalah asisten toko buket COVAPOSH. " +
  "Jawab SINGKAT, jelas, dan sopan. " +
  "KAMU HANYA BOLEH menggunakan informasi dari KONTEN yang diberikan. " +
  "Jika tidak ada info yang relevan di KONTEN, katakan bahwa kamu belum punya informasinya dan sarankan hubungi WhatsApp.";

function buildUserPrompt(question: string, contexts: MatchRow[]) {
  const contextText =
    contexts.length === 0
      ? "(tidak ada konteks yang cocok)"
      : contexts.map((c, i) => `#${i + 1} [${c.source}] ${c.chunk}`).join("\n");

  return [
    "KONTEN (gunakan hanya ini untuk menjawab):",
    contextText,
    "",
    "TUGAS:",
    "- Jawab pertanyaan memakai KONTEN di atas.",
    "- Jika tidak ada jawaban relevan di KONTEN, katakan belum punya informasinya.",
    "- Jika ada alamat/jam/produk/harga, sebutkan dengan ringkas.",
    "",
    `PERTANYAAN: ${question}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { question, topK = 5, threshold = 0.6 } = (await req.json()) as {
      question: string;
      topK?: number;        // 1..10
      threshold?: number;   // 0..0.99 (semakin rendah semakin longgar)
    };

    if (!question?.trim()) {
      return NextResponse.json({ ok: false, error: "Body {question} kosong" }, { status: 400 });
    }

    const openai = getOpenAI();
    const supabase = getSupabase();

    // 1) Buat embedding pertanyaan
    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });
    const queryEmbedding: number[] = embRes.data[0].embedding;

    // 2) Ambil konteks dari Supabase (RPC match_faq_chunks harus vector(1536))
    const { data, error } = await supabase.rpc("match_faq_chunks", {
      query_embedding: queryEmbedding,
      match_count: Math.min(Math.max(topK, 1), 10),
      similarity_threshold: Math.min(Math.max(threshold, 0), 0.99),
    });
    if (error) {
      // kirim error yang jelas ke client biar gampang debug
      return NextResponse.json(
        { ok: false, stage: "match_faq_chunks", error: error.message ?? String(error) },
        { status: 500 },
      );
    }

    const matches: MatchRow[] = (data ?? []) as MatchRow[];

    // Jika tidak ada konteks yang relevan, jangan panggil model — balas khusus
    if (!matches.length) {
      return NextResponse.json({
        ok: true,
        answer:
          "Maaf, aku belum menemukan informasi yang relevan di basis data. Silakan chat kami via WhatsApp ya 😊",
        references: [],
      });
    }

    // 3) Rangkai jawaban menggunakan konteks terpilih
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
