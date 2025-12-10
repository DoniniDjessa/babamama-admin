# Intégration Ventes Flash - Frontend

Ce document explique comment le frontend doit intégrer les ventes flash gérées depuis l'admin dashboard.

## Principe

Le frontend doit **prioriser les ventes flash créées depuis l'admin** (`/flash-sales`). Si aucune vente flash n'est active côté admin, le frontend peut utiliser son propre système de ventes flash.

## Logique d'Intégration

### 1. Vérifier les Ventes Flash Admin

Le frontend doit d'abord vérifier s'il existe des produits en vente flash créés depuis l'admin :

```typescript
// Récupérer les produits en vente flash depuis l'admin
const { data: adminFlashProducts } = await supabase
  .from('ali-products')
  .select('*')
  .eq('is_active', true)
  .not('flash_sale_end_at', 'is', null)
  .gt('flash_sale_end_at', new Date().toISOString()) // Seulement les ventes flash encore actives
  .order('flash_sale_end_at', { ascending: true }) // Les plus urgentes en premier
```

### 2. Décision : Admin Flash Sales vs Frontend Flash Sales

```typescript
// Pseudo-code de la logique
if (adminFlashProducts && adminFlashProducts.length > 0) {
  // Utiliser les produits de l'admin
  displayFlashSaleProducts(adminFlashProducts);
} else {
  // Utiliser le système de ventes flash du frontend
  displayFrontendFlashSaleProducts();
}
```

## Champs Importants

### Produits en Vente Flash Admin

Les produits créés depuis `/flash-sales` ont les champs suivants :

- `flash_sale_end_at` : Date et heure de fin de la vente flash (ISO timestamp)
- `flash_sale_stock` : Stock réservé pour la vente flash (optionnel, peut être `null`)
- `final_price_xof` : Prix final du produit
- `compare_at_price` : Prix barré (si promo classique également)
- `discount_percentage` : Pourcentage de réduction (calculé automatiquement)

### Vérification de Validité

Un produit est considéré comme "en vente flash active" si :

1. `is_active = true`
2. `flash_sale_end_at IS NOT NULL`
3. `flash_sale_end_at > NOW()` (la date de fin n'est pas passée)

## Exemple d'Implémentation Complète

```typescript
async function getFlashSaleProducts() {
  // 1. Vérifier les ventes flash de l'admin
  const { data: adminFlashProducts, error: adminError } = await supabase
    .from('ali-products')
    .select('*')
    .eq('is_active', true)
    .not('flash_sale_end_at', 'is', null)
    .gt('flash_sale_end_at', new Date().toISOString())
    .order('flash_sale_end_at', { ascending: true });

  if (adminError) {
    console.error('Error fetching admin flash sales:', adminError);
    // En cas d'erreur, utiliser le système frontend
    return getFrontendFlashSaleProducts();
  }

  // 2. Si des produits admin existent, les utiliser
  if (adminFlashProducts && adminFlashProducts.length > 0) {
    return {
      source: 'admin',
      products: adminFlashProducts,
      endDate: adminFlashProducts[0].flash_sale_end_at, // Date de fin la plus proche
    };
  }

  // 3. Sinon, utiliser le système frontend
  return {
    source: 'frontend',
    products: await getFrontendFlashSaleProducts(),
    endDate: null, // Géré par le frontend
  };
}
```

## Affichage des Produits Flash Sale Admin

### Compte à Rebours

Pour chaque produit, calculez le temps restant :

```typescript
function calculateTimeLeft(endDate: string) {
  const end = new Date(endDate);
  const now = new Date();
  const timeLeft = end.getTime() - now.getTime();

  if (timeLeft <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

// Utilisation
const timeLeft = calculateTimeLeft(product.flash_sale_end_at);
// Afficher : "FIN DE LA VENTE DANS : 02h 14m 33s"
```

### Barre de Progression (si `flash_sale_stock` est défini)

Si `flash_sale_stock` est défini, vous pouvez afficher une barre de progression :

```typescript
// Note: Vous devrez calculer le nombre de produits vendus depuis les commandes
// Pour l'instant, affichez simplement le stock restant
function calculateProgress(product: Product, soldQuantity: number) {
  if (!product.flash_sale_stock) {
    return null; // Pas de limite de stock
  }

  const progress = (soldQuantity / product.flash_sale_stock) * 100;
  const stockLeft = product.flash_sale_stock - soldQuantity;

  return {
    progress: Math.min(100, Math.max(0, progress)),
    stockLeft,
    soldQuantity,
  };
}
```

## Design Recommandé

### Page Flash Sale Admin

- **Header Sticky** : Bannière rouge/orange avec compte à rebours global
- **Carte Produit** : Design spécial "Flash" avec :
  - Badge "FLASH SALE" visible
  - Prix barré (si `compare_at_price` existe)
  - Prix final en gros
  - Barre de progression (si `flash_sale_stock` défini)
  - Bouton "JE PRENDS !" (plus gros, animation)
  - Compte à rebours individuel

### Exemple de Carte Produit

```tsx
<div className="flash-sale-card">
  <div className="flash-badge">FLASH SALE</div>
  <img src={product.images[0]} alt={product.title} />
  <h3>{product.title}</h3>
  
  {/* Prix */}
  <div className="price-section">
    {product.compare_at_price && (
      <span className="old-price">{product.compare_at_price.toLocaleString()} FCFA</span>
    )}
    <span className="final-price">{product.final_price_xof.toLocaleString()} FCFA</span>
    {product.discount_percentage > 0 && (
      <span className="discount">-{product.discount_percentage}%</span>
    )}
  </div>

  {/* Barre de progression */}
  {product.flash_sale_stock && progress && (
    <div className="progress-section">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress.progress}%` }}
        />
      </div>
      <p className="progress-text">
        Vite ! {progress.soldQuantity} / {product.flash_sale_stock} vendus
      </p>
    </div>
  )}

  {/* Compte à rebours */}
  <div className="countdown">
    FIN DANS : {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
  </div>

  {/* Bouton */}
  <button className="flash-buy-button">JE PRENDS !</button>
</div>
```

## Mise à Jour en Temps Réel

Pour un meilleur UX, mettez à jour le compte à rebours toutes les secondes :

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // Recalculer le temps restant
    setTimeLeft(calculateTimeLeft(product.flash_sale_end_at));
    
    // Vérifier si la vente flash est terminée
    const now = new Date();
    const end = new Date(product.flash_sale_end_at);
    if (now >= end) {
      // La vente flash est terminée, retirer le produit ou afficher un message
      handleFlashSaleEnded(product.id);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [product.flash_sale_end_at]);
```

## Gestion des Ventes Flash Terminées

Quand une vente flash se termine (`flash_sale_end_at` est passée) :

1. **Retirer automatiquement** le produit de la page Flash Sale
2. **Conserver le produit** dans le catalogue normal (s'il est toujours `is_active = true`)
3. **Afficher le prix normal** (ou promo classique si `compare_at_price` existe)

```typescript
// Filtrer les produits flash sale actifs
const activeFlashProducts = products.filter(product => {
  if (!product.flash_sale_end_at) return false;
  const endDate = new Date(product.flash_sale_end_at);
  return endDate > new Date();
});
```

## Notes Importantes

1. **Priorité Admin** : Toujours vérifier les ventes flash admin en premier
2. **Fallback Frontend** : Si aucune vente flash admin n'est active, utiliser le système frontend
3. **Validation Temporelle** : Toujours vérifier que `flash_sale_end_at > NOW()`
4. **Stock Flash** : Si `flash_sale_stock` est défini, respecter cette limite
5. **Prix** : Utiliser `final_price_xof` comme prix de vente, pas `compare_at_price`
6. **Automation** : Les ventes flash admin se terminent automatiquement à la date/heure définie

## Exemple de Requête Complète

```typescript
// Récupérer les produits flash sale actifs de l'admin
const { data: flashProducts, error } = await supabase
  .from('ali-products')
  .select(`
    id,
    title,
    images,
    final_price_xof,
    compare_at_price,
    discount_percentage,
    flash_sale_end_at,
    flash_sale_stock,
    stock_quantity,
    min_quantity_to_sell
  `)
  .eq('is_active', true)
  .not('flash_sale_end_at', 'is', null)
  .gt('flash_sale_end_at', new Date().toISOString())
  .order('flash_sale_end_at', { ascending: true });

if (error) {
  console.error('Error:', error);
  // Utiliser le système frontend en cas d'erreur
}

if (flashProducts && flashProducts.length > 0) {
  // Afficher les produits flash sale de l'admin
  return flashProducts;
} else {
  // Utiliser le système de ventes flash du frontend
  return getFrontendFlashSaleProducts();
}
```

## Support

Pour toute question sur l'intégration des ventes flash, contactez l'équipe backend/admin.

