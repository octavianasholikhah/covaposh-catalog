'use client';

import Link from 'next/link';
import { Bot } from 'lucide-react';

const CONTAINER = 'w-full max-w-[1400px] xl:max-w-[1500px] mx-auto px-3 sm:px-4';

export default function ChatHint() {
  return (
    <div className="bg-pink-50 border-b border-pink-100">
      <div className={`${CONTAINER} py-2 text-sm flex flex-wrap items-center gap-2`}>
        <span className="text-gray-700">
          Ada pertanyaan soal katalog?
        </span>
        <Link
          href="/chat"
          className="inline-flex items-center gap-1 text-pink-700 font-medium hover:underline"
          aria-label="Buka Chatbot COVAPOSH"
        >
          <Bot size={16} />
          Tanya ke chatbot kami
        </Link>
      </div>
    </div>
  );
}
