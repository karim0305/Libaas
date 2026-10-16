import type { Category, Order, OrderItem, OrderStatus, Product, Profile, Shop } from './types';
import { finalPrice } from './format';

export const COLOR_HEX: Record<string, string> = {
  Navy: '#1F2A5C', Maroon: '#7A1F2B', Olive: '#5E6B3A', White: '#F3F1EC', Black: '#26262B', Mustard: '#D9A21B',
  Teal: '#1F7A7A', Pink: '#D96C8C', Sky: '#7FB3D5', Grey: '#8A8D93', Beige: '#CDB89A', Green: '#2F6B4F',
  Peach: '#F0A58A', Mint: '#9CD3B8', Brown: '#7B5336',
};

// deterministic PRNG so the sample data is stable between reloads
let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000 - Math.floor(rnd() * 40000000)).toISOString();

export const categories: Category[] = [
  ['c1', "Men's Kurta"], ['c2', "Women's Lawn"], ['c3', 'Shalwar Kameez'], ['c4', 'Waistcoats'],
  ['c5', 'Kids Wear'], ['c6', 'Abayas & Hijabs'], ['c7', 'Formal & Bridal'], ['c8', 'Winter Shawls'],
].map(([id, name]) => ({ id, name, slug: name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-$/, '') }));

export const profiles: Profile[] = [
  { id: 'u-admin', email: 'admin@libaas.pk', name: 'Platform Admin', role: 'admin' },
  { id: 'u-s1', email: 'khaddar@libaas.pk', name: 'Imran Sheikh', role: 'shop', shop_id: 's1', phone: '0300 1112233' },
  { id: 'u-s2', email: 'kurta@libaas.pk', name: 'Faisal Qureshi', role: 'shop', shop_id: 's2', phone: '0321 4455667' },
  { id: 'u-s3', email: 'lawn@libaas.pk', name: 'Saima Butt', role: 'shop', shop_id: 's3', phone: '0333 7788990' },
  { id: 'u-s4', email: 'mardana@libaas.pk', name: 'Usman Malik', role: 'shop', shop_id: 's4', phone: '0345 1239876' },
  { id: 'u-s5', email: 'bridal@libaas.pk', name: 'Nadia Hashmi', role: 'shop', shop_id: 's5', phone: '0301 5558899' },
  { id: 'u-s6', email: 'kids@libaas.pk', name: 'Rabia Anwar', role: 'shop', shop_id: 's6', phone: '0312 6669900' },
  { id: 'u-s7', email: 'sialkot@libaas.pk', name: 'Tariq Mehmood', role: 'shop', shop_id: 's7', phone: '0322 1010101' },
  { id: 'u-s8', email: 'shawl@libaas.pk', name: 'Hina Gul', role: 'shop', shop_id: 's8', phone: '0334 2020202' },
  { id: 'u-c1', email: 'ayesha@example.com', name: 'Ayesha Khan', role: 'customer', phone: '0300 9876543' },
  { id: 'u-c2', email: 'bilal@example.com', name: 'Bilal Ahmed', role: 'customer', phone: '0311 2345678' },
  { id: 'u-c3', email: 'sana@example.com', name: 'Sana Rehman', role: 'customer', phone: '0322 3456789' },
  { id: 'u-c4', email: 'hamza@example.com', name: 'Hamza Iqbal', role: 'customer', phone: '0333 4567890' },
  { id: 'u-c5', email: 'maryam@example.com', name: 'Maryam Siddiqui', role: 'customer', phone: '0344 5678901' },
  { id: 'u-c6', email: 'zain@example.com', name: 'Zain Abbas', role: 'customer', phone: '0345 6789012' },
];

const baseShops: Omit<Shop, 'delivery_charge' | 'free_delivery_above' | 'shop_code'>[] = [
  { id: 's1', owner_id: 'u-s1', name: 'Khaddar House', slug: 'khaddar-house', city: 'Lahore', phone: '0300 1112233', status: 'active', created_at: daysAgo(160),
    description: 'Hand-picked khaddar and cotton shalwar kameez, cut and stitched in Gulberg since 2009.' },
  { id: 's2', owner_id: 'u-s2', name: 'Karachi Kurta Co.', slug: 'karachi-kurta-co', city: 'Karachi', phone: '0321 4455667', status: 'active', created_at: daysAgo(140),
    description: 'Everyday and festive kurtas for men, from Saddar to your doorstep.' },
  { id: 's3', owner_id: 'u-s3', name: 'Lawn & Linen Faisalabad', slug: 'lawn-linen-faisalabad', city: 'Faisalabad', phone: '0333 7788990', status: 'active', created_at: daysAgo(130),
    description: 'Printed and embroidered lawn straight from the textile capital of Pakistan.' },
  { id: 's4', owner_id: 'u-s4', name: 'Mardana Menswear', slug: 'mardana-menswear', city: 'Islamabad', phone: '0345 1239876', status: 'active', created_at: daysAgo(110),
    description: 'Waistcoats, formal kurtas and wedding-season menswear.' },
  { id: 's5', owner_id: 'u-s5', name: 'Bridal Bazaar Multan', slug: 'bridal-bazaar-multan', city: 'Multan', phone: '0301 5558899', status: 'active', created_at: daysAgo(100),
    description: 'Formal and bridal pieces with hand embroidery and zari work.' },
  { id: 's6', owner_id: 'u-s6', name: 'Little Stitches', slug: 'little-stitches', city: 'Rawalpindi', phone: '0312 6669900', status: 'active', created_at: daysAgo(80),
    description: 'Soft, durable kids clothing for Eid, school and every day in between.' },
  { id: 's7', owner_id: 'u-s7', name: 'Sialkot Sportswear', slug: 'sialkot-sportswear', city: 'Sialkot', phone: '0322 1010101', status: 'pending', created_at: daysAgo(2),
    description: 'Track suits and active wear made in Sialkot.' },
  { id: 's8', owner_id: 'u-s8', name: 'Shawl Gali Peshawar', slug: 'shawl-gali-peshawar', city: 'Peshawar', phone: '0334 2020202', status: 'inactive', created_at: daysAgo(70),
    description: 'Wool and pashmina shawls from Peshawar’s Qissa Khwani bazaar.' },
];
const DELIVERY: [number, number | null][] = [[250, 5000], [200, 3000], [300, null], [250, 5000], [400, 10000], [150, 2000], [250, 5000], [250, 5000]];
const SHOP_CODES = ['KHA', 'KAR', 'LAW', 'MAR', 'BRI', 'LIT', 'SIA', 'SHA'];
export const shops: Shop[] = baseShops.map((s, i) => ({ ...s, shop_code: SHOP_CODES[i], delivery_charge: DELIVERY[i][0], free_delivery_above: DELIVERY[i][1] }));

type P = [string, string, string, number, number, number, string[], string[], boolean];
const S = ['S', 'M', 'L', 'XL'];
const tmpl: P[] = [
  // name, shop, cat, price, discount, stock, sizes, colors, featured
  ['Cotton Shalwar Kameez – Unstitched', 's1', 'c3', 2999, 10, 40, ['Free'], ['Navy', 'Olive', 'Grey'], true],
  ['Winter Khaddar Suit 3-Piece', 's1', 'c3', 4500, 0, 25, ['M', 'L', 'XL'], ['Brown', 'Maroon'], false],
  ['Wash & Wear Shalwar Kameez', 's1', 'c3', 3499, 15, 60, S, ['White', 'Sky', 'Beige'], true],
  ['Embroidered Kurta Pajama', 's2', 'c1', 3799, 0, 30, S, ['White', 'Mint'], true],
  ['Plain Cotton Kurta', 's2', 'c1', 1499, 0, 80, S, ['White', 'Black', 'Navy', 'Beige'], false],
  ['Eid Special Kurta – Jamawar', 's2', 'c1', 5200, 20, 18, ['M', 'L', 'XL'], ['Maroon', 'Teal'], true],
  ['Printed Lawn 3-Piece', 's3', 'c2', 2999, 12, 50, ['S', 'M', 'L'], ['Pink', 'Mint', 'Sky'], true],
  ['Embroidered Lawn with Chiffon Dupatta', 's3', 'c2', 4999, 8, 35, ['S', 'M', 'L'], ['Peach', 'Teal'], true],
  ['Digital Print Lawn 2-Piece', 's3', 'c2', 1999, 0, 90, S, ['Pink', 'Mustard', 'Green'], false],
  ['Linen Co-ord Set', 's3', 'c2', 3299, 0, 28, ['S', 'M', 'L'], ['Beige', 'Olive'], false],
  ['Classic Waistcoat – Charcoal', 's4', 'c4', 4500, 0, 22, S, ['Grey', 'Black'], true],
  ['Embroidered Waistcoat – Wedding Edition', 's4', 'c4', 6500, 10, 14, ['M', 'L', 'XL'], ['Maroon', 'Navy'], false],
  ['Formal Kurta with Pajama', 's4', 'c1', 4200, 5, 26, S, ['White', 'Beige'], false],
  ['Peshawari Waistcoat', 's4', 'c4', 3800, 0, 20, S, ['Brown', 'Olive'], false],
  ['Hand-Embroidered Bridal Lehenga', 's5', 'c7', 48000, 5, 4, ['S', 'M', 'L'], ['Maroon', 'Peach'], true],
  ['Formal Chiffon Maxi', 's5', 'c7', 12500, 10, 9, ['S', 'M', 'L'], ['Teal', 'Pink'], true],
  ['Net Gharara Set', 's5', 'c7', 18500, 0, 7, ['S', 'M', 'L'], ['Mint', 'Peach'], false],
  ['Boys Eid Kurta Set', 's6', 'c5', 1899, 0, 70, ['2-3Y', '4-5Y', '6-7Y', '8-9Y'], ['White', 'Sky', 'Mint'], true],
  ['Girls Frock – Cotton Net', 's6', 'c5', 2499, 10, 45, ['2-3Y', '4-5Y', '6-7Y'], ['Pink', 'Peach'], false],
  ['Kids Shalwar Kameez', 's6', 'c5', 1699, 0, 65, ['2-3Y', '4-5Y', '6-7Y', '8-9Y'], ['Navy', 'Grey'], false],
  ['Nida Abaya – Everyday', 's3', 'c6', 3200, 0, 40, ['M', 'L', 'XL'], ['Black', 'Navy'], false],
  ['Chiffon Hijab Pack of 3', 's3', 'c6', 1499, 0, 100, ['Free'], ['Black', 'Grey', 'Beige'], false],
  ['Pashmina Shawl', 's8', 'c8', 7500, 0, 15, ['Free'], ['Beige', 'Maroon'], false],
  ['Wool Embroidered Shawl', 's8', 'c8', 5500, 0, 20, ['Free'], ['Grey', 'Teal'], false],
  ['Sports Track Suit', 's7', 'c1', 3900, 0, 30, S, ['Black', 'Navy'], false],
];

const codeCount: Record<string, number> = {};
const nextCode = (shopId: string) => { codeCount[shopId] = (codeCount[shopId] ?? 100) + 1; return `${shops.find((s) => s.id === shopId)!.shop_code}-${codeCount[shopId]}`; };
export const products: Product[] = tmpl.map(([name, shop_id, category_id, price, discount_percent, stock, sizes, colors, featured], i) => ({
  id: `p${i + 1}`, code: nextCode(shop_id), shop_id, category_id, name, price, discount_percent, stock, sizes, colors, featured,
  description: `${name} from ${shops.find((s) => s.id === shop_id)!.name}. Quality fabric, careful stitching and a comfortable fit for Pakistan’s seasons. Available in ${colors.join(', ').toLowerCase()}. Returns accepted within 7 days if unworn.`,
  images: [], created_at: daysAgo(Math.floor(rnd() * 60)), sold: Math.floor(rnd() * 90) + 5,
}));

const cities = ['Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Multan', 'Rawalpindi', 'Gujranwala', 'Hyderabad'];
const streets = ['House 12, Street 4, Gulshan Colony', 'Flat 7, Block C, Satellite Town', 'House 88, Model Town', 'Plot 15, Sector F-10', 'House 3, Street 9, Johar Town'];
const customers = profiles.filter((p) => p.role === 'customer');
const statusPool: OrderStatus[] = ['delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'shipped', 'processing', 'confirmed', 'referred', 'pending', 'cancelled'];
const activeProducts = products.filter((p) => shops.find((s) => s.id === p.shop_id)!.status === 'active');

export const orders: Order[] = Array.from({ length: 64 }, (_, i) => {
  const c = pick(customers);
  const shopP = pick(activeProducts);
  const shop = shops.find((s) => s.id === shopP.shop_id)!;
  const lines = activeProducts.filter((p) => p.shop_id === shop.id);
  const n = 1 + Math.floor(rnd() * 2);
  const items: OrderItem[] = Array.from({ length: n }, () => {
    const p = pick(lines);
    return { product_id: p.id, product_code: p.code, name: p.name, quantity: 1 + Math.floor(rnd() * 2), unit_price: finalPrice(p.price, p.discount_percent), size: pick(p.sizes), color: pick(p.colors) };
  });
  const subtotal = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  const age = Math.floor((i / 64) * 75);
  const status = age < 3 ? pick<OrderStatus>(['pending', 'referred']) : pick(statusPool);
  const delivered = status === 'delivered';
  const commission_amount = delivered ? Math.round(subtotal * 0.05) : 0;
  const created_at = daysAgo(75 - age);
  const delivery_charge = shop.free_delivery_above != null && subtotal >= shop.free_delivery_above ? 0 : shop.delivery_charge;
  const cancelled_by = status === 'cancelled' ? pick<'customer' | 'shop' | 'admin'>(['customer', 'shop', 'admin']) : null;
  return {
    id: `o${i + 1}`, order_no: `AKS-${26000 + i * 7 + 101}`, customer_id: c.id, customer_name: c.name, phone: c.phone ?? '',
    address: pick(streets), city: pick(cities), notes: '', shop_id: shop.id, shop_name: shop.name, status,
    created_at, referred_at: status === 'pending' ? null : created_at, delivered_at: delivered ? created_at : null, delivery_charge, status_changed_at: created_at, cancelled_by, cancel_reason: cancelled_by === 'shop' ? 'Customer refused delivery' : cancelled_by === 'customer' ? 'Changed my mind' : cancelled_by === 'admin' ? 'Duplicate order' : '', customer_confirmed_at: null, disputed_at: null, dispute_note: '', admin_checked_at: null, items, subtotal, commission_amount, shop_earning: delivered ? subtotal - commission_amount : 0,
  };
}).sort((a, b) => b.created_at.localeCompare(a.created_at));

/* ---------- homepage sample content ---------- */
import type { Announcement, Banner, HomeSection } from './types';
export const announcements: Announcement[] = [
  { id: 'an1', text: 'Cash on delivery across Pakistan · Delivery charges are set by each shop', link: '', link_label: '', shop_id: null, theme: 'indigo', sort_order: 0, is_active: true, starts_at: null, ends_at: null },
  { id: 'an2', text: 'Eid collection is live. Lawn, kurtas and waistcoats from verified shops', link: '/products', link_label: 'Shop now', shop_id: null, theme: 'crimson', sort_order: 1, is_active: true, starts_at: null, ends_at: null },
  { id: 'an3', text: 'Free delivery on bigger orders', link: '', link_label: 'Visit shop', shop_id: 's1', theme: 'gold', sort_order: 2, is_active: true, starts_at: null, ends_at: null },
];
export const banners: Banner[] = [
  { id: 'b1', title: 'Eid ki shopping, ek hi jagah.', subtitle: 'Lawn from Faisalabad, kurtas from Karachi, waistcoats from Islamabad. Order from verified shops and pay cash when it reaches your door.',
    btn1_label: 'Shop all clothing', btn1_link: '/products', btn2_label: 'Meet the shops', btn2_link: '/shops', theme: 'indigo', image_url: null, shop_id: null, product_ids: [], sort_order: 0, is_active: true, starts_at: null, ends_at: null },
  { id: 'b2', title: 'Lawn season is here', subtitle: 'Printed and embroidered lawn straight from the textile capital of Pakistan.',
    btn1_label: 'Visit the shop', btn1_link: '/shops/s3', btn2_label: '', btn2_link: '', theme: 'forest', image_url: null, shop_id: 's3', product_ids: [], sort_order: 1, is_active: true, starts_at: null, ends_at: null },
];
export const homeSections: HomeSection[] = [
  { key: 'featured', title: 'Featured this week', mode: 'manual', shop_id: null, product_ids: products.filter((p) => p.featured).slice(0, 8).map((p) => p.id), item_limit: 4, enabled: true },
  { key: 'popular', title: 'Popular right now', mode: 'best_selling', shop_id: null, product_ids: [], item_limit: 4, enabled: true },
  { key: 'latest', title: 'Just added', mode: 'latest', shop_id: null, product_ids: [], item_limit: 4, enabled: true },
];

/* ---------- sample reviews (from delivered orders) ---------- */
import type { Review } from './types';
const COMMENTS = ['Fabric quality is excellent and the fit is perfect.', 'Delivered on time. Stitching is neat, will order again.', 'Colour is exactly as shown. Very happy.', 'Good value for the price. Packaging was careful.', 'Size ran slightly large but the quality is great.', 'Beautiful embroidery, got many compliments at Eid.'];
const RATINGS = [5, 5, 4, 5, 4, 5, 3, 5, 4, 5, 5, 4, 5, 4];
const shortName = (n: string) => { const [f, l] = n.split(' '); return l ? `${f} ${l[0]}.` : f; };
export const reviews: Review[] = orders.filter((o) => o.status === 'delivered').slice(0, 14).map((o, i) => ({
  id: `r${i + 1}`, order_id: o.id, product_id: o.items[0].product_id, shop_id: o.shop_id, customer_id: o.customer_id, customer_name: shortName(o.customer_name),
  rating: RATINGS[i], comment: COMMENTS[i % COMMENTS.length], is_hidden: false, created_at: o.created_at,
}));

/* ---------- sample commission payments ---------- */
import type { CommissionPayment } from './types';
const dayStr = (n: number) => new Date(Date.now() - n * 86400000).toLocaleDateString('en-CA');
export const commissionPayments: CommissionPayment[] = [
  { id: 'cp1', shop_id: 's1', paid_on: dayStr(20), amount: 1500, comment: 'Bank transfer, ref 88421', status: 'received', received_at: new Date(Date.now() - 19 * 86400000).toISOString(), created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: 'cp2', shop_id: 's1', paid_on: dayStr(3), amount: 1200, comment: 'JazzCash', status: 'not_received', received_at: null, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'cp3', shop_id: 's2', paid_on: dayStr(6), amount: 900, comment: 'Easypaisa, TID 7741', status: 'not_received', received_at: null, created_at: new Date(Date.now() - 6 * 86400000).toISOString() },
];
