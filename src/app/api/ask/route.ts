// app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

// --- helpers ---

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY belum terpasang.");
  return new OpenAI({ apiKey });
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum terpasang.");
  return createClient(url, key);
}

type MatchRow = { source: string; chunk: string; score: number };

const SYSTEM_PROMPT = `Kamu adalah asisten toko buket COVAPOSH. Jawab singkat, jelas, sopan.
Kalau jawab berdasarkan konteks, sebutkan info penting (alamat/jam/produk/harga).
Jika pertanyaan di luar konteks, jawab jujur bahwa kamu hanya bisa menjawab seputar COVAPOSH, dan arahkan ke WhatsApp.`;

function buildUserPrompt(question: string, contexts: MatchRow[]) {
  const contextText =
    contexts.length === 0
      ? "(tidak ada konteks yang cocok)"
      : contexts.map((c, i) => `#${i + 1} [${c.source}] ${c.chunk}`).join("\n");
  return `KONTEX:\n${contextText}\n\nPERTANYAAN:\n${question}\n\nJAWAB:`;
}

export async function POST(req: NextRequest) {
  try {
    const { question, topK = 6, threshold = 0.72 } = (await req.json()) as {
      question: string;
      topK?: number;
      threshold?: number;
    };

    if (!question?.trim()) {
      return NextResponse.json({ ok: false, error: "Body {question} kosong" }, { status: 400 });
    }

    const openai = getOpenAI();
    const supabase = getSupabase();

    // 1) embed pertanyaan
    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });
    const queryEmbedding = embRes.data[0].embedding;

    // 2) ambil top-k konteks dari Supabase (via RPC)
    const { data, error } = await supabase.rpc("match_faq_chunks", {
      query_embedding: queryEmbedding as unknown as number[],
      match_count: Math.min(Math.max(topK, 1), 10),
      similarity_threshold: Math.min(Math.max(threshold, 0), 0.99),
    });
    if (error) throw error;

    const matches: MatchRow[] = (data ?? []) as MatchRow[];

    // 3) panggil model untuk merangkai jawaban
    const userPrompt = buildUserPrompt(question, matches);
    const chatRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const answer = chatRes.choices[0]?.message?.content ?? "Maaf, saya tidak menemukan jawabannya.";
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
