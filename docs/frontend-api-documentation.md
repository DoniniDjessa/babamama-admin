# Documentation API Frontend - BabaMama Admin

Ce document décrit les tables et endpoints disponibles pour le frontend (site web client).

## Tables Disponibles

### 1. Produits (`ali-products`)

Table principale pour les produits disponibles à la vente.

#### Champs disponibles :

```typescript
{
  id: string (UUID)
  title: string // Titre du produit
  description: string | null // Description HTML/Markdown
  category: string // Ex: 'HIGH-TECH', 'MAISON', 'BEAUTE', 'MODE', 'AUTO', 'MYSTERY'
  subcategory: string | null // Sous-catégorie
  subsubcategory: string | null // Sous-sous-catégorie
  images: string[] // URLs des images (Supabase Storage)
  final_price_xof: number // Prix final affiché au client (en FCFA)
  compare_at_price: number | null // Prix barré (pour promo classique)
  discount_percentage: number // Pourcentage de réduction calculé automatiquement (0 si pas de promo)
  flash_sale_end_at: string | null // Date de fin de la vente flash (ISO timestamp, NULL si pas de flash sale)
  flash_sale_stock: number | null // Stock réservé pour la vente flash (optionnel)
  rating: number // Note sur 5 étoiles (0-5)
  specs: string[] // Tableau de spécifications
  is_active: boolean // Si false, le produit n'est pas visible
  is_new: boolean // Badge "Nouveau"
  stock_quantity: number // Quantité en stock
  min_quantity_to_sell: number // Quantité minimale à commander (défaut: 1)
  created_at: string (ISO timestamp)
  updated_at: string (ISO timestamp)
}
```

#### Politique RLS :
- **Lecture publique** : Seuls les produits avec `is_active = true` sont accessibles
- **Écriture** : Réservée aux admins authentifiés

#### Exemple de requête :

```typescript
const { data: products } = await supabase
  .from('ali-products')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false })
```

#### Notes importantes :
- `final_price_xof` : Prix calculé automatiquement par l'algorithme (prix d'achat + transport + douane + marge)
- `compare_at_price` : Prix barré (si rempli et > `final_price_xof`, le produit est en promo)
- `discount_percentage` : Calculé automatiquement : `((compare_at_price - final_price_xof) / compare_at_price) * 100` (0 si pas de promo)
- `flash_sale_end_at` : Si non NULL et dans le futur, le produit est en vente flash
- `flash_sale_stock` : Stock réservé pour la vente flash (optionnel, peut être NULL)
- `specs` : Tableau de chaînes, séparées par virgules dans le formulaire admin
- `rating` : Note sur 5 étoiles (ex: 4.5 pour 4 étoiles et demie)

---

### 2. Commandes (`ali-orders`)

Table pour les commandes des clients.

#### Champs disponibles :

```typescript
{
  id: string (UUID)
  customer_name: string // Nom du client
  customer_phone: string // Téléphone du client
  delivery_address: string | null // Adresse de livraison
  items: any[] // JSONB : [{ product_id, title, price, qty }]
  total_amount_xof: number // Montant total en FCFA
  payment_method: string // 'wave', 'om', 'cash', 'pending'
  status: string // 'pending', 'confirmed', 'shipping', 'delivered', 'cancelled'
  assigned_vehicle_id: string | null // ID du véhicule assigné
  assigned_employee_id: string | null // ID de l'employé assigné
  created_at: string (ISO timestamp)
}
```

#### Politique RLS :
- **Création** : Publique (les clients peuvent créer des commandes)
- **Lecture/Modification** : Réservée aux admins authentifiés

#### Exemple de création de commande :

```typescript
const { data: order } = await supabase
  .from('ali-orders')
  .insert({
    customer_name: 'John Doe',
    customer_phone: '+225 07 12 34 56 78',
    delivery_address: 'Cocody, Abidjan',
    items: [
      { product_id: 'uuid-123', title: 'Écouteurs Bluetooth', price: 15000, qty: 2 }
    ],
    total_amount_xof: 30000,
    payment_method: 'wave',
    status: 'pending'
  })
  .select()
  .single()
```

---

### 3. Clients (`ali-customers`)

Table pour les clients du site web (utilisateurs frontend).

#### Champs disponibles :

```typescript
{
  id: string (UUID) // Référence à auth.users(id)
  full_name: string
  email: string | null
  phone: string | null
  created_at: string (ISO timestamp)
  updated_at: string (ISO timestamp)
}
```

#### Politique RLS :
- **Lecture/Écriture** : Réservée aux admins authentifiés
- Les clients sont créés automatiquement lors de l'inscription via Supabase Auth

---

### 4. Paramètres (`ali-settings`)

Table singleton pour les paramètres globaux de calcul des prix.

#### Champs disponibles :

```typescript
{
  id: number
  exchange_rate_yuan_xof: number // Taux de change 1 Yuan = X FCFA
  shipping_price_per_kg: number // Prix du transport par kg (FCFA)
  customs_percentage: number // Pourcentage de douane (ex: 10 pour 10%)
  margin_percentage: number // Pourcentage de marge (ex: 25 pour 25%)
  updated_at: string (ISO timestamp)
}
```

#### Politique RLS :
- **Lecture** : Publique (pour calculer les prix côté frontend si nécessaire)
- **Modification** : Réservée aux admins authentifiés

#### Exemple de requête :

```typescript
const { data: settings } = await supabase
  .from('ali-settings')
  .select('*')
  .single()
```

---

## Pages Spéciales

### Page "/promos" (Les Bonnes Affaires)

**Logique** : Affiche tous les produits où `discount_percentage > 0` (promo classique).

**Tri** : Par défaut "Plus forte réduction d'abord" (les -50% en haut).

**Design** : Grille classique, mais avec le prix barré bien visible.

**Requête** :

```typescript
const { data: promoProducts } = await supabase
  .from('ali-products')
  .select('*')
  .eq('is_active', true)
  .gt('discount_percentage', 0)
  .order('discount_percentage', { ascending: false })
```

**Note** : Les produits en promo classique ont `compare_at_price > final_price_xof` et `discount_percentage` calculé automatiquement.

---

### Page "/flash-sale" (L'Urgence Maximale)

**Logique** : Affiche tous les produits où `flash_sale_end_at` est dans le futur (vente flash active).

**Design** : Page unique, sombre et agressive (dans le bon sens).

**A. Le Header "Compte à Rebours"** : Une bannière collée en haut (Sticky) :
- Fond : Rouge Vif ou Dégradé Orange
- Contenu : "FIN DE LA VENTE DANS : 02h 14m 33s" (Compteur temps réel)

**B. La Carte Produit "Flash"** (Spéciale) :
- Différente de la carte standard
- Barre de progression : "Vite ! 80% vendus" (si `flash_sale_stock` est défini)
- Visuel : Une petite barre rouge sous le prix qui se remplit
- Bouton : "JE PRENDS !" (Plus gros, qui vibre légèrement)

**Requête** :

```typescript
const { data: flashProducts } = await supabase
  .from('ali-products')
  .select('*')
  .eq('is_active', true)
  .not('flash_sale_end_at', 'is', null)
  .gt('flash_sale_end_at', new Date().toISOString()) // Seulement les ventes flash encore actives
  .order('flash_sale_end_at', { ascending: true }) // Les plus urgentes en premier
```

**Note** : Vérifiez que `flash_sale_end_at` n'est pas passée pour afficher uniquement les ventes flash actives.

**Calcul du temps restant** :

```typescript
const endDate = new Date(product.flash_sale_end_at)
const now = new Date()
const timeLeft = endDate.getTime() - now.getTime()

const hours = Math.floor(timeLeft / (1000 * 60 * 60))
const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
```

**Calcul de la progression** (si `flash_sale_stock` est défini) :

```typescript
// Vous devrez tracker les ventes pour calculer le pourcentage vendu
// Pour l'instant, affichez simplement le stock restant
const stockLeft = product.flash_sale_stock - soldQuantity // soldQuantity à calculer depuis les commandes
const progress = (soldQuantity / product.flash_sale_stock) * 100
```

---

## Structure des Catégories

Les catégories sont organisées en 3 niveaux :

1. **Catégorie** : Ex: `HIGH-TECH`, `MAISON`, `BEAUTE`, `MODE`, `AUTO`, `MYSTERY`
2. **Sous-catégorie** : Ex: `Audio & Son`, `Éclairage d'Ambiance`
3. **Sous-sous-catégorie** : Ex: `Écouteurs sans fil`, `Mini Enceintes Bluetooth`

Les catégories sont définies dans le code admin et doivent être synchronisées avec le frontend.

---

## Algorithme de Calcul des Prix

Le prix final (`final_price_xof`) est calculé automatiquement par l'admin avec cette formule :

1. **Prix d'achat en CFA** = `sourcing_price_yuan * exchange_rate_yuan_xof`
2. **Coût transport** = `weight_kg * shipping_price_per_kg`
3. **Coût débarqué** = Prix d'achat + Coût transport
4. **Douane** = Coût débarqué * (`customs_percentage / 100`)
5. **Avec douane** = Coût débarqué + Douane
6. **Marge** = Avec douane * (`margin_percentage / 100`)
7. **Prix brut** = Avec douane + Marge
8. **Prix final** = Arrondi au 50 ou 100 supérieur (ex: 14320 → 14350)

**Note** : Le frontend n'a pas besoin de calculer les prix, ils sont déjà calculés dans `final_price_xof`.

---

## Gestion des Images

- **Bucket Supabase** : `alibucket`
- **Dossier** : `products/`
- **Format** : Images converties automatiquement en WebP
- **Accès** : URLs publiques disponibles via `getPublicUrl()`

Exemple d'URL d'image :
```
https://[project].supabase.co/storage/v1/object/public/alibucket/products/[filename].webp
```

---

## Statuts de Commande

- `pending` : En attente
- `confirmed` : Confirmée
- `shipping` : En livraison
- `delivered` : Livrée
- `cancelled` : Annulée

---

## Méthodes de Paiement

- `wave` : Wave
- `om` : Orange Money
- `cash` : Espèces
- `pending` : En attente de paiement

---

## Notes Importantes

1. **RLS activé** : Toutes les tables ont Row Level Security activé
2. **Préfixe `ali-`** : Toutes les tables commencent par `ali-` pour éviter les conflits
3. **Prix** : Utilisez toujours `final_price_xof` pour afficher le prix, pas `sourcing_price_yuan`
4. **Produits actifs** : Seuls les produits avec `is_active = true` doivent être affichés
5. **Stock** : Vérifiez `stock_quantity` avant d'autoriser l'ajout au panier
6. **Quantité minimale** : Respectez `min_quantity_to_sell` lors de l'ajout au panier
7. **Promo Classique** : Si `compare_at_price > final_price_xof`, le produit est en promo (affichez le prix barré)
8. **Vente Flash** : Si `flash_sale_end_at` est dans le futur, le produit est en vente flash (affichez le compte à rebours)
9. **Automation** : Si `flash_sale_end_at` est passée, le produit ne s'affiche plus dans `/flash-sale` mais reste en vente normale (ou en promo simple si applicable)

---

## Exemples de Requêtes Frontend

### Récupérer tous les produits actifs d'une catégorie

```typescript
const { data: products } = await supabase
  .from('ali-products')
  .select('*')
  .eq('is_active', true)
  .eq('category', 'HIGH-TECH')
  .order('created_at', { ascending: false })
```

### Récupérer un produit spécifique

```typescript
const { data: product } = await supabase
  .from('ali-products')
  .select('*')
  .eq('id', productId)
  .eq('is_active', true)
  .single()
```

### Créer une commande

```typescript
const { data: order, error } = await supabase
  .from('ali-orders')
  .insert({
    customer_name: formData.name,
    customer_phone: formData.phone,
    delivery_address: formData.address,
    items: cartItems.map(item => ({
      product_id: item.id,
      title: item.title,
      price: item.final_price_xof,
      qty: item.quantity
    })),
    total_amount_xof: total,
    payment_method: 'wave',
    status: 'pending'
  })
  .select()
  .single()
```

### Filtrer les produits par plusieurs critères

```typescript
// Produits en promotion avec réduction
const { data: products } = await supabase
  .from('ali-products')
  .select('*')
  .eq('is_active', true)
  .gt('discount_percentage', 0)
  .order('discount_percentage', { ascending: false })
```

---

## Support

Pour toute question sur l'API, contactez l'équipe backend/admin.
