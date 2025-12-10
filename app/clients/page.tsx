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
import { PhoneInput } from "@/components/phone-input"

const clientSchema = z.object({
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
})

type ClientFormValues = z.infer<typeof clientSchema>

type Client = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      is_active: true,
    },
  })

  const isActive = watch("is_active")

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from("ali-clients")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching clients:", error)
        } else {
          setClients(data || [])
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [supabase])

  const onSubmit = async (data: ClientFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (editingClient) {
        // Update existing client
        const { error: updateError } = await supabase
          .from("ali-clients")
          .update({
            full_name: data.full_name,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            city: data.city || null,
            notes: data.notes || null,
            is_active: data.is_active,
          })
          .eq("id", editingClient.id)

        if (updateError) {
          setError(updateError.message)
          setIsSubmitting(false)
          return
        }

        setClients(
          clients.map((c) =>
            c.id === editingClient.id
              ? {
                  ...c,
                  full_name: data.full_name,
                  email: data.email || null,
                  phone: data.phone || null,
                  address: data.address || null,
                  city: data.city || null,
                  notes: data.notes || null,
                  is_active: data.is_active,
                }
              : c
          )
        )
      } else {
        // Create new client
        const { data: newClient, error: insertError } = await supabase
          .from("ali-clients")
          .insert({
            full_name: data.full_name,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            city: data.city || null,
            notes: data.notes || null,
            is_active: data.is_active,
            created_by: user?.id,
          })
          .select()
          .single()

        if (insertError) {
          setError(insertError.message)
          setIsSubmitting(false)
          return
        }

        setClients([newClient, ...clients])
      }

      reset()
      setShowForm(false)
      setEditingClient(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setValue("full_name", client.full_name)
    setValue("email", client.email || "")
    setValue("phone", client.phone || "")
    setValue("address", client.address || "")
    setValue("city", client.city || "")
    setValue("notes", client.notes || "")
    setValue("is_active", client.is_active)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      return
    }

    const { error } = await supabase.from("ali-clients").delete().eq("id", id)

    if (error) {
      alert("Erreur lors de la suppression: " + error.message)
    } else {
      setClients(clients.filter((c) => c.id !== id))
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("ali-clients")
      .update({ is_active: !currentStatus })
      .eq("id", id)

    if (error) {
      alert("Erreur: " + error.message)
    } else {
      setClients(
        clients.map((c) => (c.id === id ? { ...c, is_active: !currentStatus } : c))
      )
    }
  }

  const cancelForm = () => {
    reset()
    setShowForm(false)
    setEditingClient(null)
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
                Nos Clients
              </h1>
              <p className="text-slate-600 mt-0.5 text-xs">
                Gérez vos clients physiques (ajoutés manuellement)
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              {showForm ? "Annuler" : "Nouveau Client"}
            </Button>
          </div>

          {/* Form */}
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm">
                  {editingClient ? "Modifier le client" : "Nouveau client"}
                </CardTitle>
                <CardDescription className="text-xs">
                  Ajoutez un client physique qui n'est pas sur le site web
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
                      <Label htmlFor="full_name">Nom complet *</Label>
                      <Input
                        id="full_name"
                        {...register("full_name")}
                        className={errors.full_name ? "border-red-500" : ""}
                      />
                      {errors.full_name && (
                        <p className="text-xs text-red-500">{errors.full_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <PhoneInput
                        value={watch("phone") || ""}
                        onChange={(value) => setValue("phone", value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input id="city" {...register("city")} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input id="address" {...register("address")} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <textarea
                        id="notes"
                        {...register("notes")}
                        rows={3}
                        className="flex w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                        placeholder="Notes supplémentaires sur le client..."
                      />
                    </div>

                    <div className="flex items-center gap-2 md:col-span-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={isActive}
                        onChange={(e) => setValue("is_active", e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <Label htmlFor="is_active" className="text-xs">
                        Client actif
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Enregistrement..."
                        : editingClient
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

          {/* Clients List */}
          {clients.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-xs text-slate-600 mb-4">Aucun client trouvé</p>
                <Button onClick={() => setShowForm(true)} size="sm">
                  Créer votre premier client
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => (
                <Card key={client.id}>
                  <CardHeader className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm">{client.full_name}</CardTitle>
                        {!client.is_active && (
                          <span className="text-[10px] text-red-500 mt-1 inline-block">
                            Inactif
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-1">
                    {client.phone && (
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">Tél:</span> {client.phone}
                      </p>
                    )}
                    {client.email && (
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">Email:</span> {client.email}
                      </p>
                    )}
                    {client.address && (
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">Adresse:</span> {client.address}
                      </p>
                    )}
                    {client.city && (
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">Ville:</span> {client.city}
                      </p>
                    )}
                    {client.notes && (
                      <p className="text-xs text-slate-500 mt-2 italic">
                        {client.notes}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                        className="flex-1 text-xs"
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(client.id, client.is_active)}
                        className="text-xs"
                      >
                        {client.is_active ? "Désactiver" : "Activer"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(client.id)}
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

