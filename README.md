# Libaas – multi-vendor clothing marketplace

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

1. Create a project, then run `supabase/migrations/001…005` in order in the SQL editor (004 adds profile email, 005 seeds categories).
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

- **Commission:** trigger `generate_commission` (rate in `platform_settings`). Only `delivered` creates a `commissions` row and sets `commission_amount` / `shop_earning`.
- **Prices and stock at checkout:** `place_order()` re-reads prices server-side and decrements stock; a cancelled order restocks.
- **Access control:** RLS — customers see their orders, shops see their own products/orders, admin sees everything. Order inserts are only possible through `place_order()`.

## Deploy to Vercel

Push to GitHub, import in Vercel, add the two `NEXT_PUBLIC_SUPABASE_*` env vars. No other config.

## Notes

- Sample product photos are generated garment silhouettes; shops can upload real photos (stored as data URLs in sample mode, Supabase Storage in production).
- Fonts load from Google Fonts at build time (Bricolage Grotesque, Hanken Grotesk).
