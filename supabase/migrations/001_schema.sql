-- Libaas marketplace schema. Run in the Supabase SQL editor (or `supabase db push`).
create extension if not exists "pgcrypto";

create type user_role    as enum ('customer', 'shop', 'admin');
create type shop_status  as enum ('pending', 'active', 'inactive', 'rejected');
create type order_status as enum ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

create table platform_settings (
  id int primary key default 1 check (id = 1),
  commission_rate numeric(5,4) not null default 0.05
);
insert into platform_settings (id) values (1);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references profiles(id) on delete cascade,  -- one user owns one shop
  name text not null,
  slug text not null unique,
  description text not null default '',
  city text not null default '',
  phone text,
  logo_url text,
  status shop_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  category_id uuid not null references categories(id),
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price > 0),
  discount_percent int not null default 0 check (discount_percent between 0 and 90),
  stock int not null default 0 check (stock >= 0),
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  featured boolean not null default false,
  sold int not null default 0,
  created_at timestamptz not null default now()
);
create index on products (shop_id);
create index on products (category_id);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  position int not null default 0
);

create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade
);
create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  size text not null, color text not null,
  quantity int not null check (quantity > 0),
  unique (cart_id, product_id, size, color)
);

create sequence order_no_seq start 100001;
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique default ('LB-' || nextval('order_no_seq')),
  customer_id uuid not null references profiles(id),
  shop_id uuid not null references shops(id),                         -- each order belongs to one shop
  customer_name text not null, phone text not null, address text not null, city text not null, notes text not null default '',
  payment_method text not null default 'cod' check (payment_method = 'cod'),
  status order_status not null default 'pending',
  subtotal numeric(12,2) not null default 0,
  commission_amount numeric(12,2) not null default 0,                 -- filled by trigger when delivered
  shop_earning numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
create index on orders (customer_id);
create index on orders (shop_id, status);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name text not null, size text not null, color text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null
);

-- one commission row per delivered order
create table commissions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  shop_id uuid not null references shops(id),
  order_amount numeric(12,2) not null,
  rate numeric(5,4) not null,
  commission_amount numeric(12,2) not null,
  shop_earning numeric(12,2) not null,
  created_at timestamptz not null default now()
);
