"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type DashboardStats = {
  pendingOrders: number
  dailyRevenue: number
  activeProducts: number
  recentOrders: any[]
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    pendingOrders: 0,
    dailyRevenue: 0,
    activeProducts: 0,
    recentOrders: [],
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setUser(user)
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login")
      } else {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get pending orders count
        const { count: pendingCount } = await supabase
          .from("ali-orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")

        // Get daily revenue (today's orders)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const { data: todayOrders } = await supabase
          .from("ali-orders")
          .select("total_amount_xof")
          .gte("created_at", today.toISOString())
          .in("status", ["confirmed", "shipping", "delivered"])

        const dailyRevenue = todayOrders?.reduce((sum, order) => sum + (order.total_amount_xof || 0), 0) || 0

        // Get active products count
        const { count: activeCount } = await supabase
          .from("ali-products")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)

        // Get recent orders
        const { data: recentOrders } = await supabase
          .from("ali-orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10)

        setStats({
          pendingOrders: pendingCount || 0,
          dailyRevenue,
          activeProducts: activeCount || 0,
          recentOrders: recentOrders || [],
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user, supabase])


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xs text-slate-600">Chargement...</p>
        </div>
      </div>
    )
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmée",
      shipping: "En livraison",
      delivered: "Livrée",
      cancelled: "Annulée",
    }
    return labels[status] || status
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold font-[var(--font-fira-sans)]">
              Tableau de Bord
            </h1>
            <p className="text-slate-600 mt-0.5 text-xs">
              Bienvenue, {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Link href="/orders?status=pending">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">Commandes en attente</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-[var(--font-fira-sans)]">
                    {stats.pendingOrders}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Chiffre d'affaires du jour</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-[var(--font-fira-sans)] text-green-600">
                  {formatCurrency(stats.dailyRevenue)} FCFA
                </div>
              </CardContent>
            </Card>

            <Link href="/products">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">Produits actifs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-[var(--font-fira-sans)]">
                    {stats.activeProducts}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Link href="/products/new">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-sm">Nouveau Produit</CardTitle>
                  <CardDescription className="text-xs">
                    Ajoutez un produit au catalogue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600">Créer →</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/orders">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-sm">Voir les Commandes</CardTitle>
                  <CardDescription className="text-xs">
                    Gérez toutes les commandes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600">Voir →</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/settings">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-sm">Paramètres</CardTitle>
                  <CardDescription className="text-xs">
                    Configurez l'application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600">Configurer →</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dernières Commandes</CardTitle>
              <CardDescription className="text-xs">
                Les 10 dernières commandes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentOrders.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  Aucune commande pour le moment
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-2 font-semibold">Client</th>
                        <th className="text-left py-2 px-2 font-semibold">Téléphone</th>
                        <th className="text-left py-2 px-2 font-semibold">Montant</th>
                        <th className="text-left py-2 px-2 font-semibold">Statut</th>
                        <th className="text-left py-2 px-2 font-semibold">Date</th>
                        <th className="text-left py-2 px-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map((order) => (
                        <tr key={order.id} className="border-b border-slate-100">
                          <td className="py-2 px-2">{order.customer_name}</td>
                          <td className="py-2 px-2">{order.customer_phone}</td>
                          <td className="py-2 px-2 font-semibold">
                            {formatCurrency(order.total_amount_xof)} FCFA
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${getStatusBadgeColor(
                                order.status
                              )}`}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-slate-500">
                            {new Date(order.created_at).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="py-2 px-2">
                            <Link href={`/orders/${order.id}`}>
                              <Button variant="ghost" size="sm" className="h-6 text-xs">
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
