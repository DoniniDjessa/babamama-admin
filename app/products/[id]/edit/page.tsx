"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CATEGORIES, CATEGORY_KEYS, getSubcategories, getSubSubCategories, type CategoryKey } from "@/lib/constants/categories"
import { usePriceCalculator } from "@/lib/hooks/usePriceCalculator"
import { useSettings } from "@/lib/hooks/useSettings"
import { ImageUpload } from "@/components/image-upload"

const productSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  category: z.enum(CATEGORY_KEYS as [CategoryKey, ...CategoryKey[]]),
  subcategory: z.string().optional(),
  subsubcategory: z.string().optional(),
  sourcing_price_yuan: z.number().min(0.01, "Le prix doit être supérieur à 0"),
  weight_kg: z.number().min(0.01, "Le poids doit être supérieur à 0"),
  stock_quantity: z.number().int().min(0, "La quantité doit être positive"),
  min_quantity_to_sell: z.number().int().min(1, "La quantité minimale doit être au moins 1"),
  compare_at_price: z.number().int().min(0).optional(), // Prix barré (pour promo classique)
  rating: z.number().min(0).max(5).optional(),
  specs: z.string().optional(), // Comma-separated specs string
  is_active: z.boolean(),
  is_new: z.boolean(),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const supabase = createClient()
  const { settings, loading: settingsLoading } = useSettings()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  })

  const category = watch("category")
  const subcategory = watch("subcategory")
  const sourcingPrice = watch("sourcing_price_yuan")
  const weight = watch("weight_kg")
  const comparePrice = watch("compare_at_price")

  // Calculate price in real-time
  const priceCalculation = usePriceCalculator(
    sourcingPrice || null,
    weight || null,
    settings
  )

  // Note: discount_percentage is calculated automatically by the database

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("ali-products")
          .select("*")
          .eq("id", productId)
          .single()

        if (fetchError) {
          setError("Produit non trouvé")
          setLoading(false)
          return
        }

        if (data) {
          setValue("title", data.title)
          setValue("description", data.description || "")
          setValue("category", data.category as CategoryKey)
          setValue("subcategory", data.subcategory || "")
          setValue("subsubcategory", data.subsubcategory || "")
          setValue("sourcing_price_yuan", data.sourcing_price_yuan)
          setValue("weight_kg", data.weight_kg)
          setValue("stock_quantity", data.stock_quantity)
          setValue("min_quantity_to_sell", data.min_quantity_to_sell || 1)
          setValue("compare_at_price", data.compare_at_price || undefined)
          setValue("rating", data.rating || 0)
          setValue("specs", Array.isArray(data.specs) ? data.specs.join(", ") : (data.specs || ""))
          setValue("is_active", data.is_active)
          setValue("is_new", data.is_new)
          setImages(data.images || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId, supabase, setValue])

  const onSubmit = async (data: ProductFormValues) => {
    if (!priceCalculation) {
      setError("Veuillez remplir le prix et le poids pour calculer le prix final")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from("ali-products")
        .update({
          title: data.title,
          description: data.description || null,
          category: data.category,
          subcategory: data.subcategory || null,
          subsubcategory: data.subsubcategory || null,
          sourcing_price_yuan: data.sourcing_price_yuan,
          weight_kg: data.weight_kg,
          final_price_xof: priceCalculation.finalPrice,
          is_active: data.is_active,
          is_new: data.is_new,
          stock_quantity: data.stock_quantity,
          min_quantity_to_sell: data.min_quantity_to_sell,
          compare_at_price: data.compare_at_price || null,
          rating: data.rating || 0,
          specs: data.specs ? data.specs.split(",").map((s) => s.trim()).filter((s) => s.length > 0) : [],
          images: images,
        })
        .eq("id", productId)

      if (updateError) {
        setError(updateError.message)
        setIsSubmitting(false)
        return
      }

      router.push("/products")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-xs text-slate-600">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-[var(--font-fira-sans)]">
                Modifier le Produit
              </h1>
              <p className="text-slate-600 mt-0.5 text-xs">
                Modifiez les informations du produit
              </p>
            </div>
            <Link href="/products">
              <Button variant="outline" size="sm">Annuler</Button>
            </Link>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Informations Générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      {...register("title")}
                      placeholder="Ex: Écouteurs sans fil AirPods Pro"
                      className={errors.title ? "border-red-500" : ""}
                    />
                    {errors.title && (
                      <p className="text-xs text-red-500">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      {...register("description")}
                      rows={4}
                      className="flex w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                      placeholder="Description du produit..."
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie *</Label>
                      <select
                        id="category"
                        {...register("category")}
                        onChange={(e) => {
                          setValue("category", e.target.value as CategoryKey)
                          setValue("subcategory", "") // Reset subcategory when category changes
                          setValue("subsubcategory", "") // Reset subsubcategory when category changes
                        }}
                        className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                      >
                        {CATEGORY_KEYS.map((key) => (
                          <option key={key} value={key}>
                            {CATEGORIES[key].name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subcategory">Sous-catégorie</Label>
                      <select
                        id="subcategory"
                        {...register("subcategory")}
                        onChange={(e) => {
                          setValue("subcategory", e.target.value)
                          setValue("subsubcategory", "") // Reset subsubcategory when subcategory changes
                        }}
                        className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                      >
                        <option value="">Sélectionner...</option>
                        {getSubcategories(category).map((sub) => (
                          <option key={sub.name} value={sub.name}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {subcategory && getSubSubCategories(category, subcategory).length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="subsubcategory">Sous-sous-catégorie</Label>
                        <select
                          id="subsubcategory"
                          {...register("subsubcategory")}
                          className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                        >
                          <option value="">Sélectionner...</option>
                          {getSubSubCategories(category, subcategory).map((subSub) => (
                            <optgroup key={subSub.name} label={subSub.name}>
                              {subSub.items.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sourcing_price_yuan">Prix d'achat (Yuan) *</Label>
                      <Input
                        id="sourcing_price_yuan"
                        type="number"
                        step="0.01"
                        {...register("sourcing_price_yuan", { valueAsNumber: true })}
                        className={errors.sourcing_price_yuan ? "border-red-500" : ""}
                      />
                      {errors.sourcing_price_yuan && (
                        <p className="text-xs text-red-500">
                          {errors.sourcing_price_yuan.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight_kg">Poids (KG) *</Label>
                      <Input
                        id="weight_kg"
                        type="number"
                        step="0.01"
                        {...register("weight_kg", { valueAsNumber: true })}
                        className={errors.weight_kg ? "border-red-500" : ""}
                      />
                      {errors.weight_kg && (
                        <p className="text-xs text-red-500">{errors.weight_kg.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Quantité en stock</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      {...register("stock_quantity", { valueAsNumber: true })}
                      className={errors.stock_quantity ? "border-red-500" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_quantity_to_sell">Quantité minimale à vendre</Label>
                    <Input
                      id="min_quantity_to_sell"
                      type="number"
                      {...register("min_quantity_to_sell", { valueAsNumber: true })}
                      className={errors.min_quantity_to_sell ? "border-red-500" : ""}
                      placeholder="1"
                    />
                    {errors.min_quantity_to_sell && (
                      <p className="text-xs text-red-500">{errors.min_quantity_to_sell.message}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Quantité minimale que le client doit commander
                    </p>
                  </div>

                  {/* Promo Section (Prix barré) */}
                  <div className="space-y-4 pt-2 border-t border-slate-200">
                    <h3 className="text-xs font-semibold text-slate-700">
                      Promotion Classique
                    </h3>
                    <p className="text-xs text-slate-500">
                      Entrez un prix barré supérieur au prix final pour créer une promo automatique.
                      Le pourcentage de réduction sera calculé automatiquement.
                    </p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="compare_at_price">Prix Barré (FCFA) - Optionnel</Label>
                      <Input
                        id="compare_at_price"
                        type="number"
                        {...register("compare_at_price", { valueAsNumber: true })}
                        className={errors.compare_at_price ? "border-red-500" : ""}
                        placeholder="Ex: 20000 (doit être supérieur au prix final)"
                      />
                      {errors.compare_at_price && (
                        <p className="text-xs text-red-500">{errors.compare_at_price.message}</p>
                      )}
                      {comparePrice && priceCalculation?.finalPrice && comparePrice <= priceCalculation.finalPrice && (
                        <p className="text-xs text-amber-600">
                          ⚠️ Le prix barré doit être supérieur au prix final ({priceCalculation.finalPrice.toLocaleString()} FCFA)
                        </p>
                      )}
                      {comparePrice && priceCalculation?.finalPrice && comparePrice > priceCalculation.finalPrice && (
                        <p className="text-xs text-green-600">
                          ✓ Réduction de {Math.round(((comparePrice - priceCalculation.finalPrice) / comparePrice) * 100)}% calculée automatiquement
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rating Section */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <Label htmlFor="rating">Note du produit (0-5 étoiles)</Label>
                    <Input
                      id="rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      {...register("rating", { valueAsNumber: true })}
                      className={errors.rating ? "border-red-500" : ""}
                      placeholder="0"
                    />
                    {errors.rating && (
                      <p className="text-xs text-red-500">{errors.rating.message}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Note sur 5 étoiles (ex: 4.5 pour 4 étoiles et demie)
                    </p>
                  </div>

                  {/* Specs Section */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <Label htmlFor="specs">Spécifications</Label>
                    <textarea
                      id="specs"
                      {...register("specs")}
                      rows={3}
                      className="flex w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                      placeholder="Séparez les spécifications par des virgules (ex: Écran 6.1 pouces, 128GB, Bluetooth 5.0)"
                    />
                    <p className="text-xs text-slate-500">
                      Séparez chaque spécification par une virgule (,)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <ImageUpload
                      images={images}
                      onImagesChange={setImages}
                      maxImages={5}
                    />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register("is_active")}
                        className="w-3 h-3"
                      />
                      <span className="text-xs">Actif</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register("is_new")}
                        className="w-3 h-3"
                      />
                      <span className="text-xs">Nouveau</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-xs text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting || settingsLoading}>
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Link href="/products">
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </Link>
              </div>
            </div>

            {/* Price Calculator Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-sm">Calcul du Prix</CardTitle>
                  <CardDescription className="text-xs">
                    Simulation en temps réel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {settingsLoading ? (
                    <p className="text-xs text-slate-500">Chargement des paramètres...</p>
                  ) : priceCalculation ? (
                    <>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Prix Chine:</span>
                          <span>{priceCalculation.details.purchaseCost.toFixed(0)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Transport:</span>
                          <span>{priceCalculation.details.transportCost.toFixed(0)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Coût débarqué:</span>
                          <span>{priceCalculation.details.landedCost.toFixed(0)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Douane ({settings?.customs_percent}%):</span>
                          <span>{priceCalculation.details.customsAmount.toFixed(0)} FCFA</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Marge ({settings?.margin_percent}%):</span>
                          <span>{priceCalculation.details.marginAmount.toFixed(0)} FCFA</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">PRIX FINAL:</span>
                            <span className="text-base font-bold text-green-600">
                              {priceCalculation.finalPrice.toLocaleString()} FCFA
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Remplissez le prix et le poids pour voir le calcul
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

