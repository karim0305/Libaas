-- Run AFTER 001-003. Adds email to profiles (admin customer list needs it) and backfills any users created earlier.
alter table profiles add column if not exists email text;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'phone', new.email)
  on conflict (id) do nothing;
  return new;
end $$;

-- backfill users that signed up before the trigger existed
insert into profiles (id, full_name, phone, email)
select id, coalesce(raw_user_meta_data->>'full_name', ''), raw_user_meta_data->>'phone', email from auth.users
on conflict (id) do update set email = excluded.email;
