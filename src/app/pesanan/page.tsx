'use client';

import { Button } from '@/components/ui/button';

const WA_NUMBER = '6285716261499';

export default function PesananPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <section className="w-full max-w-[900px] mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-pink-600 mb-2">Pesanan Anda</h1>
        <p className="text-gray-600 leading-relaxed">
          Saat ini fitur keranjang belum aktif. Anda dapat memesan langsung melalui WhatsApp
          dengan menyebutkan produk yang ingin dipesan.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() =>
              window.open(
                `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
                  'Halo COVAPOSH! Saya mau cek dan lanjutkan pesanan saya 😊'
                )}`,
                '_blank',
                'noopener,noreferrer'
              )
            }
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            Chat WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            Kembali
          </Button>
        </div>
      </section>
    </main>
  );
}
