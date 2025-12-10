"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type Vehicle = {
  id: string
  name: string
  type: string
  plate_number: string | null
  driver_name: string | null
  is_available: boolean
}

type Employee = {
  id: string
  full_name: string
  role: string | null
  is_employee: boolean
  is_active: boolean
}

export default function EditOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [order, setOrder] = useState<any>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch order
        const { data: orderData, error: orderError } = await supabase
          .from("ali-orders")
          .select("*")
          .eq("id", orderId)
          .single()

        if (orderError) {
          console.error("Error fetching order:", orderError)
          return
        }

        setOrder(orderData)
        setSelectedVehicleId(orderData.assigned_vehicle_id || "")
        setSelectedEmployeeId(orderData.assigned_employee_id || "")

        // Fetch available vehicles
        const { data: vehiclesData } = await supabase
          .from("ali-delivery-vehicles")
          .select("*")
          .eq("is_active", true)
          .order("name")

        setVehicles(vehiclesData || [])

        // Fetch employees (livreurs and active employees)
        const { data: employeesData } = await supabase
          .from("ali-users")
          .select("*")
          .eq("is_employee", true)
          .eq("is_active", true)
          .order("full_name")

        setEmployees(employeesData || [])
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchData()
    }
  }, [orderId, supabase])

  const handleSave = async () => {
    setSaving(true)

    try {
      const { error } = await supabase
        .from("ali-orders")
        .update({
          assigned_vehicle_id: selectedVehicleId || null,
          assigned_employee_id: selectedEmployeeId || null,
        })
        .eq("id", orderId)

      if (error) {
        alert("Erreur lors de la sauvegarde: " + error.message)
      } else {
        router.push(`/orders/${orderId}`)
      }
    } catch (err) {
      alert("Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-xs text-slate-600">Chargement...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-xs text-slate-600 mb-4">Commande non trouvée</p>
            <Link href="/orders">
              <Button size="sm">Retour aux commandes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-[var(--font-fira-sans)]">
                Modifier l'Assignation
              </h1>
              <p className="text-slate-600 mt-0.5 text-xs">
                Commande #{order.id.substring(0, 8)}...
              </p>
            </div>
            <Link href={`/orders/${orderId}`}>
              <Button variant="outline" size="sm">Annuler</Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assignation de Livraison</CardTitle>
              <CardDescription className="text-xs">
                Assignez un véhicule et un employé à cette commande
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vehicle Selection */}
              <div className="space-y-2">
                <Label htmlFor="vehicle">Véhicule</Label>
                <select
                  id="vehicle"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                >
                  <option value="">Aucun véhicule</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} {vehicle.plate_number ? `(${vehicle.plate_number})` : ""}
                      {!vehicle.is_available ? " - Indisponible" : ""}
                    </option>
                  ))}
                </select>
                {vehicles.length === 0 && (
                  <p className="text-xs text-slate-400">
                    Aucun véhicule disponible.{" "}
                    <Link href="/delivery-vehicles" className="text-indigo-600 underline">
                      Créer un véhicule
                    </Link>
                  </p>
                )}
              </div>

              {/* Employee Selection */}
              <div className="space-y-2">
                <Label htmlFor="employee">Employé</Label>
                <select
                  id="employee"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-[var(--font-poppins)]"
                >
                  <option value="">Aucun employé</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name}
                      {employee.role ? ` (${employee.role})` : ""}
                    </option>
                  ))}
                </select>
                {employees.length === 0 && (
                  <p className="text-xs text-slate-400">
                    Aucun employé disponible.{" "}
                    <Link href="/employees" className="text-indigo-600 underline">
                      Créer un employé
                    </Link>
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Link href={`/orders/${orderId}`}>
                  <Button variant="outline">Annuler</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

