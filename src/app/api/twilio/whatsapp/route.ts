// src/app/api/twilio/whatsapp/route.ts
import { NextRequest } from "next/server";
import { twiml } from "twilio";
import axios from "axios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ===== NLU (GPT atau Dialogflow)
async function nluGPT(message: string) {
  const apiKey = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const systemPrompt =
    "Kamu adalah asisten katalog produk. Jawab ringkas, ramah, dan dalam bahasa Indonesia.";

  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    },
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  return res.data.choices?.[0]?.message?.content?.trim() || "Maaf, saya tidak bisa menjawab.";
}

export async function POST(req: NextRequest) {
  try {
    // Twilio kirim dengan application/x-www-form-urlencoded
    const raw = await req.text();
    const params = new URLSearchParams(raw);

    const from = params.get("From") || "";
    const body = (params.get("Body") || "").trim();

    console.log(`Pesan masuk dari ${from}:`, body);

    // Proses pakai GPT (kamu bisa ganti ke Dialogflow nanti)
    const reply = await nluGPT(body);

    // Buat balasan Twilio (format TwiML)
    const response = new twiml.MessagingResponse();
    response.message(reply);

    return new Response(response.toString(), {
      headers: { "Content-Type": "application/xml" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Error di webhook Twilio:", err);
    const response = new twiml.MessagingResponse();
    response.message("Maaf, terjadi kesalahan pada server.");
    return new Response(response.toString(), {
      headers: { "Content-Type": "application/xml" },
      status: 200,
    });
  }
}
