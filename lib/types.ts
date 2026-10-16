export type Role = 'customer' | 'shop' | 'admin';
export type ShopStatus = 'pending' | 'active' | 'inactive' | 'rejected';
export type OrderStatus = 'pending' | 'referred' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'referred', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export interface Profile { id: string; email: string; name: string; phone?: string; role: Role; shop_id?: string }
export interface Category { id: string; name: string; slug: string }
export interface Shop {
  id: string; owner_id: string; name: string; slug: string; description: string; city: string;
  phone: string; status: ShopStatus; created_at: string;
  delivery_charge: number; free_delivery_above: number | null; shop_code: string;
}
export interface Product {
  id: string; code: string; shop_id: string; category_id: string; name: string; description: string;
  price: number; discount_percent: number; stock: number; sizes: string[]; colors: string[];
  images: string[]; featured: boolean; created_at: string; sold: number;
}
export interface ProductView extends Product {
  shop_name: string; category_name: string; final_price: number;
  delivery_charge: number; free_delivery_above: number | null;
}
export interface OrderItem {
  product_id: string; product_code?: string; name: string; quantity: number; unit_price: number; size: string; color: string;
}
export interface Order {
  id: string; order_no: string; customer_id: string; customer_name: string; phone: string; address: string;
  city: string; notes: string; shop_id: string; shop_name: string; status: OrderStatus; created_at: string;
  items: OrderItem[]; subtotal: number; commission_amount: number; shop_earning: number;
  delivery_charge: number; referred_at: string | null; delivered_at: string | null;
  status_changed_at: string; cancel_reason: string; cancelled_by: 'customer' | 'shop' | 'admin' | null;
  customer_confirmed_at: string | null; disputed_at: string | null; dispute_note: string; admin_checked_at: string | null;
}
export interface CartLine { product_id: string; size: string; color: string; quantity: number }
export interface CheckoutDetails { full_name: string; phone: string; address: string; city: string; notes: string }

/* ---------- Homepage content (controlled by the admin) ---------- */
export type AnnounceTheme = 'indigo' | 'crimson' | 'gold' | 'green';
export type BannerTheme = 'indigo' | 'crimson' | 'forest' | 'plum';
export interface Announcement {
  id: string; text: string; link: string; link_label: string; shop_id: string | null; theme: AnnounceTheme;
  sort_order: number; is_active: boolean; starts_at: string | null; ends_at: string | null;
}
export interface Banner {
  id: string; title: string; subtitle: string; btn1_label: string; btn1_link: string; btn2_label: string; btn2_link: string;
  theme: BannerTheme; image_url: string | null; shop_id: string | null; product_ids: string[];
  sort_order: number; is_active: boolean; starts_at: string | null; ends_at: string | null;
}
export type SectionKey = 'featured' | 'popular' | 'latest';
export type SectionMode = 'manual' | 'best_selling' | 'latest';
export interface HomeSection { key: SectionKey; title: string; mode: SectionMode; shop_id: string | null; product_ids: string[]; item_limit: number; enabled: boolean }
export type LiveAnnouncement = Announcement & { shop_name: string | null };
export type HeroSlide = Banner & { shop: { id: string; name: string; city: string } | null; products: ProductView[] };

export interface Review {
  id: string; order_id: string; product_id: string; shop_id: string; customer_id: string; customer_name: string;
  rating: number; comment: string; is_hidden: boolean; created_at: string;
}
export type ReviewView = Review & { product_name: string; product_code: string; shop_name: string };

/* ---------- Commission payments: a shop tells the admin it has paid its commission ---------- */
export type PaymentStatus = 'not_received' | 'received';
export interface CommissionPayment {
  id: string; shop_id: string; paid_on: string; amount: number; comment: string;
  status: PaymentStatus; received_at: string | null; created_at: string;
}
export type PaymentView = CommissionPayment & { shop_name: string };
