-- ============================================================
--  Run this entire file in Supabase → SQL Editor
-- ============================================================

-- 1. PROFILES
create table if not exists profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  full_name     text,
  email         text,
  address       text,
  logo_url      text,
  bank_name     text,
  bank_account_name   text,
  bank_account_number text,
  bank_routing  text,
  updated_at    timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users manage own profile"
  on profiles for all
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. INVOICES
create table if not exists invoices (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade,
  invoice_number  text not null,
  issue_date      date,
  due_date        date,
  from_data       jsonb,
  to_data         jsonb,
  items           jsonb,
  tax_rate        numeric default 0,
  notes           text,
  status          text default 'draft',
  total_amount    numeric default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table invoices enable row level security;

create policy "Users manage own invoices"
  on invoices for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. STORAGE BUCKET for logos
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict do nothing;

create policy "Users upload own logo"
  on storage.objects for insert
  with check (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Logos are public"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "Users delete own logo"
  on storage.objects for delete
  using (bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]);
