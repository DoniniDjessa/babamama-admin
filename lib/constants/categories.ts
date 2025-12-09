export const CATEGORIES = {
  "HIGH-TECH": {
    name: "📱 HIGH-TECH & GADGETS",
    subcategories: [
      "Audio & Son",
      "Wearables (Objets connectés)",
      "Accessoires Mobiles",
      "Création de Contenu (Pour les influenceurs)",
    ],
  },
  "MAISON": {
    name: "🏠 MAISON \"SMART\" & DÉCO",
    subcategories: [
      "Éclairage d'Ambiance",
      "Cuisine Virale (TikTok Kitchen)",
      "Organisation & Rangement",
    ],
  },
  "BEAUTE": {
    name: "✨ BEAUTÉ & BIEN-ÊTRE",
    subcategories: [
      "Beauty Tech (Appareils)",
      "Onglerie & Cils (Le consommable)",
      "Coiffure",
    ],
  },
  "MODE": {
    name: "👔 MODE & ACCESSOIRES",
    subcategories: [
      "Bijouterie (Homme/Femme)",
      "Maroquinerie \"Light\"",
      "Lunettes",
    ],
  },
  "AUTO": {
    name: "🚗 AUTO & VOYAGE",
    subcategories: [
      "Gadgets Auto",
    ],
  },
  "MYSTERY": {
    name: "🎁 MYSTERY & PROMO",
    subcategories: [
      "Boîtes Mystères",
      "Ventes Flash 1000F",
    ],
  },
} as const

export type CategoryKey = keyof typeof CATEGORIES

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[]

export function getSubcategories(category: CategoryKey): string[] {
  return CATEGORIES[category]?.subcategories || []
}

