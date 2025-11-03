// src/app/api/whatsapp/webhook/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/** Types matching the common WhatsApp Cloud webhook shape we expect */
type WhatsAppMessage = {
  from: string;
  id?: string;
  text?: { body?: string };
};

type WebhookValue = {
  messages?: WhatsAppMessage[];
  // other fields we don't need here can be present
};

type WebhookChange = {
  value?: WebhookValue;
};

type WebhookEntry = {
  changes?: WebhookChange[];
};

type WebhookPayload = {
  entry?: WebhookEntry[];
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Health check and verification (for Facebook verify token) */
export async function GET(req: Request) {
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

export async function POST(req: Request) {
  try {
    // parse as unknown then assert shape via runtime checks
    const body = (await req.json()) as unknown;

    if (!isObject(body)) {
      return NextResponse.json({ ok: false, error: "Invalid webhook payload" }, { status: 400 });
    }

    const payload = body as WebhookPayload;
    const entries = Array.isArray(payload.entry) ? payload.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change.value;
        if (!value || !Array.isArray(value.messages)) continue;

        for (const msg of value.messages) {
          // basic validation
          if (!msg || typeof msg.from !== "string") continue;
          const from = msg.from;
          const text = typeof msg.text?.body === "string" ? msg.text.body.trim() : "";

          if (!text) {
            // no text to process
            continue;
          }

          // 1) Find or create conversation for this phone
          const { data: convRows } = await supabase
            .from("conversations")
            .select("id")
            .eq("phone", from)
            .limit(1);

          let convId: string | undefined = convRows?.[0]?.id;

          if (!convId) {
            const insert = await supabase.from("conversations").insert({ phone: from }).select("id").single();
            convId = insert.data?.id;
          }

          if (!convId) {
            console.warn("Failed to create/find conversation for", from);
            continue;
          }

          // 2) Insert incoming message (from user)
          await supabase.from("messages").insert({
            conversation_id: convId,
            from_admin: false,
            body: text,
            whatsapp_message_id: msg.id ?? null,
          });

          // 3) Schedule pending auto-reply in ADMIN_TIMEOUT_MINUTES
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
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("whatsapp webhook error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
