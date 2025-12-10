"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Order = {
  id: string
  customer_name: string
  customer_phone: string
  delivery_address: string | null
  items: any[]
  total_amount_xof: number
  payment_method: string
  status: string
  created_at: string
}

const STATUS_OPTIONS = [
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmée" },
  { value: "shipping", label: "En livraison" },
  { value: "delivered", label: "Livrée" },
  { value: "cancelled", label: "Annulée" },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterStatus = searchParams.get("status") || "all"
  const supabase = createClient()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        let query = supabase
          .from("ali-orders")
          .select("*")
          .order("created_at", { ascending: false })

        if (filterStatus !== "all") {
          query = query.eq("status", filterStatus)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching orders:", error)
        } else {
          setOrders(data || [])
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [supabase, filterStatus])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("ali-orders")
      .update({ status: newStatus })
      .eq("id", orderId)

    if (error) {
      alert("Erreur lors de la mise à jour: " + error.message)
    } else {
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold font-[var(--font-fira-sans)]">
              Commandes
            </h1>
            <p className="text-slate-600 mt-0.5 text-xs">
              Gérez toutes les commandes
            </p>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => router.push("/orders")}
            >
              Toutes
            </Button>
            {STATUS_OPTIONS.map((status) => (
              <Button
                key={status.value}
                variant={filterStatus === status.value ? "default" : "outline"}
                size="sm"
                onClick={() => router.push(`/orders?status=${status.value}`)}
              >
                {status.label}
              </Button>
            ))}
          </div>

          {/* Orders Table */}
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-xs text-slate-600">Chargement...</p>
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-xs text-slate-600">Aucune commande trouvée</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {orders.length} commande{orders.length > 1 ? "s" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-2 font-semibold">ID</th>
                        <th className="text-left py-2 px-2 font-semibold">Client</th>
                        <th className="text-left py-2 px-2 font-semibold">Téléphone</th>
                        <th className="text-left py-2 px-2 font-semibold">Adresse</th>
                        <th className="text-left py-2 px-2 font-semibold">Articles</th>
                        <th className="text-left py-2 px-2 font-semibold">Montant</th>
                        <th className="text-left py-2 px-2 font-semibold">Paiement</th>
                        <th className="text-left py-2 px-2 font-semibold">Statut</th>
                        <th className="text-left py-2 px-2 font-semibold">Date</th>
                        <th className="text-left py-2 px-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-2 font-mono text-xs">
                            {order.id.substring(0, 8)}...
                          </td>
                          <td className="py-2 px-2">{order.customer_name}</td>
                          <td className="py-2 px-2">{order.customer_phone}</td>
                          <td className="py-2 px-2 text-slate-500">
                            {order.delivery_address || "-"}
                          </td>
                          <td className="py-2 px-2">
                            {Array.isArray(order.items) ? order.items.length : 0} article(s)
                          </td>
                          <td className="py-2 px-2 font-semibold">
                            {formatCurrency(order.total_amount_xof)} FCFA
                          </td>
                          <td className="py-2 px-2">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-xs">
                              {getPaymentMethodLabel(order.payment_method)}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className={`px-2 py-1 rounded text-xs border-0 ${getStatusBadgeColor(
                                order.status
                              )}`}
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2 text-slate-500">
                            {new Date(order.created_at).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-2 px-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => router.push(`/orders/${order.id}`)}
                            >
                              Détails
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

