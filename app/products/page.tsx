"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/sidebar"
import { SidebarToggle } from "@/components/sidebar-toggle"
import { CATEGORIES, type CategoryKey } from "@/lib/constants/categories"

type Product = {
  id: string
  title: string
  category: CategoryKey
  subcategory: string | null
  final_price_xof: number
  is_active: boolean
  is_new: boolean
  stock_quantity: number
  images: string[]
  created_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState<CategoryKey | "all">("all")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let query = supabase
          .from("ali-products")
          .select("*")
          .order("created_at", { ascending: false })

        if (filterCategory !== "all") {
          query = query.eq("category", filterCategory)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching products:", error)
        } else {
          setProducts(data || [])
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [supabase, filterCategory])

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      return
    }

    const { error } = await supabase
      .from("ali-products")
      .delete()
      .eq("id", id)

    if (error) {
      alert("Erreur lors de la suppression: " + error.message)
    } else {
      setProducts(products.filter((p) => p.id !== id))
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("ali-products")
      .update({ is_active: !currentStatus })
      .eq("id", id)

    if (error) {
      alert("Erreur: " + error.message)
    } else {
      setProducts(
        products.map((p) =>
          p.id === id ? { ...p, is_active: !currentStatus } : p
        )
      )
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="p-4">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarToggle onClick={() => setSidebarOpen(true)} />
              <div>
                <h1 className="text-xl font-bold font-[var(--font-fira-sans)]">
                  Produits
                </h1>
                <p className="text-slate-600 mt-0.5 text-xs">
                  Gérez votre catalogue de produits
                </p>
              </div>
            </div>
            <Link href="/products/new">
              <Button size="sm">Nouveau Produit</Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              variant={filterCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory("all")}
            >
              Tous
            </Button>
            {Object.keys(CATEGORIES).map((key) => (
              <Button
                key={key}
                variant={filterCategory === key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCategory(key as CategoryKey)}
              >
                {CATEGORIES[key as CategoryKey].name}
              </Button>
            ))}
          </div>

          {/* Products List */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-xs text-slate-600">Chargement...</p>
            </div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-xs text-slate-600 mb-4">
                  Aucun produit trouvé
                </p>
                <Link href="/products/new">
                  <Button size="sm">Créer votre premier produit</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="relative aspect-square bg-slate-100">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-slate-400">
                          Pas d'image
                        </span>
                      </div>
                    )}
                    {product.is_new && (
                      <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                        Nouveau
                      </span>
                    )}
                    {!product.is_active && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                        Inactif
                      </span>
                    )}
                  </div>
                  <CardHeader className="p-3">
                    <CardTitle className="text-xs line-clamp-2">
                      {product.title}
                    </CardTitle>
                    <div className="mt-1">
                      <p className="text-xs font-semibold text-indigo-600">
                        {product.final_price_xof.toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {CATEGORIES[product.category]?.name || product.category}
                      </p>
                      {product.subcategory && (
                        <p className="text-xs text-slate-400">
                          {product.subcategory}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">
                        Stock: {product.stock_quantity}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="flex gap-2">
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          Modifier
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(product.id, product.is_active)}
                      >
                        {product.is_active ? "Désactiver" : "Activer"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-700"
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

