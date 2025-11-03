// src/lib/whatsapp.ts
export async function sendWhatsapp(to: string, text: string) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!phoneId || !token) throw new Error("WHATSAPP_PHONE_ID / WHATSAPP_TOKEN belum terpasang.");

  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`WA send failed: ${res.status} ${JSON.stringify(j).slice(0, 400)}`);
  return j;
}
