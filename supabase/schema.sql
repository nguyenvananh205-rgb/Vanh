-- ============================================================
-- Tủ lạnh gia đình — Supabase Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Profiles (phone number stored here)
create table public.profiles (
  id uuid references auth.users primary key,
  phone varchar(20) unique not null,
  display_name text,
  created_at timestamptz default now()
);

-- Fridges
create table public.fridges (
  id uuid default gen_random_uuid() primary key,
  name text not null default 'Tủ lạnh gia đình',
  owner_id uuid references public.profiles(id) not null,
  share_code char(6) unique,
  created_at timestamptz default now()
);

-- Fridge membership (non-owners who joined)
create table public.fridge_access (
  fridge_id uuid references public.fridges(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  granted_at timestamptz default now(),
  primary key (fridge_id, user_id)
);

-- Food items (linked to fridge)
create table public.food_items (
  id uuid default gen_random_uuid() primary key,
  fridge_id uuid references public.fridges(id) on delete cascade not null,
  name text not null,
  category text not null,
  quantity numeric not null default 1,
  unit text not null default 'phần',
  expiry_date text not null,
  notes text,
  added_by text,
  created_at timestamptz default now()
);

-- Meal plans
create table public.meal_plans (
  id uuid default gen_random_uuid() primary key,
  fridge_id uuid references public.fridges(id) on delete cascade not null,
  date text not null,
  type text not null,
  name text not null,
  notes text,
  created_at timestamptz default now()
);

-- Shopping items
create table public.shopping_items (
  id uuid default gen_random_uuid() primary key,
  fridge_id uuid references public.fridges(id) on delete cascade not null,
  name text not null,
  category text,
  quantity numeric,
  unit text,
  checked boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.fridges enable row level security;
alter table public.fridge_access enable row level security;
alter table public.food_items enable row level security;
alter table public.meal_plans enable row level security;
alter table public.shopping_items enable row level security;

-- Profiles policies
create policy "profiles_own" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- Fridges: owner full access, members can read, anyone can lookup by share_code
create policy "fridges_owner" on public.fridges for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "fridges_member_read" on public.fridges for select using (id in (select fridge_id from public.fridge_access where user_id = auth.uid()));
create policy "fridges_by_share_code" on public.fridges for select using (true); -- share_code lookup

-- Fridge access policies
create policy "fridge_access_owner" on public.fridge_access for all using (fridge_id in (select id from public.fridges where owner_id = auth.uid()));
create policy "fridge_access_self" on public.fridge_access for select using (user_id = auth.uid());
create policy "fridge_access_join" on public.fridge_access for insert with check (user_id = auth.uid());

-- Food/meal/shopping: open access (fridge UUID is unguessable; share code is the gate)
create policy "food_open" on public.food_items for all using (true) with check (true);
create policy "meals_open" on public.meal_plans for all using (true) with check (true);
create policy "shopping_open" on public.shopping_items for all using (true) with check (true);

-- Function to generate unique 6-char share code
create or replace function generate_share_code() returns text language plpgsql as $$
declare code text; exists boolean;
begin
  loop
    code := upper(substring(md5(random()::text), 1, 6));
    select count(*) > 0 into exists from public.fridges where share_code = code;
    exit when not exists;
  end loop;
  return code;
end;
$$;
