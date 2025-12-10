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
import { USER_ROLES, type UserRole } from "@/lib/constants/roles"
import { PhoneInput } from "@/components/phone-input"

const userSchema = z.object({
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional(),
  phone: z.string().optional(),
  role: z.enum(["super_admin", "admin", "gerant", "comptable", "manager", "caissiere", "livreur", "team_member"]),
  is_employee: z.boolean().default(false),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
})

type UserFormValues = z.infer<typeof userSchema>

type TeamUser = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  role: UserRole
  is_employee: boolean
  is_active: boolean
  created_at: string
}

export default function TeamPage() {
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      is_employee: false,
      role: "team_member",
    },
  })

  const loginType = watch("email") ? "email" : "phone"
  const phone = watch("phone")

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("ali-users")
          .select("*")
          .order("created_at", { ascending: false })

        if (fetchError) {
          console.error("Error fetching users:", fetchError)
        } else {
          setUsers(data || [])
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [supabase])

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      let email = data.email || ""

      // If using phone, create email format
      if (!email && data.phone) {
        email = `${data.phone.replace(/\s/g, "")}@phone.local`
      }

      if (!email) {
        setError("Email ou téléphone requis")
        setIsSubmitting(false)
        return
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: data.full_name,
          phone: data.phone || null,
        },
      })

      if (authError) {
        setError(authError.message)
        setIsSubmitting(false)
        return
      }

      if (!authData.user) {
        setError("Erreur lors de la création de l'utilisateur")
        setIsSubmitting(false)
        return
      }

      // Create user record in ali-users
      const { error: userError } = await supabase
        .from("ali-users")
        .insert({
          id: authData.user.id,
          full_name: data.full_name,
          email: data.email || null,
          phone: data.phone || null,
          role: data.role,
          is_employee: data.is_employee,
          is_active: true,
        })

      if (userError) {
        setError(userError.message)
        setIsSubmitting(false)
        return
      }

      // Refresh users list
      const { data: updatedUsers } = await supabase
        .from("ali-users")
        .select("*")
        .order("created_at", { ascending: false })

      setUsers(updatedUsers || [])
      reset()
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setIsSubmitting(false)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("ali-users")
      .update({ is_active: !currentStatus })
      .eq("id", id)

    if (error) {
      alert("Erreur: " + error.message)
    } else {
      setUsers(
        users.map((u) => (u.id === id ? { ...u, is_active: !currentStatus } : u))
      )
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-[var(--font-fira-sans)]">
                Équipe
              </h1>
              <p className="text-slate-600 mt-0.5 text-xs">
                Gérez les utilisateurs de l'application admin
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              {showForm ? "Annuler" : "Nouvel Utilisateur"}
            </Button>
          </div>

          {/* Add User Form */}
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm">Ajouter un Utilisateur</CardTitle>
                <CardDescription className="text-xs">
                  Créez un nouvel utilisateur pour l'application admin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                  <div className="grid gap-4 md:grid-cols-2">
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
                      <Label htmlFor="phone">Téléphone</Label>
                      <PhoneInput
                        value={phone}
                        onChange={(value) => setValue("phone", value || "")}
                        error={!!errors.phone}
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-500">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="role">Rôle *</Label>
                      <select
                        id="role"
                        {...register("role")}
                        className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                      >
                        {USER_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe *</Label>
                      <Input
                        id="password"
                        type="password"
                        {...register("password")}
                        className={errors.password ? "border-red-500" : ""}
                      />
                      {errors.password && (
                        <p className="text-xs text-red-500">{errors.password.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_employee"
                      {...register("is_employee")}
                      className="w-3 h-3"
                    />
                    <Label htmlFor="is_employee" className="cursor-pointer">
                      Marquer comme employé
                    </Label>
                  </div>

                  {error && (
                    <div className="rounded-md bg-red-50 p-3 text-xs text-red-600">
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Création..." : "Créer l'utilisateur"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Users List */}
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-xs text-slate-600">Chargement...</p>
              </CardContent>
            </Card>
          ) : users.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-xs text-slate-600">Aucun utilisateur trouvé</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {users.length} utilisateur{users.length > 1 ? "s" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-2 font-semibold">Nom</th>
                        <th className="text-left py-2 px-2 font-semibold">Email</th>
                        <th className="text-left py-2 px-2 font-semibold">Téléphone</th>
                        <th className="text-left py-2 px-2 font-semibold">Rôle</th>
                        <th className="text-left py-2 px-2 font-semibold">Employé</th>
                        <th className="text-left py-2 px-2 font-semibold">Statut</th>
                        <th className="text-left py-2 px-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-2">{user.full_name}</td>
                          <td className="py-2 px-2">{user.email || "-"}</td>
                          <td className="py-2 px-2">{user.phone || "-"}</td>
                          <td className="py-2 px-2">
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs">
                              {USER_ROLES.find((r) => r.value === user.role)?.label || user.role}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            {user.is_employee ? (
                              <span className="text-green-600 text-xs">✓ Oui</span>
                            ) : (
                              <span className="text-slate-400 text-xs">Non</span>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                user.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.is_active ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleActive(user.id, user.is_active)}
                              className="h-6 text-xs"
                            >
                              {user.is_active ? "Désactiver" : "Activer"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

