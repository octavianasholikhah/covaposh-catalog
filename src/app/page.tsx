'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingCart, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image'; // <-- pakai next/image

// --- KONFIGURASI UTAMA ---
const WA_NUMBER = '6285716261499';
const CATEGORIES = ['Semua', 'BUKET READY', 'BUNGA ARTIFICIAL'] as const;
type Category = (typeof CATEGORIES)[number];
type RealCategory = Exclude<Category, 'Semua'>; // kategori yang valid untuk produk
type Sort = 'termurah' | 'termahal' | 'az';

type Product = {
  id: string;
  name: string;
  price: number;
  category: RealCategory;
  image: string;
};

// --- DATA PRODUK (tambahkan sesuai kebutuhan) ---
const PRODUCTS: Product[] = [
  // --- BUKET READY ---
  { id: 'BR-295', name: 'Buket Ready – Mawar Mix',   price: 295000, category: 'BUKET READY',     image: '/images/buket ready/1.jpg' },
  { id: 'BR-250', name: 'Buket Ready – Sunflower',   price: 250000, category: 'BUKET READY',     image: '/images/buket ready/2.jpg' },
  { id: 'BR-165', name: 'Buket Ready – Pastel Mini', price: 165000, category: 'BUKET READY',     image: '/images/buket ready/3.jpg' },
  { id: 'BR-200', name: 'Buket Ready – Pink Lily',   price: 200000, category: 'BUKET READY',     image: '/images/buket ready/4.jpg' },
  { id: 'BR-165b',name: 'Buket Ready – Red Rose',    price: 165000, category: 'BUKET READY',     image: '/images/buket ready/5.jpg' },
  { id: 'BR-235', name: 'Buket Ready – Pink Elegant',price: 235000, category: 'BUKET READY',     image: '/images/buket ready/6.jpg' },

  // --- contoh BUNGA ARTIFICIAL (opsional, tambahkan gambar di public/images/bunga artificial/) ---
  // { id: 'AR-235', name: 'Artificial – Mini Red',     price: 235000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga artificial/1.jpg' },
  // { id: 'AR-350', name: 'Artificial – Pink Elegant', price: 350000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga artificial/2.jpg' },
  // { id: 'AR-245', name: 'Artificial – Blue Bloom',   price: 245000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga artificial/3.jpg' },
];

const fmtIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function Page() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<Category>('Semua');
  const [maxPrice, setMaxPrice] = useState(500000);
  const [sort, setSort] = useState<Sort>('termurah');

  // Hasil terfilter (cari + kategori + slider harga + urutkan)
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
    const text = `Halo, saya ingin pesan ${p.name} (${p.id}) - ${fmtIDR(p.price)}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Grup per kategori untuk BERANDA (pakai data TERFILTER)
  const filteredBySection = useMemo(() => {
    const sections: Record<RealCategory, Product[]> = {
      'BUKET READY': [],
      'BUNGA ARTIFICIAL': [],
    };
    for (const p of filtered) {
      sections[p.category].push(p);
    }
    return sections;
  }, [filtered]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* HEADER */}
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-pink-100 z-10">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-3 justify-between items-center p-4">
          <h1 className="text-2xl font-bold text-pink-600">COVAPOSH</h1>

          <div className="flex-1 max-w-xl flex items-center gap-2">
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

      {/* FILTER SECTION */}
      <section className="max-w-6xl mx-auto p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 rounded-2xl bg-white p-4 shadow-sm border border-pink-100">
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

          {/* Filter harga & urutan */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
            <div>
              <label className="block text-xs text-gray-500">Batas harga: {fmtIDR(maxPrice)}</label>
              <input
                type="range"
                min={100000}
                max={500000}
                step={50000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}  // <-- tanpa any
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

        {/* HASIL */}
        {(cat !== 'Semua' || search) ? (
          <>
            <h2 className="text-xl font-semibold mb-3 text-gray-700">
              {cat !== 'Semua' ? cat : 'Hasil Pencarian'}
            </h2>
            <Grid products={filtered} onOrder={openWA} />
          </>
        ) : (
          // BERANDA: tampil per-kategori dari data TERFILTER
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
      >
        Chat WhatsApp
      </button>
    </main>
  );
}

function Grid({ products, onOrder }: { products: Product[]; onOrder: (p: Product) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.map((p) => (
        <motion.div key={p.id} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card className="overflow-hidden shadow-md hover:shadow-lg flex flex-col">
            {/* pakai next/image */}
            <div className="w-full h-64 sm:h-60 md:h-64 lg:h-72 bg-pink-100 relative">
              <Image
                src={p.image}
                alt={p.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
                priority={false}
              />
            </div>
            <CardContent className="p-4 flex flex-col grow">
              <h4 className="font-semibold text-lg text-gray-800">{p.name}</h4>
              <p className="text-pink-600 font-medium mt-1">{fmtIDR(p.price)}</p>
              <div className="mt-auto flex justify-between items-center pt-3">
                <Badge variant="secondary">{p.category}</Badge>
                <Button size="sm" onClick={() => onOrder(p)}>Pesan</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
