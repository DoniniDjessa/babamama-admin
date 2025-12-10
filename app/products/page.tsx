"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CATEGORIES, type CategoryKey } from "@/lib/constants/categories"

type Product = {
  id: string
  title: string
  category: CategoryKey
  subcategory: string | null
  subsubcategory: string | null
  final_price_xof: number
  is_active: boolean
  is_new: boolean
  stock_quantity: number
  images: string[]
  created_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<CategoryKey | "all">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [filterStock, setFilterStock] = useState<"all" | "in_stock" | "out_of_stock">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("ali-products")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching products:", error)
        } else {
          setAllProducts(data || [])
        }
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [supabase])

  // Filter products based on all filters
  useEffect(() => {
    let filtered = [...allProducts]

    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter((p) => p.category === filterCategory)
    }

    // Filter by status
    if (filterStatus === "active") {
      filtered = filtered.filter((p) => p.is_active)
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((p) => !p.is_active)
    }

    // Filter by stock
    if (filterStock === "in_stock") {
      filtered = filtered.filter((p) => p.stock_quantity > 0)
    } else if (filterStock === "out_of_stock") {
      filtered = filtered.filter((p) => p.stock_quantity === 0)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.subcategory?.toLowerCase().includes(query) ||
          p.subsubcategory?.toLowerCase().includes(query)
      )
    }

    setProducts(filtered)
  }, [allProducts, filterCategory, filterStatus, filterStock, searchQuery])

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
      <div className="p-4">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-[var(--font-fira-sans)]">
                Produits
              </h1>
              <p className="text-slate-600 mt-0.5 text-xs">
                Gérez votre catalogue de produits
              </p>
            </div>
            <Link href="/products/new">
              <Button size="sm">Nouveau Produit</Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="mb-4 space-y-3">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Label className="text-xs text-slate-600 self-center">Catégorie:</Label>
                <Button
                  variant={filterCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory("all")}
                  className="text-xs"
                >
                  Tous
                </Button>
                {Object.keys(CATEGORIES).map((key) => (
                  <Button
                    key={key}
                    variant={filterCategory === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterCategory(key as CategoryKey)}
                    className="text-xs"
                  >
                    {CATEGORIES[key as CategoryKey].name}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 md:flex-nowrap md:items-center">
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <Label className="text-xs text-slate-600 self-center">Statut:</Label>
                  <Button
                    variant={filterStatus === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("all")}
                    className="text-xs"
                  >
                    Tous
                  </Button>
                  <Button
                    variant={filterStatus === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("active")}
                    className="text-xs"
                  >
                    Actifs
                  </Button>
                  <Button
                    variant={filterStatus === "inactive" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("inactive")}
                    className="text-xs"
                  >
                    Inactifs
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto md:ml-4">
                  <Label className="text-xs text-slate-600 self-center">Stock:</Label>
                  <Button
                    variant={filterStock === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStock("all")}
                    className="text-xs"
                  >
                    Tous
                  </Button>
                  <Button
                    variant={filterStock === "in_stock" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStock("in_stock")}
                    className="text-xs"
                  >
                    En stock
                  </Button>
                  <Button
                    variant={filterStock === "out_of_stock" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStock("out_of_stock")}
                    className="text-xs"
                  >
                    Rupture
                  </Button>
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="text-xs text-slate-500">
              {products.length} produit{products.length > 1 ? "s" : ""} trouvé{products.length > 1 ? "s" : ""}
            </div>
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
            <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative aspect-square bg-slate-100">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[10px] text-slate-400">
                          Pas d'image
                        </span>
                      </div>
                    )}
                    {product.is_new && (
                      <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Nouveau
                      </span>
                    )}
                    {!product.is_active && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Inactif
                      </span>
                    )}
                  </div>
                  <CardHeader className="p-2">
                    <CardTitle className="text-[11px] line-clamp-2 leading-tight font-medium">
                      {product.title}
                    </CardTitle>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[11px] font-semibold text-indigo-600">
                        {product.final_price_xof.toLocaleString()} FCFA
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {CATEGORIES[product.category]?.name || product.category}
                      </p>
                      {product.subcategory && (
                        <p className="text-[10px] text-slate-400 truncate">
                          {product.subcategory}
                          {product.subsubcategory && ` > ${product.subsubcategory}`}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400">
                        Stock: {product.stock_quantity}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                    <div className="flex gap-1">
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full text-[10px] h-6 px-2">
                          Modifier
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(product.id, product.is_active)}
                        className="text-[10px] h-6 px-2"
                      >
                        {product.is_active ? "Off" : "On"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-700 text-[10px] h-6 px-2"
                      >
                        ×
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

