-- Run AFTER 010. Adds: AKS- order numbers, and commission payments (shop tells admin it paid; admin marks received).

/* ---------- 1. Order numbers: LB-100004 -> AKS-100004 ---------- */
alter table orders alter column order_no set default ('AKS-' || nextval('order_no_seq'));
update orders set order_no = 'AKS-' || substr(order_no, 4) where order_no like 'LB-%';

/* ---------- 2. Commission payments ---------- */
create table if not exists commission_payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  paid_on date not null,
  amount numeric(12,2) not null check (amount > 0),
  comment text not null default '' check (char_length(comment) <= 500),
  status text not null default 'not_received' check (status in ('not_received', 'received')),
  received_at timestamptz,
  received_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists commission_payments_shop_idx on commission_payments (shop_id, paid_on desc);
alter table commission_payments enable row level security;

-- A shop sees only its own payments. The admin sees all. Nobody can delete.
create policy "shop reads own payments" on commission_payments for select using (shop_id = my_shop_id());
create policy "admin reads payments" on commission_payments for select using (is_admin());
create policy "active shop submits payments" on commission_payments for insert with check (shop_id = my_active_shop_id());
create policy "shop edits unreceived payments" on commission_payments for update
  using (shop_id = my_shop_id() and status = 'not_received') with check (shop_id = my_shop_id());
create policy "admin receives payments" on commission_payments for update
  using (is_admin() and status = 'not_received') with check (is_admin());

-- Rules that RLS cannot express:
--  * a shop can edit date, amount and comment, but never the status, and only while it is "not received"
--  * the admin can only mark a payment received (cannot change the amount, date or comment)
--  * once received, nobody (shop or admin) can change it again
create or replace function guard_commission_payment() returns trigger language plpgsql as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'not_received'; new.received_at := null; new.received_by := null;
    if new.paid_on > current_date + 1 then raise exception 'The payment date cannot be in the future'; end if;
    return new;
  end if;
  if old.status = 'received' then raise exception 'This payment has been received and is locked'; end if;
  if is_admin() then
    if new.shop_id <> old.shop_id or new.paid_on <> old.paid_on or new.amount <> old.amount or new.comment <> old.comment then
      raise exception 'The admin can only mark a payment as received';
    end if;
    if new.status = 'received' then new.received_at := now(); new.received_by := auth.uid(); end if;
  else
    if new.status <> 'not_received' or new.shop_id <> old.shop_id or new.received_at is distinct from old.received_at or new.received_by is distinct from old.received_by then
      raise exception 'A shop cannot change the status of a payment';
    end if;
    if new.paid_on > current_date + 1 then raise exception 'The payment date cannot be in the future'; end if;
    new.updated_at := now();
  end if;
  return new;
end $$;
drop trigger if exists commission_payments_guard on commission_payments;
create trigger commission_payments_guard before insert or update on commission_payments for each row execute function guard_commission_payment();
