export type Role = 'customer' | 'shop' | 'admin';
export type ShopStatus = 'pending' | 'active' | 'inactive' | 'rejected';
export type OrderStatus = 'pending' | 'referred' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'referred', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export interface Profile { id: string; email: string; name: string; phone?: string; role: Role; shop_id?: string }
export interface Category { id: string; name: string; slug: string }
export interface Shop {
  id: string; owner_id: string; name: string; slug: string; description: string; city: string;
  phone: string; status: ShopStatus; created_at: string;
  delivery_charge: number; free_delivery_above: number | null;
}
export interface Product {
  id: string; shop_id: string; category_id: string; name: string; description: string;
  price: number; discount_percent: number; stock: number; sizes: string[]; colors: string[];
  images: string[]; featured: boolean; created_at: string; sold: number;
}
export interface ProductView extends Product {
  shop_name: string; category_name: string; final_price: number;
  delivery_charge: number; free_delivery_above: number | null;
}
export interface OrderItem {
  product_id: string; name: string; quantity: number; unit_price: number; size: string; color: string;
}
export interface Order {
  id: string; order_no: string; customer_id: string; customer_name: string; phone: string; address: string;
  city: string; notes: string; shop_id: string; shop_name: string; status: OrderStatus; created_at: string;
  items: OrderItem[]; subtotal: number; commission_amount: number; shop_earning: number;
  delivery_charge: number; referred_at: string | null; delivered_at: string | null;
}
export interface CartLine { product_id: string; size: string; color: string; quantity: number }
export interface CheckoutDetails { full_name: string; phone: string; address: string; city: string; notes: string }
