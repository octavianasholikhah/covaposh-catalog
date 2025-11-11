// src/app/api/twilio/whatsapp/route.ts
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- NLU via OpenAI (pakai fetch bawaan)
async function nluGPT(message: string) {
  const apiKey = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Kamu asisten katalog. Jawab ringkas dan sopan (Indonesia)." },
        { role: "user", content: message },
      ],
    }),
  });
  const j = await res.json();
  return j?.choices?.[0]?.message?.content?.trim() || "Maaf, saya belum bisa menjawab.";
}

// --- Buat TwiML manual (tanpa lib twilio)
function twimlMessage(text: string) {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${esc}</Message></Response>`;
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();                    // form-urlencoded dari Twilio
    const params = new URLSearchParams(raw);
    const body = (params.get("Body") || "").trim();

    const reply = body ? await nluGPT(body) : "Halo! Ketik pertanyaanmu ya.";
    const xml = twimlMessage(reply);

    return new Response(xml, { headers: { "Content-Type": "application/xml" }, status: 200 });
  } catch (e) {
    const xml = twimlMessage("Maaf, server mengalami kendala. Coba lagi ya.");
    return new Response(xml, { headers: { "Content-Type": "application/xml" }, status: 200 });
  }
}
