-- Business rules live in the database, not in the UI.

-- New auth user -> profile (role is always 'customer'; admins are promoted manually, shops via register_shop)
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'phone');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;
create or replace function my_shop_id() returns uuid language sql stable security definer set search_path = public as $$
  select id from shops where owner_id = auth.uid();
$$;

-- Shop registration: creates a pending shop and promotes the caller to role 'shop'
create or replace function register_shop(p_name text, p_city text, p_phone text, p_description text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into shops (owner_id, name, slug, city, phone, description)
  values (auth.uid(), p_name, lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 4), p_city, p_phone, p_description)
  returning id into v_id;
  update profiles set role = 'shop' where id = auth.uid();
  return v_id;
end $$;

-- Checkout: p_items = [{"product_id":"..","size":"M","color":"Navy","quantity":2}, ...]
-- Splits by shop, snapshots prices server-side (never trust client prices), decrements stock.
create or replace function place_order(p_name text, p_phone text, p_address text, p_city text, p_notes text, p_items jsonb)
returns setof orders language plpgsql security definer set search_path = public as $$
declare r record; v_order orders; v_shop uuid; v_price numeric; v_prod products;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  for v_shop in select distinct pr.shop_id from jsonb_to_recordset(p_items) i(product_id uuid) join products pr on pr.id = i.product_id loop
    if not exists (select 1 from shops where id = v_shop and status = 'active') then raise exception 'A shop in your cart is not accepting orders'; end if;
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
    return next v_order;
  end loop;
end $$;

-- Status transitions + the 5% commission. Only 'delivered' creates a commission.
create or replace function generate_commission() returns trigger language plpgsql security definer set search_path = public as $$
declare v_rate numeric; v_fee numeric;
begin
  if new.status = 'delivered' and old.status <> 'delivered' then
    select commission_rate into v_rate from platform_settings where id = 1;
    v_fee := round(new.subtotal * v_rate);
    new.commission_amount := v_fee;
    new.shop_earning := new.subtotal - v_fee;
    insert into commissions (order_id, shop_id, order_amount, rate, commission_amount, shop_earning)
    values (new.id, new.shop_id, new.subtotal, v_rate, v_fee, new.subtotal - v_fee) on conflict (order_id) do nothing;
  elsif new.status = 'cancelled' and old.status <> 'cancelled' then
    update products p set stock = p.stock + oi.quantity from order_items oi where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end $$;
create trigger orders_commission before update of status on orders for each row execute function generate_commission();

-- Guard rails: shops may only move forward one step (or cancel); delivered/cancelled are final.
create or replace function guard_status() returns trigger language plpgsql as $$
begin
  if old.status in ('delivered', 'cancelled') and new.status <> old.status then raise exception 'Order is closed'; end if;
  return new;
end $$;
create trigger orders_guard before update of status on orders for each row execute function guard_status();
