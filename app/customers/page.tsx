"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Customer = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  created_at: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from("ali-customers")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching customers:", error)
        } else {
          setCustomers(data || [])
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [supabase])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold font-[var(--font-fira-sans)]">
              Clients
            </h1>
            <p className="text-slate-600 mt-0.5 text-xs">
              Liste des clients du site web
            </p>
          </div>

          {/* Customers List */}
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-xs text-slate-600">Chargement...</p>
              </CardContent>
            </Card>
          ) : customers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-xs text-slate-600">Aucun client trouvé</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {customers.length} client{customers.length > 1 ? "s" : ""}
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
                        <th className="text-left py-2 px-2 font-semibold">Date d'inscription</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-2">{customer.full_name}</td>
                          <td className="py-2 px-2">{customer.email || "-"}</td>
                          <td className="py-2 px-2">{customer.phone || "-"}</td>
                          <td className="py-2 px-2 text-slate-500">
                            {new Date(customer.created_at).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
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

