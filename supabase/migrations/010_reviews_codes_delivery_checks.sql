-- Run AFTER 009. Adds: product codes, customer reviews, and delivery verification (customer confirmation, cancel reasons, disputes).

/* =====================================================================
   1. Shop code + product code
   Each shop gets a unique code (first 3 letters of its name). A product code is that code + "-" + a number the
   shop owner chooses, e.g. KHA-1042. The shop part is fixed, so two shops can never clash.
   ===================================================================== */
alter table shops add column if not exists shop_code text;

create or replace function make_shop_code(p_name text) returns text language plpgsql as $$
declare base text; cand text; n int := 1;
begin
  base := upper(left(regexp_replace(coalesce(p_name, ''), '[^a-zA-Z]', '', 'g') || 'XXX', 3));
  cand := base;
  while exists (select 1 from shops where shop_code = cand) loop n := n + 1; cand := base || n::text; end loop;
  return cand;
end $$;

do $$ declare r record; begin
  for r in select id, name from shops where shop_code is null order by created_at loop
    update shops set shop_code = make_shop_code(r.name) where id = r.id;
  end loop;
end $$;

alter table shops alter column shop_code set not null;
create unique index if not exists shops_shop_code_key on shops (shop_code);

create or replace function set_shop_code() returns trigger language plpgsql as $$
begin
  if new.shop_code is null or new.shop_code = '' then new.shop_code := make_shop_code(new.name); end if;
  return new;
end $$;
drop trigger if exists shops_set_code on shops;
create trigger shops_set_code before insert on shops for each row execute function set_shop_code();

create or replace function protect_shop_code() returns trigger language plpgsql as $$
begin
  if new.shop_code is distinct from old.shop_code and not is_admin() and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'The shop code cannot be changed';
  end if;
  return new;
end $$;
drop trigger if exists shops_protect_code on shops;
create trigger shops_protect_code before update on shops for each row execute function protect_shop_code();

alter table products add column if not exists code text;
update products p set code = s.shop_code || '-' || lpad(x.rn::text, 3, '0')
from (select id, shop_id, row_number() over (partition by shop_id order by created_at) as rn from products where code is null) x
join shops s on s.id = x.shop_id
where p.id = x.id;
alter table products alter column code set not null;
create unique index if not exists products_code_key on products (code);

create or replace function check_product_code() returns trigger language plpgsql security definer set search_path = public as $$
declare v text;
begin
  select shop_code into v from shops where id = new.shop_id;
  if new.code is null or new.code !~ ('^' || v || '-[0-9]{1,6}$') then
    raise exception 'Product code must be % followed by a number of 1 to 6 digits', v || '-';
  end if;
  return new;
end $$;
drop trigger if exists products_code_check on products;
create trigger products_code_check before insert or update of code, shop_id on products for each row execute function check_product_code();

alter table order_items add column if not exists product_code text;
update order_items oi set product_code = p.code from products p where p.id = oi.product_id and oi.product_code is null;

/* =====================================================================
   2. Reviews: only the customer of a DELIVERED order, once per order item
   ===================================================================== */
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  customer_id uuid not null references profiles(id) on delete cascade,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 600),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, product_id)
);
create index if not exists reviews_product_idx on reviews (product_id);
create index if not exists reviews_shop_idx on reviews (shop_id);
alter table reviews enable row level security;

-- Everyone reads visible reviews. Nobody inserts directly: only submit_review() below can.
create policy "public reads visible reviews" on reviews for select using (not is_hidden or customer_id = auth.uid() or is_admin());
create policy "admin manages reviews" on reviews for all using (is_admin()) with check (is_admin());

create or replace function submit_review(p_order_id uuid, p_product_id uuid, p_rating int, p_comment text)
returns reviews language plpgsql security definer set search_path = public as $$
declare v_order orders; v_name text; v_row reviews;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into v_order from orders where id = p_order_id and customer_id = auth.uid();
  if not found then raise exception 'Order not found'; end if;
  if v_order.status <> 'delivered' then raise exception 'You can review a product after the order is delivered'; end if;
  if not exists (select 1 from order_items where order_id = p_order_id and product_id = p_product_id) then raise exception 'That product is not in this order'; end if;
  v_name := coalesce((select case when trim(full_name) = '' then 'Customer'
                                  when position(' ' in trim(full_name)) = 0 then trim(full_name)
                                  else split_part(trim(full_name), ' ', 1) || ' ' || upper(left(split_part(trim(full_name), ' ', 2), 1)) || '.' end
                      from profiles where id = auth.uid()), 'Customer');
  insert into reviews (order_id, product_id, shop_id, customer_id, customer_name, rating, comment)
  values (p_order_id, p_product_id, v_order.shop_id, auth.uid(), v_name, p_rating, left(coalesce(p_comment, ''), 600))
  on conflict (order_id, product_id) do update set rating = excluded.rating, comment = excluded.comment, updated_at = now()
  returning * into v_row;
  return v_row;
end $$;

/* =====================================================================
   3. Delivery verification: stop a shop hiding a delivery (or faking a "returned" order) to avoid commission
   ===================================================================== */
alter table orders add column if not exists status_changed_at timestamptz not null default now();
alter table orders add column if not exists cancel_reason text not null default '';
alter table orders add column if not exists cancelled_by text check (cancelled_by in ('customer', 'shop', 'admin'));
alter table orders add column if not exists customer_confirmed_at timestamptz;
alter table orders add column if not exists disputed_at timestamptz;
alter table orders add column if not exists dispute_note text not null default '';
alter table orders add column if not exists admin_checked_at timestamptz;
update orders set status_changed_at = coalesce(delivered_at, referred_at, created_at);
update orders set cancelled_by = 'admin' where status = 'cancelled' and cancelled_by is null;

-- Status rules (refer = admin only) plus: who cancelled, why, and when the status last changed
create or replace function guard_status() returns trigger language plpgsql as $$
begin
  if new.status = old.status then return new; end if;
  if old.status in ('delivered', 'cancelled') then raise exception 'Order is closed'; end if;
  if new.status = 'referred' then
    if not is_admin() then raise exception 'Only the admin can refer an order to a shop'; end if;
    if old.status <> 'pending' then raise exception 'Only pending orders can be referred'; end if;
    new.referred_at := now();
  elsif old.status = 'pending' and new.status <> 'cancelled' then
    raise exception 'The admin must refer this order to the shop first';
  elsif new.status = 'pending' then
    raise exception 'An order cannot go back to pending';
  end if;
  if new.status = 'cancelled' then
    if is_admin() or current_user in ('postgres', 'supabase_admin', 'service_role') then
      new.cancelled_by := 'admin';
    elsif auth.uid() = old.customer_id then
      new.cancelled_by := 'customer';
    else
      new.cancelled_by := 'shop';
      if char_length(trim(coalesce(new.cancel_reason, ''))) < 3 then raise exception 'Please give a reason for cancelling this order'; end if;
    end if;
  end if;
  new.status_changed_at := now();
  return new;
end $$;

create or replace function protect_order_columns() returns trigger language plpgsql as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then return new; end if;
  if new.subtotal is distinct from old.subtotal or new.delivery_charge is distinct from old.delivery_charge
     or new.commission_amount is distinct from old.commission_amount or new.shop_earning is distinct from old.shop_earning
     or new.customer_id is distinct from old.customer_id or new.shop_id is distinct from old.shop_id
     or new.order_no is distinct from old.order_no or new.referred_at is distinct from old.referred_at
     or new.delivered_at is distinct from old.delivered_at or new.cancelled_by is distinct from old.cancelled_by
     or new.customer_confirmed_at is distinct from old.customer_confirmed_at or new.disputed_at is distinct from old.disputed_at
     or new.dispute_note is distinct from old.dispute_note or new.status_changed_at is distinct from old.status_changed_at
  then raise exception 'Order amounts and ownership cannot be edited'; end if;
  if not is_admin() and new.admin_checked_at is distinct from old.admin_checked_at then raise exception 'Only the admin can mark an order as checked'; end if;
  if new.status = old.status and new.cancel_reason is distinct from old.cancel_reason and not is_admin() then raise exception 'The cancellation reason cannot be changed'; end if;
  return new;
end $$;

-- The customer confirms they received the order -> delivered -> commission is earned
create or replace function confirm_receipt(p_order_id uuid) returns orders language plpgsql security definer set search_path = public as $$
declare v orders;
begin
  select * into v from orders where id = p_order_id and customer_id = auth.uid();
  if not found then raise exception 'Order not found'; end if;
  if v.status not in ('confirmed', 'processing', 'shipped') then raise exception 'This order cannot be confirmed as received yet'; end if;
  update orders set status = 'delivered', customer_confirmed_at = now() where id = p_order_id returning * into v;
  return v;
end $$;

-- The customer says a shop's cancellation is untrue -> the admin sees it in "Delivery checks"
create or replace function dispute_cancellation(p_order_id uuid, p_note text) returns void language plpgsql security definer set search_path = public as $$
begin
  update orders set disputed_at = now(), dispute_note = left(coalesce(p_note, ''), 500)
  where id = p_order_id and customer_id = auth.uid() and status = 'cancelled' and cancelled_by = 'shop' and disputed_at is null;
  if not found then raise exception 'There is nothing to dispute on this order'; end if;
end $$;

/* =====================================================================
   4. Checkout now also stores each item's product code (everything else is as in 008)
   ===================================================================== */
create or replace function place_order(p_name text, p_phone text, p_address text, p_city text, p_notes text, p_items jsonb)
returns setof orders language plpgsql security definer set search_path = public as $$
declare r record; v_order orders; v_shop uuid; v_price numeric; v_prod products; v_ship shops; v_fee numeric;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  for v_shop in select distinct pr.shop_id from jsonb_to_recordset(p_items) i(product_id uuid) join products pr on pr.id = i.product_id loop
    select * into v_ship from shops where id = v_shop and status = 'active';
    if not found then raise exception 'A shop in your cart is not accepting orders'; end if;
    insert into orders (customer_id, shop_id, customer_name, phone, address, city, notes)
    values (auth.uid(), v_shop, p_name, p_phone, p_address, p_city, p_notes) returning * into v_order;
    for r in select * from jsonb_to_recordset(p_items) i(product_id uuid, size text, color text, quantity int) loop
      select * into v_prod from products where id = r.product_id and shop_id = v_shop for update;
      if not found then continue; end if;
      if v_prod.stock < r.quantity then raise exception 'Only % left of %', v_prod.stock, v_prod.name; end if;
      v_price := round(v_prod.price * (1 - v_prod.discount_percent / 100.0));
      insert into order_items (order_id, product_id, product_code, name, size, color, quantity, unit_price)
      values (v_order.id, v_prod.id, v_prod.code, v_prod.name, r.size, r.color, r.quantity, v_price);
      update products set stock = stock - r.quantity, sold = sold + r.quantity where id = v_prod.id;
      update orders set subtotal = subtotal + v_price * r.quantity where id = v_order.id;
    end loop;
    select * into v_order from orders where id = v_order.id;
    v_fee := case when v_ship.free_delivery_above is not null and v_order.subtotal >= v_ship.free_delivery_above then 0 else v_ship.delivery_charge end;
    update orders set delivery_charge = v_fee where id = v_order.id returning * into v_order;
    return next v_order;
  end loop;
end $$;
