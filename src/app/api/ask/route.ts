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
type FaqChunkRow = { source: string; chunk: string };

const SYSTEM_PROMPT =
  "Kamu adalah asisten toko buket COVAPOSH. Jawab SINGKAT dan akurat HANYA dari KONTEN. " +
  "Jika tidak ada info relevan di KONTEN, katakan belum ada di basis data dan arahkan ke WhatsApp.";

// Stopword ringan biar fallback keyword lebih bersih
const STOPWORDS = new Set([
  "di","ke","dan","atau","yang","apa","kapan","dimana","dimana?","berapa","bagaimana",
  "untuk","ada","bisa","kah","sih","ya","ga","nggak","ngga","itu","ini","sama","dengan"
]);

function pickKeywords(q: string, max = 5) {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(w => w && !STOPWORDS.has(w))
    .slice(0, max);
}

function dedupeByChunk<T extends { chunk: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of rows) {
    if (!seen.has(r.chunk)) {
      seen.add(r.chunk);
      out.push(r);
    }
  }
  return out;
}

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
    "- Jika beberapa potongan relevan, rangkum jadi 1 jawaban pendek.",
    "",
    `PERTANYAAN: ${q}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    // Lebih realistis untuk parafrase: topK lebih besar & threshold moderat
    const { question, topK = 8, threshold = 0.45 } = (await req.json()) as {
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

    // 2) Ambil konteks vektor via RPC (fungsi SQL mengembalikan 'score' = 1 - distance)
    const { data: vecData, error: vecErr } = await supabase.rpc("match_faq_chunks", {
      query_embedding: queryEmbedding,
      match_count: Math.min(Math.max(topK, 1), 10),
      similarity_threshold: Math.min(Math.max(threshold, 0), 0.99),
    });
    if (vecErr) {
      return NextResponse.json(
        { ok: false, stage: "match_faq_chunks", error: vecErr.message ?? String(vecErr) },
        { status: 500 }
      );
    }
    const vecMatches: MatchRow[] = (vecData ?? []) as MatchRow[];

    // 2b) Hybrid fallback: keyword search kalau hasil vektor tipis/kurang yakin
    const bestScore = vecMatches.length ? Math.max(...vecMatches.map(m => m.score)) : 0;
    const needFallback = vecMatches.length === 0 || bestScore < 0.5;

    let hybrid: MatchRow[] = vecMatches;

    if (needFallback) {
      const kw = pickKeywords(question);
      if (kw.length) {
        const { data: kwData } = await supabase
          .from("faq_chunks")
          .select("source, chunk")
          .or(kw.map(k => `chunk.ilike.%${k}%`).join(","))
          .limit(Math.min(Math.max(topK, 1), 10));

        const kwRows: MatchRow[] = (kwData ?? []).map((r) => {
          const row = r as FaqChunkRow;
          return { source: row.source, chunk: row.chunk, score: 0.51 }; // beri skor sedikit di atas ambang
        });

        if (kwRows.length) {
          hybrid = dedupeByChunk([...vecMatches, ...kwRows]).slice(0, Math.max(topK, 6));
        }
      }
    }

    if (!hybrid.length) {
      return NextResponse.json({
        ok: true,
        answer:
          "Maaf, aku belum menemukan informasi yang relevan di basis data. Silakan chat kami via WhatsApp ya 😊",
        references: [],
      });
    }

    // 3) Rangkai jawaban dari konteks terpilih (hybrid)
    const userPrompt = buildUserPrompt(question, hybrid);
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
      references: hybrid.map((m) => ({ source: m.source, score: m.score })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
