// --- Tipe & konstanta yang bisa dipakai ulang ---
export const WA_NUMBER = '6285716261499' as const;

export const CATEGORIES = [
  'SEMUA',
  'BUKET READY',
  'BUNGA ARTIFICIAL',
  'PRICELIST VIA CHAT',
  'BUKET SNACK',
] as const;

export type Category = (typeof CATEGORIES)[number];
// Penting: exclude harus 'SEMUA' (bukan 'Semua')
export type RealCategory = Exclude<Category, 'SEMUA'>;

export type Product = {
  id: string;
  name: string;
  price: number | null; // null = “via chat”
  category: RealCategory;
  image: string;        // path dari /public
};

// --- Data produk ---
export const PRODUCTS: Product[] = [
  // BUKET READY
  { id: 'BR-295', name: 'Mawar Mix',    price: 295000, category: 'BUKET READY', image: '/images/buket-ready/1.jpg' },
  { id: 'BR-250', name: 'Sunflower',    price: 250000, category: 'BUKET READY', image: '/images/buket-ready/2.jpg' },
  { id: 'BR-165', name: 'Pastel Mini',  price: 165000, category: 'BUKET READY', image: '/images/buket-ready/3.jpg' },
  { id: 'BR-200', name: 'Pink Lily',    price: 200000, category: 'BUKET READY', image: '/images/buket-ready/4.jpg' },
  { id: 'BR-165b',name: 'Red Rose',     price: 165000, category: 'BUKET READY', image: '/images/buket-ready/5.jpg' },
  { id: 'BR-235', name: 'Pink Elegant', price: 235000, category: 'BUKET READY', image: '/images/buket-ready/6.jpg' },

  // BUNGA ARTIFICIAL
  { id: 'AR-235', name: 'Mini Red',           price: 235000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/1.jpg' },
  { id: 'AR-350', name: 'Pink Elegant',       price: 350000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/2.jpg' },
  { id: 'AR-245', name: 'Blue Bloom',         price: 245000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/3.jpg' },
  { id: 'AR-650', name: 'Artificial premium', price: 650000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/4.jpg' },
  { id: 'AR-300', name: 'Pink Soft',          price: 300000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/5.jpg' },
  { id: 'AR-265', name: 'Mix Classic',        price: 265000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/6.jpg' },
  { id: 'AR-120', name: 'Mix Hologram',       price: 120000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/7.jpg' },
  { id: 'AR-100', name: 'Artificial',         price: 100000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/8.jpg' },
  { id: 'AR-150', name: 'Pink',               price: 150000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/9.jpg' },
  { id: 'AR-175', name: 'Mini Bouquet',       price: 175000, category: 'BUNGA ARTIFICIAL', image: '/images/bunga-artificial/10.jpg' },

  // PRICELIST VIA CHAT (price = null)
  { id: 'CH-001', name: 'Money bouquet',   price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/1.jpg'  },
  { id: 'CH-002', name: 'PAKET GOLD',      price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/2.jpg'  },
  { id: 'CH-003', name: 'Paket combo',     price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/3.jpg'  },
  { id: 'CH-004', name: 'Harga via chat',  price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/4.jpg'  },
  { id: 'CH-005', name: 'Harga via chat',  price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/5.jpg'  },
  { id: 'CH-006', name: 'MB kosongan',     price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/6.jpg'  },
  { id: 'CH-007', name: 'Money bouquet',   price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/7.jpg'  },
  { id: 'CH-008', name: 'Paket combo',     price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/8.jpg'  },
  { id: 'CH-009', name: 'Paket gold',      price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/9.jpg'  },
  { id: 'CH-010', name: 'Paket combo',     price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/10.jpg' },
  { id: 'CH-011', name: 'Bouquet bunga uang',price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/11.jpg' },
  { id: 'CH-012', name: 'Bouquet uang',    price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/12.jpg' },
  { id: 'CH-013', name: 'Mix',             price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/13.jpg' },
  { id: 'CH-014', name: 'Harga via chat',   price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/14.jpg' },
  { id: 'CH-015', name: 'Bunga mix uang',  price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/15.jpg' },
  { id: 'CH-016', name: 'Paket mix uang & susu', price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/16.jpg' },
  { id: 'CH-017', name: 'Paket gold',      price: null, category: 'PRICELIST VIA CHAT', image: '/images/chat/17.jpg' },

  // BUKET SNACK
  { id: 'SN-001', name: 'Snack bucket',                 price: 165000, category: 'BUKET SNACK', image: '/images/snack/1.jpg' },
  { id: 'SN-002', name: 'Buket snack',                  price: 125000, category: 'BUKET SNACK', image: '/images/snack/2.jpg' },
  { id: 'SN-003', name: 'Buket snack (by request)',     price: 125000, category: 'BUKET SNACK', image: '/images/snack/3.jpg' },
  { id: 'SN-004', name: 'Buket snack',                  price: 125000, category: 'BUKET SNACK', image: '/images/snack/4.jpg' },
  { id: 'SN-005', name: 'Buket snack',                  price: 250000, category: 'BUKET SNACK', image: '/images/snack/5.jpg' },
  { id: 'SN-006', name: 'Buket wisuda',                 price: 265000, category: 'BUKET SNACK', image: '/images/snack/6.jpg' },
  { id: 'SN-007', name: 'Buket pocky',                  price: 150000, category: 'BUKET SNACK', image: '/images/snack/7.jpg' },
  { id: 'SN-008', name: 'Buket snack',                  price: 50000,  category: 'BUKET SNACK', image: '/images/snack/8.jpg' },
  { id: 'SN-009', name: 'Buket snack mix boneka',       price: 155000, category: 'BUKET SNACK', image: '/images/snack/9.jpg' },
  { id: 'SN-010', name: 'Buket snack mix',              price: 215000, category: 'BUKET SNACK', image: '/images/snack/10.jpg' },
  { id: 'SN-011', name: 'Buket snack',                  price: 150000, category: 'BUKET SNACK', image: '/images/snack/11.jpg' },
  { id: 'SN-012', name: 'Buket bengbeng mix bunga',     price: 165000, category: 'BUKET SNACK', image: '/images/snack/12.jpg' },
  { id: 'SN-013', name: 'Buket coklat',                 price: 200000, category: 'BUKET SNACK', image: '/images/snack/13.jpg' },
  { id: 'SN-014', name: 'Buket snack mix',              price: 200000, category: 'BUKET SNACK', image: '/images/snack/14.jpg' },
  { id: 'SN-015', name: 'Buket snack',                  price: 175000, category: 'BUKET SNACK', image: '/images/snack/15.jpg' },
  { id: 'SN-016', name: 'Buket coklat',                 price: 250000, category: 'BUKET SNACK', image: '/images/snack/16.jpg' },
  { id: 'SN-017', name: 'Buket snack',                  price: 100000, category: 'BUKET SNACK', image: '/images/snack/17.jpg' },
  { id: 'SN-018', name: 'Buket coklat',                 price: 299000, category: 'BUKET SNACK', image: '/images/snack/18.jpg' },
  { id: 'SN-019', name: 'Buket snack',                  price: 50000,  category: 'BUKET SNACK', image: '/images/snack/19.jpg' },
  { id: 'SN-020', name: 'Buket snack',                  price: 125000, category: 'BUKET SNACK', image: '/images/snack/20.jpg' },
  { id: 'SN-021', name: 'Buket snack',                  price: 120000, category: 'BUKET SNACK', image: '/images/snack/21.jpg' },
  { id: 'SN-022', name: 'Buket kopi',                   price: 85000,  category: 'BUKET SNACK', image: '/images/snack/22.jpg' },
  { id: 'SN-023', name: 'Buket snack',                  price: 130000, category: 'BUKET SNACK', image: '/images/snack/23.jpg' },
  { id: 'SN-024', name: 'Buket snack',                  price: 125000, category: 'BUKET SNACK', image: '/images/snack/24.jpg' },
  { id: 'SN-025', name: 'Buket coklat',                 price: 95000,  category: 'BUKET SNACK', image: '/images/snack/25.jpg' },
];

// Min/Max harga (abaikan yang null)
const nums = PRODUCTS.map(p => p.price).filter((n): n is number => typeof n === 'number');
export const PRICE_MIN = nums.length ? Math.min(...nums) : 0;
export const PRICE_MAX = nums.length ? Math.max(...nums) : 0;
