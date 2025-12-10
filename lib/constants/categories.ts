export type SubSubCategory = {
  name: string
  items: string[]
}

export type SubCategory = {
  name: string
  subSubCategories?: SubSubCategory[]
}

export type Category = {
  name: string
  subcategories: SubCategory[]
}

export const CATEGORIES: Record<string, Category> = {
  "HIGH-TECH": {
    name: "📱 HIGH-TECH & GADGETS",
    subcategories: [
      {
        name: "Audio & Son",
        subSubCategories: [
          {
            name: "Écouteurs",
            items: ["Écouteurs sans fil (Type AirPods)", "Écouteurs avec fil", "Écouteurs gaming"]
          },
          {
            name: "Enceintes",
            items: ["Mini Enceintes Bluetooth waterproof", "Enceintes portables", "Enceintes avec lumière"]
          },
          {
            name: "Casques",
            items: ["Casques à réduction de bruit (Style Sony/Apple Max)", "Casques gaming", "Casques sport"]
          }
        ]
      },
      {
        name: "Wearables (Objets connectés)",
        subSubCategories: [
          {
            name: "Montres",
            items: ["Smartwatches (Style Ultra avec bracelets interchangeables)", "Montres fitness", "Montres pour enfants"]
          },
          {
            name: "Autres",
            items: ["Bagues connectées (Smart rings)", "Bracelets connectés", "Podomètres"]
          }
        ]
      },
      {
        name: "Accessoires Mobiles",
        subSubCategories: [
          {
            name: "Chargeurs",
            items: ["Batteries MagSafe (Magnétiques)", "Chargeurs GaN (Charge ultra-rapide)", "Chargeurs sans fil"]
          },
          {
            name: "Protection",
            items: ["Coques de téléphone \"Hype\" (Matériaux premium, designs 3D)", "Protecteurs d'écran", "Étuis"]
          },
          {
            name: "Câbles",
            items: ["Câbles incassables", "Câbles USB-C", "Câbles Lightning"]
          }
        ]
      },
      {
        name: "Création de Contenu (Pour les influenceurs)",
        subSubCategories: [
          {
            name: "Stabilisation",
            items: ["Stabilisateurs (Gimbals) pour smartphone", "Trépieds", "Pieds de table"]
          },
          {
            name: "Audio",
            items: ["Micros cravate sans fil (Pour TikTok/Reels)", "Micros directionnels", "Micros USB"]
          },
          {
            name: "Éclairage",
            items: ["Ring lights portables", "Lumières LED", "Softbox"]
          }
        ]
      },
    ],
  },
  "MAISON": {
    name: "🏠 MAISON \"SMART\" & DÉCO",
    subcategories: [
      {
        name: "Éclairage d'Ambiance",
        subSubCategories: [
          {
            name: "LED",
            items: ["Rubans LED RGB connectés (Contrôle via App)", "Guirlandes LED", "Strips LED"]
          },
          {
            name: "Lampes",
            items: ["Lampes de coucher de soleil (Sunset Lamps)", "Lampes de sel", "Lampes de bureau"]
          },
          {
            name: "Projecteurs",
            items: ["Veilleuses \"Galaxie\" (Projecteurs d'étoiles)", "Projecteurs de motifs", "Projecteurs de lumière"]
          }
        ]
      },
      {
        name: "Cuisine Virale (TikTok Kitchen)",
        subSubCategories: [
          {
            name: "Électroménager",
            items: ["Mini Blenders portables (Pour les jus au bureau)", "Hacheurs électriques sans fil", "Distributeurs de savon automatiques"]
          },
          {
            name: "Ustensiles",
            items: ["Gadgets de découpe légumes multifonctions", "Coupe-fruits", "Éplucheurs"]
          }
        ]
      },
      {
        name: "Organisation & Rangement",
        subSubCategories: [
          {
            name: "Rangement",
            items: ["Boîtes de rangement maquillage (Acrylique transparent)", "Organisateurs de câbles et bureau", "Paniers de rangement"]
          }
        ]
      },
    ],
  },
  "BEAUTE": {
    name: "✨ BEAUTÉ & BIEN-ÊTRE",
    subcategories: [
      {
        name: "Beauty Tech (Appareils)",
        subSubCategories: [
          {
            name: "Nettoyage",
            items: ["Aspirateurs points noirs (Blackhead removers)", "Brosses nettoyantes visage soniques", "Appareils de nettoyage facial"]
          },
          {
            name: "Thérapie",
            items: ["Masques LED thérapie", "Appareils de massage facial", "Rollers de jade"]
          }
        ]
      },
      {
        name: "Onglerie & Cils (Le consommable)",
        subSubCategories: [
          {
            name: "Ongles",
            items: ["Kits Faux Ongles (Press-on nails de luxe)", "Lampes UV portables", "Vernis à ongles"]
          },
          {
            name: "Cils",
            items: ["Faux cils magnétiques", "Extensions de cils", "Cils à coller"]
          }
        ]
      },
      {
        name: "Coiffure",
        subSubCategories: [
          {
            name: "Lissage",
            items: ["Brosses chauffantes lissantes", "Fers à lisser", "Lisseurs"]
          },
          {
            name: "Boucles",
            items: ["Fers à boucler automatiques sans fil", "Bigoudis chauffants", "Wands"]
          }
        ]
      },
    ],
  },
  "MODE": {
    name: "👔 MODE & ACCESSOIRES",
    subcategories: [
      {
        name: "Bijouterie (Homme/Femme)",
        subSubCategories: [
          {
            name: "Chaînes",
            items: ["Chaînes et bracelets \"Iced Out\" (Zirconium)", "Chaînes en acier", "Chaînes dorées"]
          },
          {
            name: "Montres",
            items: ["Montres style luxe (Hommage watches)", "Montres sport", "Montres classiques"]
          },
          {
            name: "Parures",
            items: ["Parures acier inoxydable (Ne rouille pas)", "Parures dorées", "Parures argentées"]
          }
        ]
      },
      {
        name: "Maroquinerie \"Light\"",
        subSubCategories: [
          {
            name: "Sacs",
            items: ["Sacs banane (Crossbody bags) tendances", "Sacs à dos", "Sacs de voyage"]
          },
          {
            name: "Portefeuilles",
            items: ["Porte-cartes minimalistes (Anti-RFID)", "Portefeuilles slim", "Porte-monnaie"]
          }
        ]
      },
      {
        name: "Lunettes",
        subSubCategories: [
          {
            name: "Soleil",
            items: ["Lunettes de soleil \"Fashion\" (Cadres épais, Y2K)", "Lunettes de soleil classiques", "Lunettes de soleil sport"]
          },
          {
            name: "Vue",
            items: ["Lunettes anti-lumière bleue (Pour le bureau)", "Lunettes de lecture", "Lunettes de protection"]
          }
        ]
      },
    ],
  },
  "AUTO": {
    name: "🚗 AUTO & VOYAGE",
    subcategories: [
      {
        name: "Gadgets Auto",
        subSubCategories: [
          {
            name: "Nettoyage",
            items: ["Aspirateurs de voiture sans fil puissants", "Kits de nettoyage", "Chiffons microfibres"]
          },
          {
            name: "Support",
            items: ["Supports téléphone magnétiques (Design minimaliste)", "Ventouses", "Grilles d'aération"]
          },
          {
            name: "Audio",
            items: ["Transmetteurs FM Bluetooth (Pour les vieilles voitures)", "Adaptateurs auxiliaires", "Hauts-parleurs"]
          },
          {
            name: "Éclairage",
            items: ["LEDs d'ambiance intérieur voiture", "Strips LED", "Lumières de portière"]
          }
        ]
      },
    ],
  },
  "MYSTERY": {
    name: "🎁 MYSTERY & PROMO",
    subcategories: [
      {
        name: "Boîtes Mystères",
        subSubCategories: [
          {
            name: "Tech",
            items: ["Box Tech (Peut contenir : Écouteurs, Câble ou Montre)", "Box Gaming", "Box Accessoires"]
          },
          {
            name: "Beauté",
            items: ["Box Beauté", "Box Maquillage", "Box Soins"]
          }
        ]
      },
      {
        name: "Ventes Flash 1000F",
        subSubCategories: [
          {
            name: "Petits gadgets",
            items: ["Porte-clés", "Câbles", "Stickers", "Accessoires"]
          }
        ]
      },
    ],
  },
} as const

export type CategoryKey = keyof typeof CATEGORIES

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[]

export function getSubcategories(category: CategoryKey): SubCategory[] {
  return CATEGORIES[category]?.subcategories || []
}

export function getSubSubCategories(category: CategoryKey, subcategory: string): SubSubCategory[] {
  const subcat = CATEGORIES[category]?.subcategories.find(s => s.name === subcategory)
  return subcat?.subSubCategories || []
}

export function getAllSubSubCategoryItems(category: CategoryKey, subcategory: string): string[] {
  const subSubCats = getSubSubCategories(category, subcategory)
  return subSubCats.flatMap(subSub => subSub.items)
}
