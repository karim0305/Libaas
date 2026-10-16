-- Run AFTER 008. Admin-controlled homepage: announcement bar, hero slider banners, product rows.

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 1 and 160),
  link text not null default '' check (link = '' or link ~ '^(/($|[^/])|https?://)'),   -- on-site path or http(s) only
  link_label text not null default '',
  shop_id uuid references shops(id) on delete set null,
  theme text not null default 'indigo' check (theme in ('indigo', 'crimson', 'gold', 'green')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 100),
  subtitle text not null default '' check (char_length(subtitle) <= 300),
  btn1_label text not null default '',
  btn1_link text not null default '' check (btn1_link = '' or btn1_link ~ '^(/($|[^/])|https?://)'),
  btn2_label text not null default '',
  btn2_link text not null default '' check (btn2_link = '' or btn2_link ~ '^(/($|[^/])|https?://)'),
  theme text not null default 'indigo' check (theme in ('indigo', 'crimson', 'forest', 'plum')),
  image_url text,
  shop_id uuid references shops(id) on delete set null,             -- show this shop's best sellers on the right
  product_ids uuid[] not null default '{}' check (cardinality(product_ids) <= 4),  -- or these hand-picked products
  sort_order int not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists home_sections (
  key text primary key check (key in ('featured', 'popular', 'latest')),
  title text not null check (char_length(title) between 1 and 60),
  mode text not null check (mode in ('manual', 'best_selling', 'latest')),
  shop_id uuid references shops(id) on delete set null,
  product_ids uuid[] not null default '{}' check (cardinality(product_ids) <= 12),
  item_limit int not null default 4 check (item_limit between 4 and 12),
  enabled boolean not null default true
);

alter table announcements enable row level security;
alter table banners enable row level security;
alter table home_sections enable row level security;

-- Everyone can read live content; only the admin can change anything
create policy "public reads active announcements" on announcements for select using (is_active or is_admin());
create policy "admin manages announcements" on announcements for all using (is_admin()) with check (is_admin());
create policy "public reads active banners" on banners for select using (is_active or is_admin());
create policy "admin manages banners" on banners for all using (is_admin()) with check (is_admin());
create policy "public reads sections" on home_sections for select using (true);
create policy "admin manages sections" on home_sections for all using (is_admin()) with check (is_admin());

-- Banner photos: public bucket, only the admin can upload or delete
insert into storage.buckets (id, name, public) values ('site-images', 'site-images', true) on conflict do nothing;
create policy "public reads site images" on storage.objects for select using (bucket_id = 'site-images');
create policy "admin uploads site images" on storage.objects for insert with check (bucket_id = 'site-images' and is_admin());
create policy "admin deletes site images" on storage.objects for delete using (bucket_id = 'site-images' and is_admin());

-- Starting content, so the homepage looks the same as before until the admin changes it
insert into announcements (text, theme, sort_order)
select 'Cash on delivery across Pakistan · Delivery charges are set by each shop', 'indigo', 0
where not exists (select 1 from announcements);

insert into banners (title, subtitle, btn1_label, btn1_link, btn2_label, btn2_link, theme, sort_order)
select 'Eid ki shopping, ek hi jagah.',
       'Lawn from Faisalabad, kurtas from Karachi, waistcoats from Islamabad. Order from verified shops and pay cash when it reaches your door.',
       'Shop all clothing', '/products', 'Meet the shops', '/shops', 'indigo', 0
where not exists (select 1 from banners);

insert into home_sections (key, title, mode) values
  ('featured', 'Featured this week', 'manual'),
  ('popular',  'Popular right now',  'best_selling'),
  ('latest',   'Just added',         'latest')
on conflict (key) do nothing;
