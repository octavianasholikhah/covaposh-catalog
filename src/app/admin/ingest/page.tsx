"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// ❌ hapus import Textarea custom yang bikin error

export default function IngestPage() {
  const [source, setSource] = useState("faq-" + new Date().toISOString().slice(0, 10));
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // fungsi kirim teks ke API ingest
  async function onIngest() {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, text }),
    });
    const data = await res.json();
    setMsg(data.ok ? `✅ Inserted ${data.inserted} chunks` : `❌ ${data.error}`);
    setLoading(false);
  }

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-3">
      <h1 className="text-xl font-semibold">Upload FAQ / Katalog → Embedding</h1>

      {/* Input nama sumber dataset */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Source (nama dataset)</label>
        <Input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="contoh: faq-covaposh"
        />
      </div>

      {/* Textarea untuk FAQ */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Teks (FAQ/katalog). Format bebas, disarankan Q/A.
        </label>
        <textarea
          rows={14}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Contoh:\nQ: Alamat toko?\nA: Jl. Cemara No 13B, Gejayan, Depok, Sleman.\n\nQ: Apakah bisa custom warna?\nA: Bisa, tulis catatan warna/tema saat pemesanan.`}
          className="w-full min-h-[240px] rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
        />
      </div>

      {/* Tombol kirim */}
      <div className="flex gap-2">
        <Button onClick={onIngest} disabled={loading}>
          {loading ? "Memproses..." : "Ingest"}
        </Button>
      </div>

      {/* Pesan sukses/error */}
      {msg && <p className="text-sm mt-2">{msg}</p>}
    </main>
  );
}
