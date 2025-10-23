"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// NOTE: endpoint baru, kalau kamu sudah bikin /api/ingest2 pakai ini.
// Kalau masih /api/ingest, ubah jadi "/api/ingest".
const API_PATH = "/api/ingest2";

export default function IngestPage() {
  const [source, setSource] = useState("faq-" + new Date().toISOString().slice(0, 10));
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onIngest() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, text }),
      });
      const data = await res.json();
      setMsg(data.ok ? `✅ Inserted ${data.inserted} chunks` : `❌ ${data.error}`);
    } catch (e: unknown) {
      setMsg(`❌ ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-3">
      <h1 className="text-xl font-semibold">Upload FAQ / Katalog → Embedding</h1>

      <div className="space-y-2">
        <label className="text-sm">Source (nama dataset)</label>
        <Input value={source} onChange={(e) => setSource(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-sm">Teks (FAQ/katalog). Format bebas, disarankan Q/A.</label>
        {/* Textarea native: tidak butuh import */}
        <textarea
          rows={14}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full min-h-[220px] rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          placeholder={`Contoh:\nQ: Alamat toko?\nA: Jl. Cemara No 13B, Gejayan, Depok, Sleman.`}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={onIngest} disabled={loading}>
          {loading ? "Memproses..." : "Ingest"}
        </Button>
      </div>

      {msg && <p className="text-sm">{msg}</p>}
    </main>
  );
}
