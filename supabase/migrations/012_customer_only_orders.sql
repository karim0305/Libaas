-- Run AFTER 011. Only CUSTOMER accounts can place orders or write reviews.
-- Shop owners and the admin who try get: "Please log in from the Customer Panel to place an order".
-- (The functions below are exactly the ones from 010, plus one extra check at the top.)

create or replace function place_order(p_name text, p_phone text, p_address text, p_city text, p_notes text, p_items jsonb)
returns setof orders language plpgsql security definer set search_path = public as $$
declare r record; v_order orders; v_shop uuid; v_price numeric; v_prod products; v_ship shops; v_fee numeric;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if not exists (select 1 from profiles where id = auth.uid() and role = 'customer') then
    raise exception 'Please log in from the Customer Panel to place an order';
  end if;
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

create or replace function submit_review(p_order_id uuid, p_product_id uuid, p_rating int, p_comment text)
returns reviews language plpgsql security definer set search_path = public as $$
declare v_order orders; v_name text; v_row reviews;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if not exists (select 1 from profiles where id = auth.uid() and role = 'customer') then
    raise exception 'Only customer accounts can write reviews';
  end if;
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
