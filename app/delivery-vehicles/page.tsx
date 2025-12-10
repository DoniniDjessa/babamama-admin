"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const vehicleSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  type: z.enum(["moto", "voiture", "tricycle", "autre"]),
  plate_number: z.string().optional(),
  is_active: z.boolean().default(true),
  is_available: z.boolean().default(true),
})

type VehicleFormValues = z.infer<typeof vehicleSchema>

type Vehicle = {
  id: string
  name: string
  type: string
  plate_number: string | null
  is_active: boolean
  is_available: boolean
  created_at: string
}

const VEHICLE_TYPES = [
  { value: "moto", label: "Moto" },
  { value: "voiture", label: "Voiture" },
  { value: "tricycle", label: "Tricycle" },
  { value: "autre", label: "Autre" },
]

export default function DeliveryVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      is_active: true,
      is_available: true,
    },
  })

  const isActive = watch("is_active")
  const isAvailable = watch("is_available")

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data, error } = await supabase
          .from("ali-delivery-vehicles")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching vehicles:", error)
        } else {
          setVehicles(data || [])
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [supabase])

  const onSubmit = async (data: VehicleFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (editingVehicle) {
        // Update existing vehicle
        const { error: updateError } = await supabase
          .from("ali-delivery-vehicles")
          .update({
            name: data.name,
            type: data.type,
            plate_number: data.plate_number || null,
            is_active: data.is_active,
            is_available: data.is_available,
          })
          .eq("id", editingVehicle.id)

        if (updateError) {
          setError(updateError.message)
          setIsSubmitting(false)
          return
        }

        setVehicles(
          vehicles.map((v) =>
            v.id === editingVehicle.id
              ? {
                  ...v,
                  name: data.name,
                  type: data.type,
                  plate_number: data.plate_number || null,
                  is_active: data.is_active,
                  is_available: data.is_available,
                }
              : v
          )
        )
      } else {
        // Create new vehicle
        const { data: newVehicle, error: insertError } = await supabase
          .from("ali-delivery-vehicles")
          .insert({
            name: data.name,
            type: data.type,
            plate_number: data.plate_number || null,
            is_active: data.is_active,
            is_available: data.is_available,
            created_by: user?.id,
          })
          .select()
          .single()

        if (insertError) {
          setError(insertError.message)
          setIsSubmitting(false)
          return
        }

        setVehicles([newVehicle, ...vehicles])
      }

      reset()
      setShowForm(false)
      setEditingVehicle(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setValue("name", vehicle.name)
    setValue("type", vehicle.type as any)
    setValue("plate_number", vehicle.plate_number || "")
    setValue("is_active", vehicle.is_active)
    setValue("is_available", vehicle.is_available)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce véhicule ?")) {
      return
    }

    const { error } = await supabase.from("ali-delivery-vehicles").delete().eq("id", id)

    if (error) {
      alert("Erreur lors de la suppression: " + error.message)
    } else {
      setVehicles(vehicles.filter((v) => v.id !== id))
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("ali-delivery-vehicles")
      .update({ is_active: !currentStatus })
      .eq("id", id)

    if (error) {
      alert("Erreur: " + error.message)
    } else {
      setVehicles(vehicles.map((v) => (v.id === id ? { ...v, is_active: !currentStatus } : v)))
    }
  }

  const toggleAvailable = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("ali-delivery-vehicles")
      .update({ is_available: !currentStatus })
      .eq("id", id)

    if (error) {
      alert("Erreur: " + error.message)
    } else {
      setVehicles(vehicles.map((v) => (v.id === id ? { ...v, is_available: !currentStatus } : v)))
    }
  }

  const cancelForm = () => {
    reset()
    setShowForm(false)
    setEditingVehicle(null)
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
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-[var(--font-fira-sans)]">
                Véhicules de Livraison
              </h1>
              <p className="text-slate-600 mt-0.5 text-xs">
                Gérez vos véhicules et engins de livraison
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              {showForm ? "Annuler" : "Nouveau Véhicule"}
            </Button>
          </div>

          {/* Form */}
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm">
                  {editingVehicle ? "Modifier le véhicule" : "Nouveau véhicule"}
                </CardTitle>
                <CardDescription className="text-xs">
                  Ajoutez un véhicule pour les livraisons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-2 rounded">
                      {error}
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du véhicule *</Label>
                      <Input
                        id="name"
                        {...register("name")}
                        className={errors.name ? "border-red-500" : ""}
                        placeholder="Ex: Moto 001, Voiture 01"
                      />
                      {errors.name && (
                        <p className="text-xs text-red-500">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Type *</Label>
                      <select
                        id="type"
                        {...register("type")}
                        className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                      >
                        {VEHICLE_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.type && (
                        <p className="text-xs text-red-500">{errors.type.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plate_number">Numéro de plaque</Label>
                      <Input id="plate_number" {...register("plate_number")} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={isActive}
                        onChange={(e) => setValue("is_active", e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <Label htmlFor="is_active" className="text-xs">
                        Véhicule actif
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_available"
                        checked={isAvailable}
                        onChange={(e) => setValue("is_available", e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <Label htmlFor="is_available" className="text-xs">
                        Disponible pour livraison
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Enregistrement..."
                        : editingVehicle
                        ? "Modifier"
                        : "Créer"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={cancelForm}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Vehicles List */}
          {vehicles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-xs text-slate-600 mb-4">Aucun véhicule trouvé</p>
                <Button onClick={() => setShowForm(true)} size="sm">
                  Créer votre premier véhicule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id}>
                  <CardHeader className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm">{vehicle.name}</CardTitle>
                        <p className="text-xs text-slate-500 mt-1">
                          {VEHICLE_TYPES.find((t) => t.value === vehicle.type)?.label || vehicle.type}
                        </p>
                        {vehicle.plate_number && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Plaque: {vehicle.plate_number}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!vehicle.is_active && (
                          <span className="text-[10px] text-red-500">Inactif</span>
                        )}
                        {!vehicle.is_available && (
                          <span className="text-[10px] text-orange-500">Indisponible</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(vehicle)}
                        className="flex-1 text-xs"
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(vehicle.id, vehicle.is_active)}
                        className="text-xs"
                      >
                        {vehicle.is_active ? "Désactiver" : "Activer"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAvailable(vehicle.id, vehicle.is_available)}
                        className="text-xs"
                      >
                        {vehicle.is_available ? "Indisponible" : "Disponible"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(vehicle.id)}
                        className="text-red-600 hover:text-red-700 text-xs"
                      >
                        Suppr.
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

