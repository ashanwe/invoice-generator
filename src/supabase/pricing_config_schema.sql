-- ============================================================
--  PRICING CONFIG — Run in Supabase → SQL Editor
-- ============================================================

-- 1. Create pricing_config table
create table if not exists public.pricing_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

-- 2. RLS — anyone can read, only admins can write
alter table public.pricing_config enable row level security;

drop policy if exists "Public read pricing config" on public.pricing_config;
create policy "Public read pricing config"
  on public.pricing_config for select
  using (true);

drop policy if exists "Admin write pricing config" on public.pricing_config;
create policy "Admin write pricing config"
  on public.pricing_config for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- 3. Seed default config values
insert into public.pricing_config (key, value) values
  ('free_credits',      '5'),
  ('monthly_base_price','12.99'),
  ('first_month_discount', '40'),
  ('bulk_discounts',    '{"6": 20, "12": 30}'),
  ('credit_packs',      '[
    {"id":"pack_20","credits":20,"price":4.99,"label":"Starter","desc":"Great for freelancers","popular":false},
    {"id":"pack_50","credits":50,"price":9.99,"label":"Pro","desc":"Most popular choice","popular":true},
    {"id":"pack_100","credits":100,"price":16.99,"label":"Business","desc":"Best value per invoice","popular":false}
  ]'),
  ('promo_banner',      '{"active": false, "text": "", "color": "blue"}')
on conflict (key) do nothing;

-- 4. Admin function to update pricing config
create or replace function admin_update_pricing_config(config_key text, config_value jsonb)
returns void
language plpgsql
security definer
as $$
begin
  if not exists (
    select 1 from profiles where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Unauthorized';
  end if;

  insert into public.pricing_config (key, value, updated_at, updated_by)
    values (config_key, config_value, now(), auth.uid())
  on conflict (key) do update
    set value = excluded.value,
        updated_at = now(),
        updated_by = auth.uid();
end;
$$;

-- 5. Update handle_new_user trigger to use dynamic free_credits
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  free_credits integer;
begin
  select coalesce((value::text)::integer, 5)
    into free_credits
    from public.pricing_config
   where key = 'free_credits';

  insert into public.profiles (id, email, invoice_credits)
    values (new.id, new.email, coalesce(free_credits, 5))
  on conflict (id) do nothing;

  return new;
end;
$$;
