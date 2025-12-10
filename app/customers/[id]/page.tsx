"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type Customer = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

type Order = {
  id: string
  customer_name: string
  customer_phone: string
  delivery_address: string | null
  items: any[]
  total_amount_xof: number
  payment_method: string
  status: string
  assigned_vehicle_id: string | null
  assigned_employee_id: string | null
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipping: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipping: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const PAYMENT_METHODS: Record<string, string> = {
  wave: "Wave",
  om: "Orange Money",
  cash: "Espèces",
  pending: "En attente",
}

export default function CustomerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const supabase = createClient()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customer
        const { data: customerData, error: customerError } = await supabase
          .from("ali-customers")
          .select("*")
          .eq("id", customerId)
          .single()

        if (customerError) {
          console.error("Error fetching customer:", customerError)
          return
        }

        setCustomer(customerData)

        // Fetch orders for this customer (by phone or name)
        // Note: ali-orders doesn't have customer_id, so we match by phone or name
        let ordersQuery = supabase
          .from("ali-orders")
          .select("*")
          .order("created_at", { ascending: false })

        // Match by phone if available
        if (customerData.phone) {
          ordersQuery = ordersQuery.eq("customer_phone", customerData.phone)
        } else {
          // Fallback to name matching if no phone
          ordersQuery = ordersQuery.ilike("customer_name", `%${customerData.full_name}%`)
        }

        const { data: ordersData, error: ordersError } = await ordersQuery

        if (ordersError) {
          console.error("Error fetching orders:", ordersError)
        } else {
          setOrders(ordersData || [])
          
          // Calculate stats
          const totalOrders = ordersData?.length || 0
          const totalSpent = ordersData?.reduce((sum, order) => {
            return sum + (order.status === 'cancelled' ? 0 : order.total_amount_xof)
          }, 0) || 0
          const pendingOrders = ordersData?.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'shipping').length || 0
          const deliveredOrders = ordersData?.filter(o => o.status === 'delivered').length || 0

          setStats({
            totalOrders,
            totalSpent,
            pendingOrders,
            deliveredOrders,
          })
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchData()
    }
  }, [customerId, supabase])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-xs text-slate-600">Chargement...</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="p-4">
          <div className="mx-auto max-w-7xl">
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-xs text-slate-600 mb-4">Client non trouvé</p>
                <Link href="/customers">
                  <Button size="sm" variant="outline">
                    Retour à la liste
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-[var(--font-fira-sans)]">
                Détails du Client
              </h1>
              <p className="text-slate-600 mt-0.5 text-xs">
                Profil complet et historique des commandes
              </p>
            </div>
            <Link href="/customers">
              <Button size="sm" variant="outline">
                Retour
              </Button>
            </Link>
          </div>

          {/* Customer Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Profil</CardTitle>
              <CardDescription className="text-xs">
                Informations personnelles du client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">Nom complet</p>
                  <p className="text-xs">{customer.full_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">Email</p>
                  <p className="text-xs">{customer.email || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">Téléphone</p>
                  <p className="text-xs">{customer.phone || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">ID Client</p>
                  <p className="text-xs font-mono text-slate-400">{customer.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">Date d'inscription</p>
                  <p className="text-xs">{formatDate(customer.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">Dernière mise à jour</p>
                  <p className="text-xs">{formatDate(customer.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Total Commandes</p>
                <p className="text-lg font-bold">{stats.totalOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Montant Total</p>
                <p className="text-lg font-bold">{formatCurrency(stats.totalSpent)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">En cours</p>
                <p className="text-lg font-bold">{stats.pendingOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Livrées</p>
                <p className="text-lg font-bold">{stats.deliveredOrders}</p>
              </CardContent>
            </Card>
          </div>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Historique des Commandes ({orders.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Toutes les commandes passées par ce client
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  Aucune commande trouvée
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-2 font-semibold">ID</th>
                        <th className="text-left py-2 px-2 font-semibold">Date</th>
                        <th className="text-left py-2 px-2 font-semibold">Articles</th>
                        <th className="text-left py-2 px-2 font-semibold">Montant</th>
                        <th className="text-left py-2 px-2 font-semibold">Paiement</th>
                        <th className="text-left py-2 px-2 font-semibold">Statut</th>
                        <th className="text-left py-2 px-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-2 font-mono text-slate-400">
                            {order.id.slice(0, 8)}...
                          </td>
                          <td className="py-2 px-2">{formatDate(order.created_at)}</td>
                          <td className="py-2 px-2">
                            {Array.isArray(order.items) ? order.items.length : 0} article(s)
                          </td>
                          <td className="py-2 px-2 font-semibold">
                            {formatCurrency(order.total_amount_xof)}
                          </td>
                          <td className="py-2 px-2">
                            {PAYMENT_METHODS[order.payment_method] || order.payment_method}
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                STATUS_COLORS[order.status] || "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <Link href={`/orders/${order.id}`}>
                              <Button size="sm" variant="outline" className="text-xs">
                                Voir
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

