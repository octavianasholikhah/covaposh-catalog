'use client';

import Link from 'next/link';
import { Bot, MessageSquare } from 'lucide-react';

export default function ChatHint() {
  return (
    <div className="bg-pink-50 border-y border-pink-100 text-pink-800">
      <div className="w-full max-w-[1400px] xl:max-w-[1500px] mx-auto px-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 py-2">
          <p className="text-sm flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Ada pertanyaan soal katalog? Tanyakan ke chatbot kami ya 💬
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-full bg-pink-600 text-white px-3 py-1.5 text-sm hover:bg-pink-700"
            aria-label="Buka Chatbot COVAPOSH"
          >
            <MessageSquare className="w-4 h-4" />
            Buka Chatbot
          </Link>
        </div>
      </div>
    </div>
  );
}
