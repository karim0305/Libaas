-- Run AFTER 007. Adds: admin "refer" step, per-shop delivery charges, commission limits, terms acceptance record.

/* ---------- 1. Referral flow: customer order -> admin refers -> shop works on it ---------- */
alter table orders add column if not exists referred_at timestamptz;
alter table orders add column if not exists delivered_at timestamptz;
alter table orders add column if not exists delivery_charge numeric(10,2) not null default 0;

-- orders that were already past "pending" count as referred
update orders set referred_at = created_at where referred_at is null and status in ('confirmed','processing','shipped','delivered');
update orders o set delivered_at = c.created_at from commissions c where c.order_id = o.id and o.delivered_at is null;

-- Shops see (and update) only orders the admin has referred to them
drop policy if exists "shop reads its orders" on orders;
create policy "shop reads its orders" on orders for select using (shop_id = my_shop_id() and referred_at is not null);

drop policy if exists "active shop updates its orders" on orders;
drop policy if exists "shop updates its orders" on orders;
create policy "active shop updates its orders" on orders for update using (shop_id = my_active_shop_id() and referred_at is not null);

drop policy if exists "customer cancels own" on orders;
create policy "customer cancels own" on orders for update
  using (customer_id = auth.uid() and status in ('pending', 'referred', 'confirmed')) with check (status = 'cancelled');

drop policy if exists "order items visible with order" on order_items;
create policy "order items visible with order" on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (
    o.customer_id = auth.uid() or is_admin() or (o.shop_id = my_shop_id() and o.referred_at is not null))));

-- Who may move an order to which status. Only the ADMIN can refer.
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
  return new;
end $$;

-- Commission at the rate stored in platform_settings; also stamps delivered_at
create or replace function generate_commission() returns trigger language plpgsql security definer set search_path = public as $$
declare v_rate numeric; v_fee numeric;
begin
  if new.status = 'delivered' and old.status <> 'delivered' then
    select commission_rate into v_rate from platform_settings where id = 1;
    v_fee := round(new.subtotal * v_rate);
    new.commission_amount := v_fee;
    new.shop_earning := new.subtotal - v_fee;
    new.delivered_at := now();
    insert into commissions (order_id, shop_id, order_amount, rate, commission_amount, shop_earning)
    values (new.id, new.shop_id, new.subtotal, v_rate, v_fee, new.subtotal - v_fee) on conflict (order_id) do nothing;
  elsif new.status = 'cancelled' and old.status <> 'cancelled' then
    update products p set stock = p.stock + oi.quantity from order_items oi where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end $$;

-- Nobody (shop, customer) may edit amounts or ownership of an order by hand; only database functions and the SQL editor can.
create or replace function protect_order_columns() returns trigger language plpgsql as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then return new; end if;
  if new.subtotal is distinct from old.subtotal or new.delivery_charge is distinct from old.delivery_charge
     or new.commission_amount is distinct from old.commission_amount or new.shop_earning is distinct from old.shop_earning
     or new.customer_id is distinct from old.customer_id or new.shop_id is distinct from old.shop_id
     or new.order_no is distinct from old.order_no or new.referred_at is distinct from old.referred_at
     or new.delivered_at is distinct from old.delivered_at
  then raise exception 'Order amounts and ownership cannot be edited'; end if;
  return new;
end $$;
drop trigger if exists a_orders_protect on orders;
create trigger a_orders_protect before update on orders for each row execute function protect_order_columns();  -- "a_" so it runs first

/* ---------- 2. Delivery charges, set by each shop ---------- */
alter table shops add column if not exists delivery_charge numeric(10,2) not null default 250 check (delivery_charge >= 0);
alter table shops add column if not exists free_delivery_above numeric(10,2) default 5000 check (free_delivery_above is null or free_delivery_above > 0);

-- Checkout: prices, stock and delivery charge are all calculated here, never trusted from the browser
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
      insert into order_items (order_id, product_id, name, size, color, quantity, unit_price) values (v_order.id, v_prod.id, v_prod.name, r.size, r.color, r.quantity, v_price);
      update products set stock = stock - r.quantity, sold = sold + r.quantity where id = v_prod.id;
      update orders set subtotal = subtotal + v_price * r.quantity where id = v_order.id;
    end loop;
    select * into v_order from orders where id = v_order.id;
    v_fee := case when v_ship.free_delivery_above is not null and v_order.subtotal >= v_ship.free_delivery_above then 0 else v_ship.delivery_charge end;
    update orders set delivery_charge = v_fee where id = v_order.id returning * into v_order;
    return next v_order;
  end loop;
end $$;

/* ---------- 3. Commission must stay sensible (0% to 50%) ---------- */
alter table platform_settings drop constraint if exists commission_rate_range;
alter table platform_settings add constraint commission_rate_range check (commission_rate >= 0 and commission_rate <= 0.5);

/* ---------- 4. Record that each user accepted the Terms & Conditions ---------- */
alter table profiles add column if not exists terms_accepted_at timestamptz;
alter table profiles add column if not exists terms_version text;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone, email, terms_accepted_at, terms_version)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'phone', new.email,
          nullif(new.raw_user_meta_data->>'terms_accepted_at', '')::timestamptz, new.raw_user_meta_data->>'terms_version')
  on conflict (id) do nothing;
  return new;
end $$;
