Ce fichier définit la vérité absolue des données. À donner en priorité. les parties ou cest marquer FRONT END ne te concerne pas

toutes nos tables commenceront par : ali-   pour les differenciers des tables des autres applis dans notre projet supabase

Markdown

# 00_SHARED_ARCHITECTURE.MD - VÉRITÉ DES DONNÉES

## 1. Contexte Global
Deux applications Next.js 14 (App Router) partagent une même base de données Supabase.
1. `nova-admin` : Dashboard de gestion (Write Access).
2. `nova-store` : Vitrine PWA Mobile-First (Read Access).

## 2. Supabase SQL Schema (Strict Definition)
Copie ce SQL pour initialiser la base de données. Ne change pas les noms des colonnes.

```sql
-- CONFIGURATION
-- Activez l'extension pour les UUID si nécessaire
create extension if not exists "uuid-ossp";

-- 1. TABLE SETTINGS (Singleton)
-- Contient les variables pour l'algorithme de prix.
-- Une seule ligne autorisée dans cette table.
create table public.settings (
  id int primary key generated always as identity,
  exchange_rate_yuan_xof float not null default 85.0, -- Taux 1 Yuan = X FCFA
  shipping_price_per_kg int not null default 8000,   -- Prix transport par KG
  customs_percentage int not null default 10,        -- Douane (ex: 10 pour 10%)
  margin_percentage int not null default 20,         -- Marge (ex: 20 pour 20%)
  updated_at timestamp with time zone default now()
);

-- Seed initial (Valeurs par défaut)
insert into public.settings (exchange_rate_yuan_xof, shipping_price_per_kg, customs_percentage, margin_percentage)
values (90.0, 9000, 10, 25);

-- 2. TABLE PRODUCTS
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  
  -- Infos Publiques (Store)
  title text not null,
  description text, -- Peut contenir du HTML basique ou Markdown
  category text not null, -- Ex: 'Tech', 'Maison', 'Mode'
  images text[] not null default '{}', -- URLs Supabase Storage
  final_price_xof int not null, -- Le prix affiché au client (calculé)
  is_active boolean default true, -- Si false, invisible sur le Store
  is_new boolean default true, -- Badge 'Nouveau'
  
  -- Infos Privées (Admin seulement)
  sourcing_price_yuan float not null, -- Prix d'achat fournisseur
  weight_kg float not null, -- Poids estimé pour le transport
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. TABLE ORDERS
create table public.orders (
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
3. Row Level Security (RLS) - SÉCURITÉ CRITIQUE
C'est ici qu'on empêche le Store de modifier les prix.

SQL

-- Active RLS sur toutes les tables
alter table public.products enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;

-- POLICY : PRODUCTS
-- Tout le monde peut LIRE les produits actifs
create policy "Public Read Active Products" on public.products
for select using (is_active = true);

-- Seul l'Admin (Authentifié) peut TOUT faire
create policy "Admin Full Access Products" on public.products
for all using (auth.role() = 'authenticated');

-- POLICY : ORDERS
-- Tout le monde peut créer une commande (Anonyme)
create policy "Public Create Orders" on public.orders
for insert with check (true);

-- Seul l'Admin peut VOIR les commandes
create policy "Admin Read Orders" on public.orders
for select using (auth.role() = 'authenticated');

---

### FICHIER 2 : NOVA ADMIN - LOGIQUE MÉTIER (`01_admin_logic.md`)
*Ce fichier dicte comment le cerveau fonctionne.*

```markdown
# 01_ADMIN_LOGIC.MD - LE CERVEAU

## 1. Stack Technique Admin
- **Base :** Next.js 14, TypeScript.
- **UI :** Shadcn UI (installé via `npx shadcn-ui@latest init`).
- **Composants Requis :** Card, Input, Button, Label, Select, Table, Toast (Sonner).

## 2. Page Clé : `/products/new` (Le Formulaire Intelligent)
Cette page est le coeur du système. Voici l'implémentation exacte attendue.

### A. State Management
Utiliser `react-hook-form` + `zod` pour la validation.

### B. Algorithme de Calcul (TypeScript)
Crée un hook `usePriceCalculator.ts` qui écoute les champs du formulaire.

```typescript
// Types pour les paramètres globaux (venant de la table settings)
type GlobalSettings = {
  exchange_rate: number; // Ex: 90
  shipping_per_kg: number; // Ex: 9000
  customs_percent: number; // Ex: 10
  margin_percent: number; // Ex: 25
};

// Fonction de calcul PURE
export const calculateFinalPrice = (
  priceYuan: number, 
  weightKg: number, 
  settings: GlobalSettings
) => {
  // 1. Conversion Achat en CFA
  const purchaseCost = priceYuan * settings.exchange_rate;
  
  // 2. Coût Transport
  const transportCost = weightKg * settings.shipping_per_kg;
  
  // 3. Coût Débarqué (Landed Cost)
  const landedCost = purchaseCost + transportCost;
  
  // 4. Application Douane
  const withCustoms = landedCost * (1 + (settings.customs_percent / 100));
  
  // 5. Application Marge
  const sellingPriceRaw = withCustoms * (1 + (settings.margin_percent / 100));
  
  // 6. Règle d'Arrondi "Joli Prix" (Arrondi au 50 ou 100 supérieur)
  // Ex: 14320 -> 14350. 14370 -> 14400.
  const finalPrice = Math.ceil(sellingPriceRaw / 50) * 50;
  
  return {
    finalPrice,
    details: {
      purchaseCost,
      transportCost,
      landedCost,
      marginAmount: finalPrice - withCustoms
    }
  };
};
C. UX du Formulaire
Les champs price_yuan et weight sont des inputs numériques.

À droite du formulaire (ou en dessous sur mobile), une "Carte de Simulation" affiche les détails en direct.

Affichage visuel :

"Prix Chine : X FCFA" (Gris)

"Transport : Y FCFA" (Gris)

"Douane : Z FCFA" (Gris)

"PRIX CLIENT FINAL : [RESULTAT] FCFA" (Gros, Vert, Gras).

3. Gestion des Médias (Images)
Utiliser un composant d'upload Drag & Drop.

Upload vers Supabase Storage bucket products.

Optimisation : Redimensionner les images en 800x800px (format WebP) avant l'upload si possible (client-side compression) pour économiser la bande passante.

4. Dashboard (Page d'accueil Admin)
KPI Cards en haut :

Commandes en attente (Nombre).

Chiffre d'affaires du jour.

Produits actifs.

Tableau central : Liste des dernières commandes avec statut modifiable (Select : Pending -> Confirmed -> Delivered).


---

### FICHIER 3 : NOVA STORE - DESIGN & PWA (`02_store_design.md`)
*Ce fichier dicte l'apparence et le comportement mobile.*

```markdown
# 02_STORE_DESIGN.MD - LA BEAUTÉ & L'ADDICTION

## 1. Configuration PWA (Manifest.json)
Le fichier `public/manifest.json` doit être configuré pour une installation "App Native".
- `name`: "NovaMarket"
- `short_name`: "Nova"
- `start_url`: "/"
- `display`: "standalone" (Cache la barre URL du navigateur)
- `background_color`: "#FFFFFF"
- `theme_color`: "#FFFFFF" (Change la couleur de la barre de statut Android/iOS)
- **Icons**: Prévoir impérativement les tailles 192x192 et 512x512.

## 2. Design System (Tailwind CSS Exact)

### Palette de Couleurs
- **Background App :** `bg-slate-50` (Très légèrement gris pour le contraste).
- **Surface Cards :** `bg-white` avec `backdrop-blur-md` si superposition.
- **Textes :**
  - Titres : `text-slate-900` font-bold tracking-tight.
  - Body : `text-slate-500` text-sm leading-relaxed.
  - Prix : `text-indigo-600` font-bold.
- **Boutons (Gradients) :** `bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30`.

### Ombres & Arrondis (Le "Look" Premium)
- Ne jamais utiliser `shadow-black`. Utiliser des ombres colorées très diffuses.
- Classe utilitaire recommandée : `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`.
- Arrondis : `rounded-2xl` pour les cards, `rounded-full` pour les boutons.

## 3. Composants Clés & Animations

### A. La grille Produit (Masonry)
- Utiliser CSS Grid : `grid grid-cols-2 gap-4 p-4`.
- **ProductCard Component :**
  - Image : Aspect ratio 1/1 ou 4/5. `object-cover`.
  - Animation au scroll : Utiliser `framer-motion`.
    ```jsx
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
    ```

### B. Le Drawer Produit (Fiche Détail)
Au clic sur un produit, ne pas naviguer vers une nouvelle page. Ouvrir un **Bottom Sheet** (Tiroir venant du bas).
- Librairie recommandée : `vaul` (pour React) ou `framer-motion` custom.
- Cela garde l'utilisateur dans le "flow" du scroll infini.

### C. Le Panier Flottant
- Un bouton fixe en bas à droite (`fixed bottom-6 right-6`).
- Affiche un badge rouge avec le nombre d'items.
- Animation : Petit rebond (`scale`) quand un produit est ajouté.

## 4. Performance (Images)
- Utiliser le composant `<Image />` de Next.js.
- Propriété `sizes="(max-width: 768px) 50vw, 33vw"` pour charger la bonne taille.
- Placeholder `blur` pendant le chargement.

## 5. Checkout Simplifié (Tunnel de conversion)
Page `/checkout`.
- Pas de création de compte obligatoire. "Guest Checkout".
- Formulaire :
  1. Nom complet.
  2. Téléphone (Format validé : 10 chiffres).
  3. Ville/Quartier.
  4. Paiement : Gros boutons radios (Wave / Orange Money).
- Bouton final : "COMMANDER (Paiement à la livraison ou Mobile)".
FICHIER 4 : ENVIRONNEMENT & DÉPLOIEMENT (03_env_setup.md)
Les instructions pour que ça marche.

Markdown

# 03_ENV_SETUP.MD - CONFIGURATION

## Variables d'Environnement (.env.local)

### Pour NOVA-ADMIN
```bash
NEXT_PUBLIC_SUPABASE_URL="[https://votre-ref.supabase.co](https://votre-ref.supabase.co)"
NEXT_PUBLIC_SUPABASE_ANON_KEY="votre-cle-publique"
SUPABASE_SERVICE_ROLE_KEY="votre-cle-secrete-admin-NE-JAMAIS-PARTAGER"
# Le Service Role est nécessaire pour bypasser les RLS lors des écritures admin
Pour NOVA-STORE
Bash

NEXT_PUBLIC_SUPABASE_URL="[https://votre-ref.supabase.co](https://votre-ref.supabase.co)"
NEXT_PUBLIC_SUPABASE_ANON_KEY="votre-cle-publique"
# Pas de Service Role Key ici ! Le store est en lecture seule ou insert-only.
Structure des Dossiers (Monorepo simulé ou 2 Repos)
Si deux dossiers séparés :

/admin-app

/app

/components/ui (Shadcn)

/lib/supabase.ts

/store-app

/app

/components

/lib/store.ts (Zustand)

Assets
Placer les images (logo, placeholders) dans /public/assets.

Créer un fichier robots.txt pour le Store (allow indexing) et l'Admin (disallow indexing).


---

### MODE D'EMPLOI POUR TON IA

Voici comment tu dois prompter ton IA (Copilot, Cursor, etc.) pour qu'elle utilise ces fichiers :

1.  **Copie** les 4 fichiers ci-dessus dans un dossier de ton ordinateur ou dans le chat de l'IA.
2.  **Prompt Initial :**
    > "Voici la documentation technique complète ('Master Specs') pour le projet NovaMarket. Nous allons commencer par créer la base de données. Analyse le fichier `00_shared_architecture.md` et écris-moi le script SQL complet que je dois exécuter dans Supabase pour créer les tables et les sécurités RLS."
3.  **Prompt Admin :**
    > "Maintenant, nous attaquons l'application Admin. Base-toi sur `01_admin_logic.md`. Initialise le projet Next.js et crée le hook `usePriceCalculator` exactement comme spécifié."
4.  **Prompt Store :**
    > "Passons au Store. Regarde le fichier `02_store_design.md`. Je veux que tu configures Tailwind CSS avec les couleurs exactes spécifiées et que tu crées le composant `ProductCard` avec l'animation Framer Motion décrite."

