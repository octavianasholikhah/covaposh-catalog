// src/app/api/ingest/route.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ====== Konfigurasi Next.js route ======
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ====== Typings untuk hasil API OpenRouter ======
type OpenRouterEmbeddingResponse = {
  data: { embedding: number[] }[];
};

// ====== Lazy init Supabase (server-side only) ======
let _sb: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  if (_sb) return _sb;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum terpasang.');
  }

  _sb = createClient(url, key, { auth: { persistSession: false } });
  return _sb;
}

// ====== Chunker: pecah teks menjadi potongan pendek agar embedding stabil ======
function splitIntoChunks(text: string, maxWords = 180, overlap = 40): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += Math.max(1, maxWords - overlap)) {
    const part = words.slice(i, i + maxWords).join(' ').trim();
    if (part) chunks.push(part);
  }
  return chunks;
}

// ====== Minta embedding via OpenRouter (gratis/stabil) ======
async function embedWithOpenRouter(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY belum terpasang.');

  const referer = process.env.APP_URL ?? 'https://covaposh-catalog.vercel.app';

  const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': referer,         // disarankan OpenRouter
      'X-Title': 'COVAPOSH Catalog',   // disarankan OpenRouter
    },
    body: JSON.stringify({
      // Model embedding 768-dim yang stabil & free (saat ini)
      model: 'nomic-ai/nomic-embed-text-v1.5',
      input: texts,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embed error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as OpenRouterEmbeddingResponse;
  return data.data.map((d) => d.embedding);
}

// ====== Handler POST: terima source + text, simpan ke Supabase ======
export async function POST(req: Request) {
  try {
    const { source, text } = await req.json();

    if (!text || !String(text).trim()) {
      return Response.json({ ok: false, error: 'Teks kosong.' }, { status: 400 });
    }

    const dataset = (source && String(source).trim()) || 'faq-' + new Date().toISOString().slice(0, 10);

    // 1) pecah teks
    const chunks = splitIntoChunks(String(text));

    if (chunks.length === 0) {
      return Response.json({ ok: false, error: 'Tidak ada potongan teks yang valid.' }, { status: 400 });
    }

    // 2) minta embedding dari OpenRouter
    const embeddings = await embedWithOpenRouter(chunks);
    if (embeddings.length !== chunks.length) {
      throw new Error('Panjang embeddings tidak sama dengan chunks.');
    }

    // 3) simpan batch ke Supabase
    const rows = chunks.map((chunk, i) => ({
      source: dataset,
      chunk,
      embedding: embeddings[i], // PostgreSQL vector[] menerima number[]
    }));

    const { error } = await supabase().from('faq_chunks').insert(rows);
    if (error) throw error;

    return Response.json({ ok: true, inserted: rows.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[INGEST_ERROR]', msg);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
