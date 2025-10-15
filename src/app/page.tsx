'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingCart, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const WA_NUMBER = '6285716261499';
const CATEGORIES = ['Semua', 'BUKET READY', 'BUNGA ARTIFICIAL'] as const;
type Category = (typeof CATEGORIES)[number];
type RealCategory = Exclude<Category, 'Semua'>;
type Sort = 'termurah' | 'termahal' | 'az';

// ----- container lebih lebar & padding lebih kecil
const CONTAINER = 'w-full max-w-[1200px] xl:max-w-[1280px] mx-auto px-3 sm:px-4';

type Product = {
  id: string;
  name: string;
  price: number;
  category: RealCategory;
  image: string;
};

const PRODUCTS: Product[] = [
  // --- BUKET READY ---
  { id: 'BR-295',  name: 'Buket Ready – Mawar Mix',         price: 295000, category: 'BUKET READY',     image: '/images/buket-ready/1.jpg' },
  { id: 'BR-250',  name: 'Buket Ready – Sunflower',         price: 250000, category: 'BUKET READY',     image: '/images/buket-ready/2.jpg' },
  { id: 'BR-165',  name: 'Buket Ready – Pastel Mini',       price: 165000, category: 'BUKET READY',     image: '/images/buket-ready/3.jpg' },
  { id: 'BR-200',  name: 'Buket Ready – Pink Lily',         price: 200000, category: 'BUKET READY',     image: '/images/buket-ready/4.jpg' },
  { id: 'BR-165b', name: 'Buket Ready – Red Rose',          price: 165000, category: 'BUKET READY',     image: '/images/buket-ready/5.jpg' },
  { id: 'BR-235',  name: 'Buket Ready – Pink Elegant',      price: 235000, category: 'BUKET READY',     image: '/images/buket-ready/6.jpg' },

  // --- BUNGA ARTIFICIAL ---
  { id: 'AR-235',  name: 'Bunga Artificial – Mini Red',     price: 235000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/1.jpg' },
  { id: 'AR-350',  name: 'Bunga Artificial – Pink Elegant', price: 350000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/2.jpg' },
  { id: 'AR-245',  name: 'Bunga Artificial – Blue Bloom',   price: 245000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/3.jpg' },
  { id: 'AR-650',  name: 'Buket bunga artificial premium',  price: 650000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/4.jpg' },
  { id: 'AR-300',  name: 'Bunga Artificial – Pink Soft',    price: 300000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/5.jpg' },
  { id: 'AR-265',  name: 'Bunga Artificial – Mix Classic',  price: 265000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/6.jpg' },
  { id: 'AR-120',  name: 'Bunga Artificial Mix Hologram',   price: 120000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/7.jpg' },
  { id: 'AR-100',  name: 'Buket bunga artificial',          price: 100000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/8.jpg' },
  { id: 'AR-150',  name: 'Buket foto mix',                  price: 150000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/9.jpg' },
  { id: 'AR-175',  name: 'Bunga Artificial – Mini Bouquet', price: 175000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/10.jpg' },
];

const PRICE_MIN = Math.min(...PRODUCTS.map(p => p.price));
const PRICE_MAX = Math.max(...PRODUCTS.map(p => p.price));

const fmtIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const waText = (p: Product) =>
  `Halo COVAPOSH, saya ingin pesan:\n` +
  `• Produk: ${p.name} (${p.id})\n` +
  `• Harga: ${fmtIDR(p.price)}\n` +
  `• Tanggal/Jam kirim: …\n` +
  `• Alamat: …\n` +
  `• Catatan warna/tema: …`;

export default function Page() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<Category>('Semua');
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [sort, setSort] = useState<Sort>('termurah');

  const filtered = useMemo(() => {
    let data = PRODUCTS.filter(
      (p) =>
        (cat === 'Semua' || p.category === cat) &&
        p.name.toLowerCase().includes(search.toLowerCase()) &&
        p.price <= maxPrice
    );
    if (sort === 'termurah') data = [...data].sort((a, b) => a.price - b.price);
    if (sort === 'termahal') data = [...data].sort((a, b) => b.price - a.price);
    if (sort === 'az') data = [...data].sort((a, b) => a.name.localeCompare(b.name));
    return data;
  }, [search, cat, maxPrice, sort]);

  const openWA = (p: Product) => {
    const text = waText(p);
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredBySection = useMemo(() => {
    const sections: Record<RealCategory, Product[]> = {
      'BUKET READY': [],
      'BUNGA ARTIFICIAL': [],
    };
    for (const p of filtered) sections[p.category].push(p);
    return sections;
  }, [filtered]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* HEADER */}
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-pink-100 z-10">
        <div className={`${CONTAINER} flex flex-wrap gap-3 justify-between items-center py-4`}>
          <h1 className="text-2xl font-bold text-pink-600">COVAPOSH</h1>

          <div className="flex-1 max-w-2xl flex items-center gap-2">
            <Search className="text-gray-500" />
            <Input
              placeholder="Cari produk…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button variant="outline" className="flex items-center gap-2">
            <ShoppingCart size={18} /> Pesanan
          </Button>
        </div>
      </header>

      {/* FILTER + GRID */}
      <section className={`${CONTAINER} py-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 rounded-xl bg-white p-3 shadow-sm border border-pink-100">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Button
                key={c}
                variant={cat === c ? 'default' : 'outline'}
                className="rounded-2xl"
                onClick={() => setCat(c)}
              >
                {c}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
            <div>
              <label className="block text-xs text-gray-500">
                Batas harga: {fmtIDR(maxPrice)}
              </label>
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={50000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="border rounded-md px-2 py-1 text-sm"
              >
                <option value="termurah">Harga terendah</option>
                <option value="termahal">Harga tertinggi</option>
                <option value="az">Nama (A–Z)</option>
              </select>
            </div>
            <div>
              WhatsApp:{' '}
              <a
                href={`https://wa.me/${WA_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-pink-600 hover:underline"
              >
                +62 857-1626-1499
              </a>
            </div>
          </div>
        </div>

        {(cat !== 'Semua' || search) ? (
          <>
            <h2 className="text-xl font-semibold mb-3 text-gray-700">
              {cat !== 'Semua' ? cat : 'Hasil Pencarian'}
            </h2>
            <Grid products={filtered} onOrder={openWA} />
          </>
        ) : (
          <>
            {(['BUKET READY', 'BUNGA ARTIFICIAL'] as const).map((section) => (
              <div key={section} className="mb-8">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-lg font-semibold">{section}</h3>
                  <button
                    className="text-sm text-pink-600 hover:underline"
                    onClick={() => setCat(section)}
                  >
                    Lihat semua
                  </button>
                </div>
                <Grid products={filteredBySection[section]} onOrder={openWA} />
              </div>
            ))}
          </>
        )}
      </section>

      {/* FOOTER */}
      <footer className="text-center py-6 text-gray-500 text-sm border-t mt-10">
        © {new Date().getFullYear()} <span className="font-semibold text-pink-600">COVAPOSH</span>. All rights reserved.
      </footer>

      {/* Floating WhatsApp */}
      <button
        onClick={() =>
          window.open(
            `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo COVAPOSH! Saya mau pesan buket 😊')}`,
            '_blank'
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

function Grid({ products, onOrder }: { products: Product[]; onOrder: (p: Product) => void }) {
  return (
    // auto-fill + stretch => baris rapat & tinggi sel seragam
    <div className="grid [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))] gap-4 items-stretch">
      {products.map((p) => (
        <motion.div key={p.id} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }} className="h-full">
          <Card className="h-full flex flex-col overflow-hidden shadow-sm hover:shadow-md">
            {/* gambar fixed ratio => tinggi gambar sama */}
            <div className="relative bg-pink-100 aspect-[4/5]">
              <Image
                src={p.image}
                alt={`Foto ${p.name}`}
                title={p.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover"
              />
            </div>

            <CardContent className="p-3 flex flex-col grow">
              {/* min-h bikin area judul konsisten walau 1/2 baris */}
              <h4 className="font-semibold text-base text-gray-800 line-clamp-2 min-h-[48px]">
                {p.name}
              </h4>
              <p className="text-pink-600 font-medium mt-1 text-sm">{fmtIDR(p.price)}</p>

              {/* footer selalu nempel bawah */}
              <div className="mt-auto flex justify-between items-center pt-2">
                <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>
                <Button size="sm" className="h-8 px-3" onClick={() => onOrder(p)} aria-label={`Pesan ${p.name}`}>
                  Pesan
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

