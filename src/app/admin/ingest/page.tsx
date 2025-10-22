"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// (opsional) import pembuat teks dari PRODUCTS biar cepat seed
// import { makeCatalogText } from "@/utils/makeCatalogText";

export default function IngestPage() {
  const [source, setSource] = useState("faq-" + new Date().toISOString().slice(0,10));
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onIngest() {
    setLoading(true); setMsg(null);
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

      <div className="space-y-2">
        <label className="text-sm">Source (nama dataset)</label>
        <Input value={source} onChange={(e)=>setSource(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-sm">Teks (FAQ/katalog). Format bebas, Q/A makin bagus.</label>
        <Textarea rows={14} value={text} onChange={(e)=>setText(e.target.value)} />
      </div>

      <div className="flex gap-2">
        {/* <Button variant="outline" onClick={()=>setText(makeCatalogText())}>Generate dari PRODUCTS</Button> */}
        <Button onClick={onIngest} disabled={loading}>
          {loading ? "Memproses..." : "Ingest"}
        </Button>
      </div>

      {msg && <p className="text-sm">{msg}</p>}
    </main>
  );
}
