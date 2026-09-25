create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('free', 'pro')),
  status text not null check (status in ('active', 'canceled', 'expired')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  payment_method text not null check (payment_method in ('paypal', 'bank_transfer')),
  amount numeric(10,2) not null check (amount > 0),
  currency text not null,
  plan text not null check (plan in ('pro')),
  status text not null check (status in ('pending', 'approved', 'rejected', 'failed')) default 'pending',
  payment_reference text,
  provider_transaction_id text unique,
  proof_url text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do update set email = excluded.email, updated_at = now();
  insert into public.memberships (user_id, plan, status) values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.payment_requests enable row level security;

create policy "profiles own read" on public.profiles for select using (auth.uid() = id);
create policy "memberships own read" on public.memberships for select using (auth.uid() = user_id);
create policy "payments own read" on public.payment_requests for select using (auth.uid() = user_id);
create policy "payments own create" on public.payment_requests for insert with check (auth.uid() = user_id);

revoke update, delete on public.memberships from authenticated;
revoke update, delete on public.payment_requests from authenticated;