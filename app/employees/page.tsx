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

const employeeSchema = z.object({
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  date_of_birth: z.string().optional(),
  hire_date: z.string().optional(),
  salary: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
  function_id: z.string().optional(),
  role: z.enum(["super_admin", "admin", "gerant", "comptable", "manager", "caissiere", "livreur", "team_member"]).optional(),
  add_as_user: z.boolean().default(false),
})

const functionSchema = z.object({
  name: z.string().min(2, "Le nom de la fonction doit contenir au moins 2 caractères"),
  description: z.string().optional(),
})

type EmployeeFormValues = z.infer<typeof employeeSchema>

type Employee = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  date_of_birth: string | null
  hire_date: string | null
  salary: number | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  notes: string | null
  function_id: string | null
  role: UserRole | null
  is_employee?: boolean
  is_active: boolean
  created_at: string
  has_account?: boolean // true if from ali-users, false if from ali-employees
}

type Function = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [functions, setFunctions] = useState<Function[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [showFunctionForm, setShowFunctionForm] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const supabase = createClient()

  const {
    register: registerFunction,
    handleSubmit: handleSubmitFunction,
    reset: resetFunction,
    formState: { errors: functionErrors },
  } = useForm<z.infer<typeof functionSchema>>({
    resolver: zodResolver(functionSchema),
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      add_as_user: false,
    },
  })

  const phone = watch("phone")
  const addAsUser = watch("add_as_user")

  const fetchAllEmployees = async () => {
    try {
      // Fetch employees from ali-users (with user accounts)
      const { data: usersData, error: usersError } = await supabase
        .from("ali-users")
        .select("*")
        .eq("is_employee", true)
        .order("created_at", { ascending: false })

      // Fetch employees from ali-employees (without user accounts)
      const { data: employeesData, error: employeesError } = await supabase
        .from("ali-employees")
        .select("*")
        .order("created_at", { ascending: false })

      if (usersError) {
        console.error("Error fetching user employees:", usersError)
      }
      if (employeesError) {
        console.error("Error fetching employees:", employeesError)
      }

      // Combine both lists
      const allEmployees = [
        ...(usersData || []).map((e) => ({ ...e, has_account: true })),
        ...(employeesData || []).map((e) => ({ ...e, has_account: false })),
      ]

      setEmployees(allEmployees as any)
    } catch (err) {
      console.error("Error:", err)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch employees
        await fetchAllEmployees()

        // Fetch functions
        const { data: functionsData, error: functionsError } = await supabase
          .from("ali-functions")
          .select("*")
          .eq("is_active", true)
          .order("name")

        if (functionsError) {
          console.error("Error fetching functions:", functionsError)
        } else {
          setFunctions(functionsData || [])
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const onSubmit = async (data: EmployeeFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (data.add_as_user) {
        // Create as user with role (can login)
        if (!data.role) {
          setError("Un rôle est requis pour créer un utilisateur")
          setIsSubmitting(false)
          return
        }

        let email = data.email || ""

        if (!email && data.phone) {
          email = `${data.phone.replace(/\s/g, "")}@phone.local`
        }

        if (!email) {
          setError("Email ou téléphone requis")
          setIsSubmitting(false)
          return
        }

        // Generate a random password
        const password = Math.random().toString(36).slice(-12) + "A1!"

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: password,
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
            address: data.address || null,
            city: data.city || null,
            date_of_birth: data.date_of_birth || null,
            hire_date: data.hire_date || null,
            salary: data.salary ? parseFloat(data.salary) : null,
            emergency_contact_name: data.emergency_contact_name || null,
            emergency_contact_phone: data.emergency_contact_phone || null,
            notes: data.notes || null,
            function_id: data.function_id || null,
            role: data.role,
            is_employee: true,
            is_active: true,
          })

        if (userError) {
          setError(userError.message)
          setIsSubmitting(false)
          return
        }

        alert(`Employé créé avec succès! Mot de passe: ${password}`)
      } else {
        // Create employee without user account (cannot login)
        // Create in ali-employees table
        const {
          data: { user },
        } = await supabase.auth.getUser()

        const { data: newEmployee, error: insertError } = await supabase
          .from("ali-employees")
          .insert({
            full_name: data.full_name,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            city: data.city || null,
            date_of_birth: data.date_of_birth || null,
            hire_date: data.hire_date || null,
            salary: data.salary ? parseFloat(data.salary) : null,
            emergency_contact_name: data.emergency_contact_name || null,
            emergency_contact_phone: data.emergency_contact_phone || null,
            notes: data.notes || null,
            function_id: data.function_id || null,
            created_by: user?.id,
          })
          .select()
          .single()

        if (insertError) {
          setError(insertError.message)
          setIsSubmitting(false)
          return
        }

        // Refresh employees list
        await fetchAllEmployees()
      }

      // Refresh employees list
      await fetchAllEmployees()
      reset()
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setIsSubmitting(false)
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
                Employés
              </h1>
              <p className="text-slate-600 mt-0.5 text-xs">
                Liste des employés (utilisateurs marqués comme employés)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFunctionForm(!showFunctionForm)}
              >
                {showFunctionForm ? "Annuler" : "Créer Fonction"}
              </Button>
              <Button onClick={() => setShowForm(!showForm)} size="sm">
                {showForm ? "Annuler" : "Nouvel Employé"}
              </Button>
            </div>
          </div>

          {/* Quick Function Form */}
          {showFunctionForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm">Créer une Fonction</CardTitle>
                <CardDescription className="text-xs">
                  Ajoutez rapidement une nouvelle fonction (poste) pour les employés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitFunction(async (data) => {
                    try {
                      const {
                        data: { user },
                      } = await supabase.auth.getUser()

                      const { data: newFunction, error: insertError } = await supabase
                        .from("ali-functions")
                        .insert({
                          name: data.name,
                          description: data.description || null,
                          created_by: user?.id,
                        })
                        .select()
                        .single()

                      if (insertError) {
                        alert("Erreur: " + insertError.message)
                      } else {
                        // Refresh functions list
                        const { data: updatedFunctions } = await supabase
                          .from("ali-functions")
                          .select("*")
                          .eq("is_active", true)
                          .order("name")
                        setFunctions(updatedFunctions || [])
                        resetFunction()
                        setShowFunctionForm(false)
                      }
                    } catch (err) {
                      alert("Une erreur est survenue")
                    }
                  })}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="function_name">Nom de la fonction *</Label>
                    <Input
                      id="function_name"
                      {...registerFunction("name")}
                      className={functionErrors.name ? "border-red-500" : ""}
                      placeholder="Ex: Livreur, Caissier, Manager..."
                    />
                    {functionErrors.name && (
                      <p className="text-xs text-red-500">{functionErrors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="function_description">Description</Label>
                    <textarea
                      id="function_description"
                      {...registerFunction("description")}
                      rows={2}
                      className="flex w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                      placeholder="Description de la fonction..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="flex-1">
                      Créer la fonction
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetFunction()
                        setShowFunctionForm(false)
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Add Employee Form */}
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm">Ajouter un Employé</CardTitle>
                <CardDescription className="text-xs">
                  Créez un nouvel employé. Cochez "Ajouter comme utilisateur" pour lui donner accès à l'application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <div className="rounded-md bg-red-50 p-3 text-xs text-red-600">
                      {error}
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-slate-700 border-b pb-1">
                      Informations Personnelles
                    </h3>
                    
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
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date de naissance</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          {...register("date_of_birth")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">Ville</Label>
                        <Input id="city" {...register("city")} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input id="address" {...register("address")} />
                    </div>
                  </div>

                  {/* Employment Information */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-slate-700 border-b pb-1">
                      Informations Professionnelles
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="hire_date">Date d'embauche</Label>
                        <Input
                          id="hire_date"
                          type="date"
                          {...register("hire_date")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="salary">Salaire (FCFA)</Label>
                        <Input
                          id="salary"
                          type="number"
                          step="0.01"
                          {...register("salary")}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="function_id">Fonction</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6"
                          onClick={(e) => {
                            e.preventDefault()
                            setShowFunctionForm(!showFunctionForm)
                          }}
                        >
                          {showFunctionForm ? "Masquer" : "+ Créer fonction"}
                        </Button>
                      </div>
                      <select
                        id="function_id"
                        {...register("function_id")}
                        className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                      >
                        <option value="">Sélectionner une fonction...</option>
                        {functions.map((func) => (
                          <option key={func.id} value={func.id}>
                            {func.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="add_as_user"
                        {...register("add_as_user")}
                        className="w-3 h-3"
                      />
                      <Label htmlFor="add_as_user" className="cursor-pointer text-xs">
                        Ajouter comme utilisateur (avec accès à l'application)
                      </Label>
                    </div>

                    {addAsUser && (
                      <div className="space-y-2">
                        <Label htmlFor="role">Rôle *</Label>
                        <select
                          id="role"
                          {...register("role")}
                          className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                        >
                          <option value="">Sélectionner un rôle...</option>
                          {USER_ROLES.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        {errors.role && (
                          <p className="text-xs text-red-500">{errors.role.message}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-slate-700 border-b pb-1">
                      Contact d'Urgence
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name">Nom du contact</Label>
                        <Input id="emergency_contact_name" {...register("emergency_contact_name")} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone">Téléphone du contact</Label>
                        <PhoneInput
                          value={watch("emergency_contact_phone") || ""}
                          onChange={(value) => setValue("emergency_contact_phone", value || "")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      {...register("notes")}
                      rows={3}
                      className="flex w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                      placeholder="Notes supplémentaires sur l'employé..."
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? "Création..." : "Créer l'employé"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                      reset()
                      setShowForm(false)
                    }}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Employees List */}
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-xs text-slate-600">Chargement...</p>
              </CardContent>
            </Card>
          ) : employees.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-xs text-slate-600">Aucun employé trouvé</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Role Assignment Form */}
              {showRoleForm && selectedEmployee && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-sm">Assigner un rôle</CardTitle>
                    <CardDescription className="text-xs">
                      Assignez un rôle à {selectedEmployee.full_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="role_select">Rôle</Label>
                        <select
                          id="role_select"
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                        >
                          <option value="">Sélectionner un rôle...</option>
                          {USER_ROLES.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!selectedRole) {
                              alert("Veuillez sélectionner un rôle")
                              return
                            }
                            const { error } = await supabase
                              .from("ali-users")
                              .update({ role: selectedRole })
                              .eq("id", selectedEmployee.id)
                            if (error) {
                              alert("Erreur: " + error.message)
                            } else {
                              setEmployees(
                                employees.map((e) =>
                                  e.id === selectedEmployee.id ? { ...e, role: selectedRole as UserRole } : e
                                )
                              )
                              setShowRoleForm(false)
                              setSelectedEmployee(null)
                              setSelectedRole("")
                            }
                          }}
                        >
                          Assigner
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowRoleForm(false)
                            setSelectedEmployee(null)
                            setSelectedRole("")
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {employees.map((employee) => (
                  <Card key={employee.id}>
                    <CardHeader className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm">{employee.full_name}</CardTitle>
                          {!employee.is_active && (
                            <span className="text-[10px] text-red-500 mt-1 inline-block">
                              Inactif
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-1">
                      {employee.email && (
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Email:</span> {employee.email}
                        </p>
                      )}
                      {employee.phone && (
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Tél:</span> {employee.phone}
                        </p>
                      )}
                      {employee.city && (
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Ville:</span> {employee.city}
                        </p>
                      )}
                      {employee.address && (
                        <p className="text-xs text-slate-500 truncate">
                          <span className="font-medium">Adresse:</span> {employee.address}
                        </p>
                      )}
                      {employee.hire_date && (
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Embauché:</span>{" "}
                          {new Date(employee.hire_date).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                      {employee.salary && (
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Salaire:</span>{" "}
                          {employee.salary.toLocaleString()} FCFA
                        </p>
                      )}
                      {employee.function_id && (
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Fonction:</span>{" "}
                          {functions.find((f) => f.id === employee.function_id)?.name || "N/A"}
                        </p>
                      )}
                      {employee.emergency_contact_name && (
                        <p className="text-xs text-slate-500">
                          <span className="font-medium">Contact urgence:</span> {employee.emergency_contact_name}
                          {employee.emergency_contact_phone && ` (${employee.emergency_contact_phone})`}
                        </p>
                      )}
                      <div className="mt-2">
                        <p className="text-xs text-slate-500 mb-1">Rôle:</p>
                        {employee.role ? (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs inline-block">
                            {USER_ROLES.find((r) => r.value === employee.role)?.label || employee.role}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Aucun rôle assigné</span>
                        )}
                      </div>
                      {employee.notes && (
                        <p className="text-xs text-slate-400 italic mt-2 line-clamp-2">
                          {employee.notes}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEmployee(employee)
                            setSelectedRole(employee.role || "")
                            setShowRoleForm(true)
                          }}
                          className="flex-1 text-xs"
                        >
                          {employee.role ? "Modifier rôle" : "Assigner rôle"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

