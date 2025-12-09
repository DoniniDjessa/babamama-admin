"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sidebar } from "@/components/sidebar"
import { SidebarToggle } from "@/components/sidebar-toggle"
import { CATEGORIES, CATEGORY_KEYS, getSubcategories, type CategoryKey } from "@/lib/constants/categories"
import { usePriceCalculator } from "@/lib/hooks/usePriceCalculator"
import { useSettings } from "@/lib/hooks/useSettings"
import { ImageUpload } from "@/components/image-upload"

const productSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  category: z.enum(CATEGORY_KEYS as [CategoryKey, ...CategoryKey[]]),
  subcategory: z.string().optional(),
  sourcing_price_yuan: z.number().min(0.01, "Le prix doit être supérieur à 0"),
  weight_kg: z.number().min(0.01, "Le poids doit être supérieur à 0"),
  stock_quantity: z.number().int().min(0, "La quantité doit être positive"),
  is_active: z.boolean().default(true),
  is_new: z.boolean().default(true),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()
  const { settings, loading: settingsLoading } = useSettings()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [images, setImages] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category: "HIGH-TECH",
      is_active: true,
      is_new: true,
      stock_quantity: 0,
    },
  })

  const category = watch("category")
  const sourcingPrice = watch("sourcing_price_yuan")
  const weight = watch("weight_kg")

  // Calculate price in real-time
  const priceCalculation = usePriceCalculator(
    sourcingPrice || null,
    weight || null,
    settings
  )

  const onSubmit = async (data: ProductFormValues) => {
    if (!priceCalculation) {
      setError("Veuillez remplir le prix et le poids pour calculer le prix final")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: product, error: insertError } = await supabase
        .from("ali-products")
        .insert({
          title: data.title,
          description: data.description || null,
          category: data.category,
          subcategory: data.subcategory || null,
          sourcing_price_yuan: data.sourcing_price_yuan,
          weight_kg: data.weight_kg,
          final_price_xof: priceCalculation.finalPrice,
          is_active: data.is_active,
          is_new: data.is_new,
          stock_quantity: data.stock_quantity,
          images: images,
          created_by: user?.id,
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setIsSubmitting(false)
        return
      }

      router.push("/products")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="p-4">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarToggle onClick={() => setSidebarOpen(true)} />
              <div>
                <h1 className="text-xl font-bold font-[var(--font-fira-sans)]">
                  Nouveau Produit
                </h1>
                <p className="text-slate-600 mt-0.5 text-xs">
                  Ajoutez un nouveau produit au catalogue
                </p>
              </div>
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
                        className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                      >
                        <option value="">Sélectionner...</option>
                        {getSubcategories(category).map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

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
                  {isSubmitting ? "Création..." : "Créer le produit"}
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

