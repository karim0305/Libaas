alter table profiles enable row level security;
alter table shops enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table commissions enable row level security;
alter table platform_settings enable row level security;

-- profiles
create policy "own profile" on profiles for select using (id = auth.uid() or is_admin());
create policy "update own profile (not role)" on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
create policy "admin manages profiles" on profiles for all using (is_admin());

-- shops: public sees active ones; owner sees/edits own; admin everything
create policy "public active shops" on shops for select using (status = 'active' or owner_id = auth.uid() or is_admin());
create policy "owner edits shop" on shops for update using (owner_id = auth.uid()) with check (owner_id = auth.uid() and status = (select status from shops where owner_id = auth.uid()));
create policy "admin manages shops" on shops for all using (is_admin());

-- categories: public read, admin write
create policy "public categories" on categories for select using (true);
create policy "admin categories" on categories for all using (is_admin());

-- products: public sees products of active shops; shop manages only its own
create policy "public products" on products for select using (exists (select 1 from shops s where s.id = shop_id and s.status = 'active') or shop_id = my_shop_id() or is_admin());
create policy "shop inserts own" on products for insert with check (shop_id = my_shop_id());
create policy "shop updates own" on products for update using (shop_id = my_shop_id()) with check (shop_id = my_shop_id());
create policy "shop deletes own" on products for delete using (shop_id = my_shop_id());
create policy "admin products" on products for all using (is_admin());

create policy "public images" on product_images for select using (true);
create policy "shop manages own images" on product_images for all using (exists (select 1 from products p where p.id = product_id and p.shop_id = my_shop_id())) with check (exists (select 1 from products p where p.id = product_id and p.shop_id = my_shop_id()));
create policy "admin images" on product_images for all using (is_admin());

-- carts: owner only
create policy "own cart" on carts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own cart items" on cart_items for all using (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid())) with check (exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid()));

-- orders: customer sees own, shop sees own shop's, admin sees all. Inserts only via place_order().
create policy "customer reads own orders" on orders for select using (customer_id = auth.uid());
create policy "shop reads its orders" on orders for select using (shop_id = my_shop_id());
create policy "customer cancels own" on orders for update using (customer_id = auth.uid() and status in ('pending', 'confirmed')) with check (status = 'cancelled');
create policy "shop updates its orders" on orders for update using (shop_id = my_shop_id());
create policy "admin orders" on orders for all using (is_admin());

create policy "order items visible with order" on order_items for select using (exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or o.shop_id = my_shop_id() or is_admin())));

create policy "shop reads own commissions" on commissions for select using (shop_id = my_shop_id() or is_admin());
create policy "admin settings" on platform_settings for all using (is_admin());
create policy "read settings" on platform_settings for select using (true);

-- Storage: public bucket for product images; shops write only into a folder named after their shop id
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict do nothing;
create policy "public read images" on storage.objects for select using (bucket_id = 'product-images');
create policy "shop uploads to own folder" on storage.objects for insert with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = my_shop_id()::text);
create policy "shop deletes own images" on storage.objects for delete using (bucket_id = 'product-images' and (storage.foldername(name))[1] = my_shop_id()::text);

-- Promote the first admin manually:  update profiles set role = 'admin' where id = '<auth user uuid>';
