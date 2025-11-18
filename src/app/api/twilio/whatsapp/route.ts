// src/app/api/twilio/whatsapp/route.ts
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const XML_HEADERS = { "Content-Type": "text/xml; charset=utf-8" };

function twimlMessage(text: string) {
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${esc}</Message></Response>`;
}

async function nluGPT(message: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Kamu adalah asisten katalog produk. Jawab ringkas, ramah, dan dalam bahasa Indonesia." },
        { role: "user", content: message },
      ],
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 200)}`);
  }

  const j = await res.json();
  return j?.choices?.[0]?.message?.content?.trim() || "Maaf, saya belum bisa menjawab.";
}

export async function POST(req: NextRequest) {
  try {
    // Twilio kirim application/x-www-form-urlencoded
    const raw = await req.text();
    const params = new URLSearchParams(raw);
    const from = params.get("From") || "";
    const body = (params.get("Body") || "").trim();

    console.log(`[TWILIO] From=${from} Body=${body}`);

    // quick test route
    if (!body) {
      const xml = twimlMessage("Halo! Ketik pertanyaanmu ya.");
      return new Response(xml, { headers: XML_HEADERS, status: 200 });
    }
    if (body.toLowerCase() === "ping") {
      const xml = twimlMessage("pong ✅ (Webhook aktif)");
      return new Response(xml, { headers: XML_HEADERS, status: 200 });
    }

    // proses NLU (OpenAI)
    const reply = await nluGPT(body);

    const xml = twimlMessage(reply);
    return new Response(xml, { headers: XML_HEADERS, status: 200 });
  } catch (err: any) {
    console.error("[TWILIO WEBHOOK ERR]", err?.message || err);
    const xml = twimlMessage("Maaf, terjadi kesalahan pada server.");
    return new Response(xml, { headers: XML_HEADERS, status: 200 });
  }
}
