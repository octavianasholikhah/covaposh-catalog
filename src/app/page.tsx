'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingCart, Filter, ChevronLeft, ChevronRight, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ChatHint from '@/components/ui/ChatHint';

import {
  PRODUCTS, PRICE_MIN, PRICE_MAX,
  CATEGORIES, type Category, type RealCategory, type Product, WA_NUMBER,
} from '@/data/products';

// --- UI const ---
const CONTAINER = 'w-full max-w-[1400px] xl:max-w-[1500px] mx-auto px-3 sm:px-4';
const TAGLINE_LINES = [
  'Hadiah bukan tentang harga, tapi tentang niat dan makna.',
  'Setiap buket kami rangkai dengan ketelitian dan cinta 🌷💗',
  'Untuk perayaan kecil atau besar, kami siap bantu kamu membuatnya berkesan.',
];
const SLOGAN = 'We Sell the Sign of Love';
const MAP_URL = 'https://maps.app.goo.gl/DhhRScPU9Sxp3rMd9?g_st=ic';
const IG_URL = 'https://instagram.com/covaposh';
const ADDRESS = 'Jl. Cemara No 13B, Gejayan, Condongcatur, Depok, Sleman';
const HOURS = '09:00–17:00';
const MAP_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.3562729798973!2d110.39351707588605!3d-7.751984476865922!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a59098b7d313b%3A0xdbf7906887ffe497!2sJl.%20Cemara%20No.13%2C%20Ngabean%20Wetan%2C%20Sinduharjo%2C%20Kec.%20Ngaglik%2C%20Kabupaten%20Sleman%2C%20Daerah%20Istimewa%20Yogyakarta%2055281!5e0!3m2!1sen!2sid!4v1760527829148!5m2!1sen!2sid';

type Sort = 'termurah' | 'termahal' | 'az';

const fmtIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const priceLabel = (p: Product) => (p.price == null ? 'Harga via chat' : fmtIDR(p.price));

const waText = (p: Product) =>
  `Halo COVAPOSH, saya ingin pesan:\n` +
  `• Produk: ${p.name} (${p.id})\n` +
  `• Harga: ${p.price == null ? '(via chat)' : fmtIDR(p.price)}\n` +
  `• Tanggal/Jam kirim: …\n• Alamat: …\n• Catatan warna/tema: …`;

const sorters: Record<Sort, (a: Product, b: Product) => number> = {
  termurah: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
  termahal: (a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity),
  az: (a, b) => a.name.localeCompare(b.name),
};

export default function Page() {
  // default 'SEMUA'
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<Category>('SEMUA');
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [sort, setSort] = useState<Sort>('termurah');

  const filtered = useMemo(() => {
    const byText = (p: Product) => p.name.toLowerCase().includes(search.toLowerCase());
    const byCat  = (p: Product) => cat === 'SEMUA' || p.category === cat;
    const byPrice = (p: Product) => p.price == null || p.price <= maxPrice;
    return PRODUCTS.filter(p => byCat(p) && byText(p) && byPrice(p)).sort(sorters[sort]);
  }, [search, cat, maxPrice, sort]);

  // sections (termasuk BUKET SNACK)
  const sections = useMemo(() => {
    const s: Record<RealCategory, Product[]> = {
      'BUKET READY': [],
      'BUNGA ARTIFICIAL': [],
      'PRICELIST VIA CHAT': [],
      'BUKET SNACK': [],
    };
    for (const p of filtered) s[p.category].push(p);
    return s;
  }, [filtered]);

  const openWA = (p: Product) =>
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText(p))}`, '_blank', 'noopener,noreferrer');

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header search={search} setSearch={setSearch} />
      <ChatHint />
      <MovingTagline />

      <section className={`${CONTAINER} py-6`}>
        <Filters
          cat={cat}
          setCat={setCat}
          sort={sort}
          setSort={setSort}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
        />

        {(cat !== 'SEMUA' || search) ? (
          <>
            <h2 className="text-xl font-semibold mb-3 text-gray-700">
              {cat !== 'SEMUA' ? cat : 'Hasil Pencarian'}
            </h2>
            <CarouselRow products={filtered} onOrder={openWA} />
          </>
        ) : (
          (['BUKET READY', 'BUNGA ARTIFICIAL', 'PRICELIST VIA CHAT', 'BUKET SNACK'] as const).map((sec) => (
            <div key={sec} className="mb-10">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-lg font-semibold">{sec}</h3>
                <button className="text-sm text-pink-600 hover:underline" onClick={() => setCat(sec)}>
                  Lihat semua
                </button>
              </div>
              <CarouselRow products={sections[sec]} onOrder={openWA} />
            </div>
          ))
        )}
      </section>

      <About />

      <footer className="text-center py-6 text-gray-500 text-sm border-t">
        © {new Date().getFullYear()} <span className="font-semibold text-pink-600">COVAPOSH</span>. All rights reserved.
      </footer>

      {/* Floating Chatbot */}
      <Link
        href="/chat"
        aria-label="Buka Chatbot COVAPOSH"
        className="fixed bottom-5 right-28 z-50 rounded-full shadow-xl px-5 py-3 bg-black text-white font-semibold hover:bg-gray-900"
      >
        <span className="inline-flex items-center gap-2">
          <Bot size={18} /> Chatbot
        </span>
      </Link>

      {/* Floating WhatsApp */}
      <button
        onClick={() =>
          window.open(
            `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo COVAPOSH! Saya mau pesan buket 😊')}`,
            '_blank',
            'noopener,noreferrer'
          )
        }
        className="fixed bottom-5 right-5 z-50 rounded-full shadow-xl px-5 py-3 bg-pink-600 text-white font-semibold hover:bg-pink-700"
        aria-label="Chat WhatsApp COVAPOSH"
      >
        Chat WhatsApp
      </button>
    </main>
  );
}

// ---------- Sub-komponen ----------
function Header({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-pink-100 z-10">
      <div className={`${CONTAINER} flex flex-wrap gap-3 justify-between items-center py-4`}>
        <h1 className="text-2xl font-bold text-pink-600">COVAPOSH</h1>

        <div className="flex-1 max-w-2xl flex items-center gap-2">
          <Search className="text-gray-500" />
          <Input placeholder="Cari produk…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/pesanan" aria-label="Lihat pesanan" className="flex items-center gap-2">
              <ShoppingCart size={18} /> Pesanan
            </Link>
          </Button>
          {/* Chatbot header button DIHILANGKAN */}
        </div>
      </div>
    </header>
  );
}

function Filters(props: {
  cat: Category; setCat: (c: Category) => void;
  sort: Sort; setSort: (s: Sort) => void;
  maxPrice: number; setMaxPrice: (n: number) => void;
}) {
  const { cat, setCat, sort, setSort, maxPrice, setMaxPrice } = props;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 rounded-xl bg-white p-3 shadow-sm border border-pink-100">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Button key={c} variant={cat === c ? 'default' : 'outline'} className="rounded-2xl" onClick={() => setCat(c)}>
            {c}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
        <div className={cat === 'PRICELIST VIA CHAT' ? 'hidden sm:block opacity-40 pointer-events-none' : ''}>
          <label className="block text-xs text-gray-500">Batas harga: {fmtIDR(Math.min(maxPrice, PRICE_MAX))}</label>
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={50000}
            value={Math.min(maxPrice, PRICE_MAX)}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            disabled={cat === 'PRICELIST VIA CHAT'}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} />
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="border rounded-md px-2 py-1 text-sm">
            <option value="termurah">Harga terendah</option>
            <option value="termahal">Harga tertinggi</option>
            <option value="az">Nama (A–Z)</option>
          </select>
        </div>

        <div>
          WhatsApp{' '}
          <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" className="font-semibold text-pink-600 hover:underline">
            +62 857-1626-1499
          </a>
        </div>
      </div>
    </div>
  );
}

function CarouselRow({ products, onOrder }: { products: Product[]; onOrder: (p: Product) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const jump = (dir: 'left' | 'right') => {
    const el = ref.current; if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const w = card ? card.offsetWidth + 16 : 260;
    el.scrollBy({ left: dir === 'left' ? -w * 2.5 : w * 2.5, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="pointer-events-auto rounded-xl shadow bg-white/90 hover:bg-white"
          onClick={() => jump('left')}
          aria-label="Geser kiri"
        >
          <ChevronLeft />
        </Button>
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="pointer-events-auto rounded-xl shadow bg-white/90 hover:bg-white"
          onClick={() => jump('right')}
          aria-label="Geser kanan"
        >
          <ChevronRight />
        </Button>
      </div>

      <div ref={ref} className="flex overflow-x-auto gap-4 pb-4 pr-6 scroll-smooth snap-x snap-mandatory" aria-label="Daftar produk">
        {products.map((p) => (
          <motion.div
            key={p.id}
            data-card
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.18 }}
            className="min-w-[220px] sm:min-w-[240px] md:min-w-[260px] snap-start flex-shrink-0 h-full"
          >
            <Card className="h-full flex flex-col overflow-hidden shadow-sm hover:shadow-md">
              <div className="relative bg-pink-100 aspect-[4/5]">
                <Image
                  src={p.image}
                  alt={`Foto ${p.name}`}
                  title={p.name}
                  fill
                  sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw"
                  className="object-cover"
                />
              </div>
              <CardContent className="p-3 flex flex-col grow">
                <h4 className="font-semibold text-base text-gray-800 line-clamp-2 min-h-[48px] leading-6">
                  {p.name}
                </h4>
                <p className={`font-medium mt-1 text-sm ${p.price == null ? 'text-amber-600' : 'text-pink-600'}`}>
                  {priceLabel(p)}
                </p>
                <div className="mt-auto flex justify-between items-center pt-2">
                  <Badge variant="secondary" className="text-[10px] h-6 flex items-center">
                    {p.category}
                  </Badge>
                  <Button
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => onOrder(p)}
                    aria-label={`Pesan ${p.name}`}
                  >
                    Pesan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MovingTagline() {
  const text = TAGLINE_LINES.join('   •   ');
  return (
    <div className="bg-pink-100/70 text-pink-800 border-b border-pink-100">
      <div className={`${CONTAINER}`}>
        <div className="relative h-10 sm:h-11 overflow-hidden flex items-center">
          <motion.div
            className="flex whitespace-nowrap gap-12 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] will-change-transform"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          >
            <span className="text-xs sm:text-sm font-medium">{text}</span>
            <span className="text-xs sm:text-sm font-medium" aria-hidden>
              {text}
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function About() {
  return (
    <section className={`${CONTAINER} pb-10`}>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Kiri: deskripsi */}
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-5">
          <h3 className="text-lg font-semibold mb-2">Tentang COVAPOSH</h3>
          <div className="space-y-1 text-gray-700">
            <p>{TAGLINE_LINES[0]}</p>
            <p>{TAGLINE_LINES[1]}</p>
            <p>{TAGLINE_LINES[2]}</p>
          </div>
          <p className="mt-3 italic text-pink-600 font-semibold">— {SLOGAN}</p>

          <div className="mt-4 space-y-1 text-sm">
            <div><span className="font-medium">Alamat:</span> {ADDRESS}</div>
            <div><span className="font-medium">Jam buka:</span> {HOURS}</div>
            <div>
              <span className="font-medium">Instagram:</span>{' '}
              <a href={IG_URL} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline">@covaposh</a>
            </div>
            <div>
              <span className="font-medium">WhatsApp:</span>{' '}
              <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline">
                +62 857-1626-1499
              </a>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => window.open(`https://wa.me/${WA_NUMBER}`, '_blank', 'noopener,noreferrer')}>
              Chat WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(MAP_URL, '_blank', 'noopener,noreferrer')}
            >
              Lihat di Maps
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(IG_URL, '_blank', 'noopener,noreferrer')}
            >
              Instagram
            </Button>
          </div>
        </div>

        {/* Kanan: peta */}
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden">
          <iframe
            title="Lokasi COVAPOSH di Google Maps"
            src={MAP_EMBED_URL}
            className="w-full h-[340px] md:h-[420px] border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
