-- Admin Users Table
-- This table stores admin user information linked to Supabase auth.users
-- Table name starts with ali- prefix as per project convention

create table if not exists public."ali-admins" (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role text default 'admin' check (role in ('admin', 'super_admin')),
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public."ali-admins" enable row level security;

-- Policy: Only authenticated users can read their own admin record
create policy "Admins can read own profile" on public."ali-admins"
  for select using (auth.uid() = id);

-- Policy: Only authenticated users can update their own admin record
create policy "Admins can update own profile" on public."ali-admins"
  for update using (auth.uid() = id);

-- Function to automatically create admin record when user signs up
create or replace function public.handle_new_admin_user()
returns trigger as $$
begin
  insert into public."ali-admins" (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists, then create it
drop trigger if exists on_auth_user_created on auth.users;

-- Trigger to create admin record on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_admin_user();

-- Index for faster lookups
create index if not exists idx_ali_admins_email on public."ali-admins"(email);
create index if not exists idx_ali_admins_phone on public."ali-admins"(phone);
create index if not exists idx_ali_admins_is_active on public."ali-admins"(is_active);

