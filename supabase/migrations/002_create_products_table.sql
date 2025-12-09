-- Products Table with Categories
-- Table name starts with ali- prefix as per project convention

create table if not exists public."ali-products" (
  id uuid default uuid_generate_v4() primary key,
  
  -- Infos Publiques (Store)
  title text not null,
  description text, -- Peut contenir du HTML basique ou Markdown
  category text not null, -- Ex: 'HIGH-TECH', 'MAISON', 'BEAUTE', 'MODE', 'AUTO', 'MYSTERY'
  subcategory text, -- Ex: 'Audio & Son', 'Éclairage d\'Ambiance', etc.
  images text[] not null default '{}', -- URLs Supabase Storage
  final_price_xof int not null, -- Le prix affiché au client (calculé)
  is_active boolean default true, -- Si false, invisible sur le Store
  is_new boolean default true, -- Badge 'Nouveau'
  stock_quantity int default 0, -- Quantité en stock
  
  -- Infos Privées (Admin seulement)
  sourcing_price_yuan float not null, -- Prix d'achat fournisseur
  weight_kg float not null, -- Poids estimé pour le transport
  
  -- Métadonnées
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references auth.users(id)
);

-- Enable RLS
alter table public."ali-products" enable row level security;

-- Policy: Public can only read active products
create policy "Public Read Active Products" on public."ali-products"
  for select using (is_active = true);

-- Policy: Only authenticated users (admins) can do everything
create policy "Admin Full Access Products" on public."ali-products"
  for all using (auth.role() = 'authenticated');

-- Index for faster queries
create index if not exists idx_ali_products_category on public."ali-products"(category);
create index if not exists idx_ali_products_subcategory on public."ali-products"(subcategory);
create index if not exists idx_ali_products_is_active on public."ali-products"(is_active);
create index if not exists idx_ali_products_created_at on public."ali-products"(created_at desc);

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger update_ali_products_updated_at
  before update on public."ali-products"
  for each row
  execute procedure public.update_updated_at_column();

