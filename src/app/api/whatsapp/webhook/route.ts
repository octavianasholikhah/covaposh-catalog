// src/app/api/whatsapp/webhook/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type WhatsAppMessage = {
  from: string;
  id?: string;
  text?: { body?: string };
};

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Struktur webhook WA: payload.entry[].changes[].value (sesuaikan kalau beda)
    const entries = payload?.entry ?? [];
    for (const e of entries as any[]) {
      const changes = e?.changes ?? [];
      for (const ch of changes) {
        const value = ch?.value;
        const messages: WhatsAppMessage[] = value?.messages ?? [];
        for (const m of messages) {
          const from = m.from;
          const text = (m.text?.body ?? "").trim();

          if (!from || !text) continue;

          // 1) find or create conversation
          const { data: convRows } = await supabase
            .from("conversations")
            .select("id")
            .eq("phone", from)
            .limit(1);

          let convId = convRows?.[0]?.id;
          if (!convId) {
            const insert = await supabase.from("conversations").insert({ phone: from }).select("id").single();
            convId = insert.data.id;
          }

          // 2) insert message (user)
          await supabase.from("messages").insert({
            conversation_id: convId,
            from_admin: false,
            body: text,
            whatsapp_message_id: m.id ?? null,
          });

          // 3) schedule pending auto-reply (in ADMIN_TIMEOUT_MINUTES)
          const minutes = Number(process.env.ADMIN_TIMEOUT_MINUTES ?? "5");
          const sendAfter = new Date(Date.now() + minutes * 60 * 1000).toISOString();
          await supabase.from("pending_auto_replies").insert({
            conversation_id: convId,
            reason: `no-admin-reply-${minutes}m`,
            send_after: sendAfter,
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("whatsapp webhook error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// GET minimal health check (Meta webhook verification if you use verify token)
export async function GET(req: Request) {
  // Support simple verify (hub.challenge)
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "";
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge ?? "ok", { status: 200 });
  }
  return NextResponse.json({ ok: true });
}
