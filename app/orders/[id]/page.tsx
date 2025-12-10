"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type OrderItem = {
  product_id: string
  title: string
  price: number
  qty: number
}

type Order = {
  id: string
  customer_name: string
  customer_phone: string
  delivery_address: string | null
  items: OrderItem[]
  total_amount_xof: number
  payment_method: string
  status: string
  assigned_vehicle_id: string | null
  assigned_employee_id: string | null
  created_at: string
}

const STATUS_OPTIONS = [
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmée" },
  { value: "shipping", label: "En livraison" },
  { value: "delivered", label: "Livrée" },
  { value: "cancelled", label: "Annulée" },
]

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [assignedVehicle, setAssignedVehicle] = useState<any>(null)
  const [assignedEmployee, setAssignedEmployee] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from("ali-orders")
          .select("*")
          .eq("id", orderId)
          .single()

        if (error) {
          console.error("Error fetching order:", error)
          return
        }

        setOrder(data)

        // Fetch assigned vehicle if exists
        if (data.assigned_vehicle_id) {
          const { data: vehicle } = await supabase
            .from("ali-delivery-vehicles")
            .select("*")
            .eq("id", data.assigned_vehicle_id)
            .single()
          setAssignedVehicle(vehicle)
        }

        // Fetch assigned employee if exists
        if (data.assigned_employee_id) {
          const { data: employee } = await supabase
            .from("ali-users")
            .select("*")
            .eq("id", data.assigned_employee_id)
            .single()
          setAssignedEmployee(employee)
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId, supabase])

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return

    const { error } = await supabase
      .from("ali-orders")
      .update({ status: newStatus })
      .eq("id", order.id)

    if (error) {
      alert("Erreur lors de la mise à jour: " + error.message)
    } else {
      setOrder({ ...order, status: newStatus })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount)
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      shipping: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-slate-100 text-slate-800"
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      wave: "Wave",
      om: "Orange Money",
      cash: "Espèces",
      pending: "En attente",
    }
    return labels[method] || method
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
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-[var(--font-fira-sans)]">
                Détails de la Commande
              </h1>
              <p className="text-slate-600 mt-0.5 text-xs">
                ID: {order.id.substring(0, 8)}...
              </p>
            </div>
            <Link href="/orders">
              <Button variant="outline" size="sm">Retour</Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informations Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500">Nom</p>
                  <p className="text-xs font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Téléphone</p>
                  <p className="text-xs font-medium">{order.customer_phone}</p>
                </div>
                {order.delivery_address && (
                  <div>
                    <p className="text-xs text-slate-500">Adresse de livraison</p>
                    <p className="text-xs font-medium">{order.delivery_address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informations Commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500">Statut</p>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(e.target.value)}
                    className={`mt-1 px-2 py-1 rounded text-xs border-0 ${getStatusBadgeColor(
                      order.status
                    )}`}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Méthode de paiement</p>
                  <p className="text-xs font-medium">
                    {getPaymentMethodLabel(order.payment_method)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Montant total</p>
                  <p className="text-sm font-bold text-indigo-600">
                    {formatCurrency(order.total_amount_xof)} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Date de commande</p>
                  <p className="text-xs font-medium">
                    {new Date(order.created_at).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assignation Livraison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assignedVehicle ? (
                  <div>
                    <p className="text-xs text-slate-500">Véhicule</p>
                    <p className="text-xs font-medium">{assignedVehicle.name}</p>
                    {assignedVehicle.driver_name && (
                      <p className="text-xs text-slate-400">
                        Conducteur: {assignedVehicle.driver_name}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Aucun véhicule assigné</p>
                )}
                {assignedEmployee ? (
                  <div>
                    <p className="text-xs text-slate-500">Employé</p>
                    <p className="text-xs font-medium">{assignedEmployee.full_name}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Aucun employé assigné</p>
                )}
                <Link href={`/orders/${order.id}/edit`}>
                  <Button size="sm" variant="outline" className="w-full mt-2">
                    Modifier l'assignation
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Articles ({order.items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded"
                      >
                        <div className="flex-1">
                          <p className="text-xs font-medium">{item.title}</p>
                          <p className="text-xs text-slate-500">
                            Quantité: {item.qty} × {formatCurrency(item.price)} FCFA
                          </p>
                        </div>
                        <p className="text-xs font-semibold">
                          {formatCurrency(item.price * item.qty)} FCFA
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">Aucun article</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <p className="text-sm font-bold">Total</p>
                    <p className="text-sm font-bold text-indigo-600">
                      {formatCurrency(order.total_amount_xof)} FCFA
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

