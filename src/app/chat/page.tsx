"use client";
import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Halo! Aku asisten COVAPOSH. Tanyakan alamat, jam buka, atau produk ya 😊" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    const q = input.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      const reply =
        data.ok ? String(data.answer) : `Maaf, terjadi kesalahan: ${data.error ?? "unknown"}`;
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Maaf, server sedang bermasalah. Coba lagi sebentar ya." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-3">Chatbot COVAPOSH</h1>

      <div className="border rounded-lg p-3 h-[60vh] overflow-y-auto bg-white shadow-sm mb-3 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-3 py-2 rounded-md text-sm leading-6 whitespace-pre-wrap ${
              m.role === "user"
                ? "ml-auto bg-pink-100 text-pink-900"
                : "mr-auto bg-gray-100 text-gray-900"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="mr-auto text-sm text-gray-500 italic">asisten sedang menulis…</div>
        )}
      </div>

      <form onSubmit={onSend} className="flex gap-2">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tulis pertanyaan kamu di sini…"
          className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-pink-600 text-white px-4 py-2 disabled:opacity-60"
        >
          Kirim
        </button>
      </form>
    </main>
  );
}
