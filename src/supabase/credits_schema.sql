-- ============================================================
--  CREDITS SYSTEM — Run in Supabase → SQL Editor
-- ============================================================

-- 1. Add credit columns if not already there
alter table profiles
  add column if not exists invoice_credits integer default 5,
  add column if not exists total_credits_purchased integer default 0;

-- 2. Fix any existing rows that have NULL (give them 5 free credits)
update profiles
  set invoice_credits = 5
  where invoice_credits is null;

-- 3. Make sure the column always defaults to 5
alter table profiles
  alter column invoice_credits set default 5;

-- 4. Drop old trigger + function if they exist
drop trigger if exists on_invoice_created on public.invoices;
drop function if exists public.deduct_invoice_credit();

-- 5. Recreate deduct function with proper null handling
create or replace function deduct_invoice_credit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  current_credits integer;
begin
  select coalesce(invoice_credits, 5)
    into current_credits
    from profiles
   where id = new.user_id;

  if current_credits <= 0 then
    raise exception 'No invoice credits remaining';
  end if;

  update profiles
    set invoice_credits = coalesce(invoice_credits, 5) - 1
   where id = new.user_id;

  return new;
end;
$$;

-- 6. Recreate trigger
create trigger on_invoice_created
  before insert on public.invoices
  for each row execute procedure deduct_invoice_credit();

-- 7. Admin function to grant credits
create or replace function admin_grant_credits(target_user_id uuid, credit_amount integer)
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

  update profiles
    set invoice_credits = coalesce(invoice_credits, 0) + credit_amount,
        total_credits_purchased = coalesce(total_credits_purchased, 0) + credit_amount
   where id = target_user_id;
end;
$$;