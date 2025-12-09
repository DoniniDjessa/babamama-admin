-- Orders Table
-- Table name starts with ali- prefix as per project convention

create table if not exists public."ali-orders" (
  id uuid default uuid_generate_v4() primary key,
  
  -- Info Client
  customer_name text not null,
  customer_phone text not null,
  delivery_address text, -- Quartier/Ville
  
  -- Contenu de la commande
  -- Structure JSONB attendue : [{ "product_id": "uuid", "title": "Nom", "price": 5000, "qty": 1 }]
  items jsonb not null, 
  
  -- Financier
  total_amount_xof int not null,
  payment_method text check (payment_method in ('wave', 'om', 'cash', 'pending')),
  
  -- Statut
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled')),
  
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public."ali-orders" enable row level security;

-- Policy: Public can create orders (Anonymous)
create policy "Public Create Orders" on public."ali-orders"
  for insert with check (true);

-- Policy: Only authenticated users (admins) can read orders
create policy "Admin Read Orders" on public."ali-orders"
  for select using (auth.role() = 'authenticated');

-- Policy: Only authenticated users (admins) can update orders
create policy "Admin Update Orders" on public."ali-orders"
  for update using (auth.role() = 'authenticated');

-- Index for faster queries
create index if not exists idx_ali_orders_status on public."ali-orders"(status);
create index if not exists idx_ali_orders_created_at on public."ali-orders"(created_at desc);
create index if not exists idx_ali_orders_customer_phone on public."ali-orders"(customer_phone);

