// src/app/api/whatsapp/process-pending/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsapp } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST() {
  try {
    const now = new Date().toISOString();
    // ambil pending jobs yang waktunya tiba dan belum sent
    const { data: rows, error } = await supabase
      .from("pending_auto_replies")
      .select("id, conversation_id, reason, created_at")
      .lte("send_after", now)
      .eq("sent", false)
      .limit(50);

    if (error) throw error;
    if (!rows || rows.length === 0) return NextResponse.json({ ok: true, processed: 0 });

    let processed = 0;
    for (const r of rows) {
      const convId = r.conversation_id as string;

      // cek apakah admin sudah membalas setelah job dibuat
      const { data: lastAdminRows } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", convId)
        .eq("from_admin", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastAdminRows && lastAdminRows.length) {
        // admin sudah balas → tandai job sent (skip)
        await supabase.from("pending_auto_replies").update({ sent: true }).eq("id", r.id);
        continue;
      }

      // ambil phone
      const { data: conv } = await supabase.from("conversations").select("phone").eq("id", convId).limit(1).single();
      if (!conv) {
        await supabase.from("pending_auto_replies").update({ sent: true }).eq("id", r.id);
        continue;
      }
      const phone = conv.phone as string;

      // Construct reply (template), atau gunakan OPENAI bila ada
      let replyText = "Hai, terima kasih sudah menghubungi COVAPOSH — admin sedang sibuk. Kami akan balas secepatnya. Sementara itu cek katalog: https://covaposh-catalog.vercel.app";

      if (process.env.OPENAI_API_KEY) {
        try {
          const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: "Kamu asisten ramah untuk toko COVAPOSH. Buat 1 pesan singkat ramah: admin sedang sibuk, akan balas sebentar, sertakan link katalog." },
              ],
              temperature: 0.6,
              max_tokens: 80,
            }),
          });
          if (openaiRes.ok) {
            const j = await openaiRes.json();
            const content = j?.choices?.[0]?.message?.content;
            if (content && typeof content === "string") replyText = content.trim();
          }
        } catch (e) {
          console.warn("OpenAI generation failed:", e);
        }
      }

      try {
        await sendWhatsapp(phone, replyText);
        // simpan message sebagai from_admin (bot)
        await supabase.from("messages").insert({
          conversation_id: convId,
          from_admin: true,
          body: replyText,
        });
        // mark pending as sent
        await supabase.from("pending_auto_replies").update({ sent: true }).eq("id", r.id);
        processed++;
      } catch (e) {
        console.error("Failed to send WA for pending id", r.id, e);
        // biarkan untuk retry nanti
      }
    }

    return NextResponse.json({ ok: true, processed });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("process-pending error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
