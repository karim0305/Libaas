# Al Karim Styloes – multi-vendor clothing marketplace

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth, Postgres, Storage, RLS)

Customers browse shops and place **cash-on-delivery** orders. Shops manage products and orders. The admin approves shops and earns **5% commission on delivered orders only**.

## Run it now (sample data, no Supabase needed)

```bash
npm install
npm run dev        # http://localhost:3000
```

On `/login` use the sample-account buttons (customer, shop owner, admin). Everything you change is saved in the browser; reset it under Settings.

## Routes

| Area | Routes |
| --- | --- |
| Storefront | `/`, `/products`, `/products/[id]`, `/shops`, `/shops/[id]`, `/cart`, `/checkout`, `/order-success`, `/orders`, `/login`, `/register`, `/register-shop` |
| Shop dashboard | `/shop-dashboard` (+ `/products`, `/products/new`, `/products/[id]`, `/orders`, `/sales`, `/earnings`, `/profile`, `/settings`) |
| Admin | `/admin` (+ `/shops`, `/products`, `/categories`, `/customers`, `/orders`, `/commissions`, `/reports`, `/settings`) |

## Structure

```
app/(store)/       customer frontend
app/shop-dashboard vendor panel
app/admin          admin panel
components/        shared UI, charts, tables, providers (toast, confirm, auth, cart)
lib/services/      auth, products, shops, orders, analytics  <- the ONLY data access layer
lib/commission.ts  display-only 5% preview
lib/supabase/      browser client
supabase/migrations/  schema, functions/triggers, RLS + storage policies
```

## Connect Supabase

1. Create a project, then run `supabase/migrations/001…011` in order in the SQL editor. Run **007 on its own** before 008 (new enum value). 004 adds profile email, 005 seeds categories, 006 limits product writes to approved shops, 008 adds the refer step, delivery charges and terms record, 009 adds the admin-controlled homepage, 010 adds product codes, reviews and delivery verification, 011 adds AKS- order numbers and commission payments.
2. `cp .env.example .env.local` and fill in the project URL and anon key.
3. Done in code: with the env vars set the app uses `lib/services/supabase/*`; without them it uses `lib/services/mock/*`.
   - auth → `supabase.auth.signInWithPassword / signUp / signOut`; shop signup → `rpc('register_shop')`
   - products → `.from('products').select('*, shops(name), categories(name), product_images(url))'`
   - checkout → `rpc('place_order', {...})`
   - status updates → `.from('orders').update({ status })`; the trigger writes commission
   - images → upload to bucket `product-images/<shop_id>/<file>` and insert into `product_images`
4. Make yourself admin: `update profiles set role = 'admin' where id = '<your auth uid>';`
5. Seed categories (and optionally products) with SQL inserts.

## Where business rules live

- **Delivery verification:** the customer can confirm receipt (`confirm_receipt()`), shops must give a reason when cancelling, customers can dispute a shop's cancellation, and Admin → Orders → Delivery checks lists orders with no update for 5+ days, shop cancellations and disputes.
- **Commission payments:** a shop submits date, amount and comment (Shop → Commission payments); the admin marks it received (Admin → Commissions, bottom section). Once received it is locked for both, enforced by trigger `guard_commission_payment`.
- **Reviews:** `submit_review()` only accepts a review from the customer of a delivered order (one per item).
- **Product code:** shop code (first 3 letters of the shop name, unique) + a number the shop chooses, e.g. KHA-1042, enforced by a trigger.
- **Homepage:** Admin → Homepage controls the announcement bar, hero slider and the Featured / Popular / Just added rows (tables `announcements`, `banners`, `home_sections`; photos in bucket `site-images`).
- **Order flow:** customer order is `pending` → **only the admin** refers it → the shop confirms, processes, ships and delivers. Shops see an order only after it is referred (RLS + trigger `guard_status`).
- **Commission:** trigger `generate_commission` (rate in `platform_settings`, editable by the admin under Admin → Settings).
- **Delivery charge:** set per shop (Shop → Settings), calculated by `place_order()`. Only `delivered` creates a `commissions` row and sets `commission_amount` / `shop_earning`.
- **Prices and stock at checkout:** `place_order()` re-reads prices server-side and decrements stock; a cancelled order restocks.
- **Access control:** RLS — customers see their orders, shops see their own products/orders, admin sees everything. Order inserts are only possible through `place_order()`.

## Deploy to Vercel

Push to GitHub, import in Vercel, add the two `NEXT_PUBLIC_SUPABASE_*` env vars. No other config.

## Notes

- Sample product photos are generated garment silhouettes; shops can upload real photos (stored as data URLs in sample mode, Supabase Storage in production).
- Fonts load from Google Fonts at build time (Bricolage Grotesque, Hanken Grotesk).
