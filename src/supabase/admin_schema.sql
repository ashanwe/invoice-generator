-- ============================================================
--  Run this in Supabase → SQL Editor
--  STEP 1: Add admin flag to profiles
-- ============================================================

alter table profiles add column if not exists is_admin boolean default false;

-- Set YOUR account as admin (replace with your email)
update profiles set is_admin = true where email = 'YOUR_EMAIL_HERE';

-- ============================================================
--  STEP 2: Create admin stats function
-- ============================================================

create or replace function get_admin_stats()
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  -- Only allow admins
  if not exists (
    select 1 from profiles where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Unauthorized';
  end if;

  select json_build_object(
    'total_users',           (select count(*) from auth.users),
    'total_invoices',        (select count(*) from public.invoices),
    'total_revenue',         (select coalesce(sum(total_amount), 0) from public.invoices),
    'new_users_this_month',  (select count(*) from auth.users where created_at >= date_trunc('month', now())),
    'active_users_this_month', (select count(distinct user_id) from public.invoices where created_at >= date_trunc('month', now()))
  ) into result;

  return result;
end;
$$;

-- ============================================================
--  STEP 3: Function to get all users (admin only)
-- ============================================================

create or replace function get_all_users()
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  -- Only allow admins
  if not exists (
    select 1 from profiles where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Unauthorized';
  end if;

  select json_agg(
    json_build_object(
      'id',                 au.id,
      'email',              au.email,
      'created_at',         au.created_at,
      'last_sign_in_at',    au.last_sign_in_at,
      'email_confirmed_at', au.email_confirmed_at,
      'full_name',          p.full_name,
      'is_admin',           p.is_admin,
      'invoice_count',      (select count(*) from public.invoices where user_id = au.id),
      'total_revenue',      (select coalesce(sum(total_amount), 0) from public.invoices where user_id = au.id)
    )
    order by au.created_at desc
  )
  from auth.users au
  left join public.profiles p on p.id = au.id
  into result;

  return result;
end;
$$;

-- ============================================================
--  STEP 4: Function to delete a user (admin only)
-- ============================================================

create or replace function admin_delete_user(target_user_id uuid)
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

  -- Prevent deleting yourself
  if target_user_id = auth.uid() then
    raise exception 'Cannot delete your own account';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

-- ============================================================
--  STEP 5: Function to confirm a user's email (admin only)
-- ============================================================

create or replace function admin_confirm_user(target_user_id uuid)
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

  update auth.users
  set email_confirmed_at = now()
  where id = target_user_id;
end;
$$;
