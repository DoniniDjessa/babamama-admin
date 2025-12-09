"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sidebar } from "@/components/sidebar"
import { SidebarToggle } from "@/components/sidebar-toggle"

const settingsSchema = z.object({
  exchange_rate_yuan_xof: z.number().min(1, "Le taux doit être supérieur à 0"),
  shipping_price_per_kg: z.number().min(1, "Le prix doit être supérieur à 0"),
  customs_percentage: z.number().min(0).max(100, "Le pourcentage doit être entre 0 et 100"),
  margin_percentage: z.number().min(0).max(100, "Le pourcentage doit être entre 0 et 100"),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("settings")
          .select("*")
          .single()

        if (fetchError) {
          console.error("Error fetching settings:", fetchError)
          // Use default values if settings don't exist
          setValue("exchange_rate_yuan_xof", 90.0)
          setValue("shipping_price_per_kg", 9000)
          setValue("customs_percentage", 10)
          setValue("margin_percentage", 25)
        } else if (data) {
          setValue("exchange_rate_yuan_xof", data.exchange_rate_yuan_xof)
          setValue("shipping_price_per_kg", data.shipping_price_per_kg)
          setValue("customs_percentage", data.customs_percentage)
          setValue("margin_percentage", data.margin_percentage)
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [supabase, setValue])

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from("settings")
        .select("id")
        .single()

      if (existing) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from("settings")
          .update({
            exchange_rate_yuan_xof: data.exchange_rate_yuan_xof,
            shipping_price_per_kg: data.shipping_price_per_kg,
            customs_percentage: data.customs_percentage,
            margin_percentage: data.margin_percentage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)

        if (updateError) {
          setError(updateError.message)
          setIsSubmitting(false)
          return
        }
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from("settings")
          .insert({
            exchange_rate_yuan_xof: data.exchange_rate_yuan_xof,
            shipping_price_per_kg: data.shipping_price_per_kg,
            customs_percentage: data.customs_percentage,
            margin_percentage: data.margin_percentage,
          })

        if (insertError) {
          setError(insertError.message)
          setIsSubmitting(false)
          return
        }
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
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
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="p-4">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarToggle onClick={() => setSidebarOpen(true)} />
              <div>
                <h1 className="text-xl font-bold font-[var(--font-fira-sans)]">
                  Paramètres
                </h1>
                <p className="text-slate-600 mt-0.5 text-xs">
                  Configurez les paramètres globaux de calcul des prix
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Paramètres de Calcul des Prix</CardTitle>
                <CardDescription className="text-xs">
                  Ces paramètres sont utilisés pour calculer automatiquement le prix final des produits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="exchange_rate_yuan_xof">
                      Taux de change (1 Yuan = X FCFA) *
                    </Label>
                    <Input
                      id="exchange_rate_yuan_xof"
                      type="number"
                      step="0.1"
                      {...register("exchange_rate_yuan_xof", { valueAsNumber: true })}
                      className={errors.exchange_rate_yuan_xof ? "border-red-500" : ""}
                      placeholder="90.0"
                    />
                    {errors.exchange_rate_yuan_xof && (
                      <p className="text-xs text-red-500">
                        {errors.exchange_rate_yuan_xof.message}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Taux de conversion entre le Yuan chinois et le FCFA
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shipping_price_per_kg">
                      Prix transport par KG (FCFA) *
                    </Label>
                    <Input
                      id="shipping_price_per_kg"
                      type="number"
                      step="100"
                      {...register("shipping_price_per_kg", { valueAsNumber: true })}
                      className={errors.shipping_price_per_kg ? "border-red-500" : ""}
                      placeholder="9000"
                    />
                    {errors.shipping_price_per_kg && (
                      <p className="text-xs text-red-500">
                        {errors.shipping_price_per_kg.message}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Coût du transport aérien par kilogramme
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customs_percentage">
                      Pourcentage Douane (%) *
                    </Label>
                    <Input
                      id="customs_percentage"
                      type="number"
                      step="0.1"
                      {...register("customs_percentage", { valueAsNumber: true })}
                      className={errors.customs_percentage ? "border-red-500" : ""}
                      placeholder="10"
                    />
                    {errors.customs_percentage && (
                      <p className="text-xs text-red-500">
                        {errors.customs_percentage.message}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Pourcentage de droits de douane (ex: 10 pour 10%)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="margin_percentage">
                      Pourcentage Marge (%) *
                    </Label>
                    <Input
                      id="margin_percentage"
                      type="number"
                      step="0.1"
                      {...register("margin_percentage", { valueAsNumber: true })}
                      className={errors.margin_percentage ? "border-red-500" : ""}
                      placeholder="25"
                    />
                    {errors.margin_percentage && (
                      <p className="text-xs text-red-500">
                        {errors.margin_percentage.message}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Marge bénéficiaire (ex: 25 pour 25%)
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-3 text-xs text-red-600">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-md bg-green-50 p-3 text-xs text-green-600">
                    Paramètres enregistrés avec succès !
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Enregistrement..." : "Enregistrer les paramètres"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Info Card */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Comment ça fonctionne ?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-slate-600">
                <p>
                  <strong>1. Prix Chine :</strong> Prix d'achat × Taux de change
                </p>
                <p>
                  <strong>2. Transport :</strong> Poids (KG) × Prix transport par KG
                </p>
                <p>
                  <strong>3. Coût débarqué :</strong> Prix Chine + Transport
                </p>
                <p>
                  <strong>4. Douane :</strong> Coût débarqué × (Pourcentage Douane / 100)
                </p>
                <p>
                  <strong>5. Marge :</strong> (Coût débarqué + Douane) × (1 + Marge / 100)
                </p>
                <p>
                  <strong>6. Prix final :</strong> Arrondi au 50 ou 100 supérieur
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

