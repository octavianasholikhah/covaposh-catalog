"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function IngestPage() {
  const [source, setSource] = useState("faq-" + new Date().toISOString().slice(0, 10));
  const [text, setText] = useState(
`Q: Metode pembayaran apa yang tersedia?
A: Transfer bank/e-wallet. Rincian akan kami kirim saat konfirmasi pesanan.

Q: Di mana lihat contoh produk?
A: Lihat katalog di situs atau Instagram @covaposh. Tiap kartu produk di situs menampilkan foto, nama, dan harga (jika tersedia).

Q: Apakah ada same-day order?
A: Ada untuk buket ready dan beberapa custom sederhana (selama material tersedia). Disarankan chat dulu untuk kepastian slot.

Q: Link Google Maps COVAPOSH?
A: https://maps.app.goo.gl/DhhRScPU9Sxp3rMd9`
  );

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onIngest() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, text }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMsg(`✅ Inserted ${data.inserted} chunks`);
      } else {
        setMsg(`❌ ${data.error || "Gagal ingest."}`);
      }
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-3">
      <h1 className="text-xl font-semibold">Upload FAQ / Katalog → Embedding</h1>

      <div className="space-y-2">
        <label className="text-sm">Source (nama dataset)</label>
        <Input value={source} onChange={(e)=>setSource(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-sm">Teks (FAQ/katalog). Format bebas, disarankan Q/A.</label>
        <Textarea rows={16} value={text} onChange={(e)=>setText(e.target.value)} />
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
