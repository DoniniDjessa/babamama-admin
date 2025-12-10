"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

type Product = {
  id: string
  title: string
  final_price_xof: number
  compare_at_price: number | null
  stock_quantity: number
  flash_sale_end_at: string | null
  flash_sale_stock: number | null
}

type FlashSaleCampaign = {
  productIds: string[]
  endDate: string
  endTime: string
  stockAllocated: number | null
}

export default function FlashSalesPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [campaign, setCampaign] = useState<FlashSaleCampaign>({
    productIds: [],
    endDate: "",
    endTime: "",
    stockAllocated: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredProducts(
        products.filter(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.id.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, products])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("ali-products")
        .select("id, title, final_price_xof, compare_at_price, stock_quantity, flash_sale_end_at, flash_sale_stock")
        .eq("is_active", true)
        .order("title", { ascending: true })

      if (error) throw error
      setProducts(data || [])
      setFilteredProducts(data || [])
    } catch (err: any) {
      console.error("Error fetching products:", err)
      setError("Erreur lors du chargement des produits")
    }
  }

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
    setCampaign({ ...campaign, productIds: Array.from(newSelected) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (campaign.productIds.length === 0) {
      setError("Sélectionnez au moins un produit")
      return
    }

    if (!campaign.endDate || !campaign.endTime) {
      setError("Veuillez définir une date et heure de fin")
      return
    }

    // Combine date and time
    const endDateTime = new Date(`${campaign.endDate}T${campaign.endTime}`)
    if (endDateTime <= new Date()) {
      setError("La date de fin doit être dans le futur")
      return
    }

    setIsSubmitting(true)

    try {
      // Update all selected products
      const updates = campaign.productIds.map((productId) => ({
        id: productId,
        flash_sale_end_at: endDateTime.toISOString(),
        flash_sale_stock: campaign.stockAllocated || null,
      }))

      for (const update of updates) {
        const { error: updateError } = await supabase
          .from("ali-products")
          .update({
            flash_sale_end_at: update.flash_sale_end_at,
            flash_sale_stock: update.flash_sale_stock,
          })
          .eq("id", update.id)

        if (updateError) throw updateError
      }

      setSuccess(
        `Vente flash lancée pour ${campaign.productIds.length} produit(s) !`
      )
      setSelectedProducts(new Set())
      setCampaign({
        productIds: [],
        endDate: "",
        endTime: "",
        stockAllocated: null,
      })
      
      // Refresh products
      await fetchProducts()
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/products")
      }, 2000)
    } catch (err: any) {
      console.error("Error launching flash sale:", err)
      setError(err.message || "Erreur lors du lancement de la vente flash")
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeFlashSale = async (productId: string) => {
    if (!confirm("Voulez-vous vraiment arrêter cette vente flash ?")) {
      return
    }

    try {
      const { error } = await supabase
        .from("ali-products")
        .update({
          flash_sale_end_at: null,
          flash_sale_stock: null,
        })
        .eq("id", productId)

      if (error) throw error

      setSuccess("Vente flash arrêtée")
      await fetchProducts()
    } catch (err: any) {
      console.error("Error removing flash sale:", err)
      setError(err.message || "Erreur lors de l'arrêt de la vente flash")
    }
  }

  const activeFlashSales = products.filter(
    (p) => p.flash_sale_end_at && new Date(p.flash_sale_end_at) > new Date()
  )

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-fira-sans)]">
          Gestion Ventes Flash
        </h1>
        <Button onClick={() => router.push("/products")} variant="outline">
          Retour aux produits
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-xs text-green-600">
          {success}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Product Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-[var(--font-fira-sans)]">
              Sélectionner des Produits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Rechercher un produit</Label>
              <Input
                id="search"
                type="text"
                placeholder="Ex: AirPods, Écouteurs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 border rounded-md p-2">
              {filteredProducts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  Aucun produit trouvé
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {product.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {product.final_price_xof.toLocaleString()} FCFA
                        {product.compare_at_price && (
                          <span className="line-through ml-2 text-slate-400">
                            {product.compare_at_price.toLocaleString()} FCFA
                          </span>
                        )}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>

            {selectedProducts.size > 0 && (
              <p className="text-xs text-slate-600">
                {selectedProducts.size} produit(s) sélectionné(s)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Right: Campaign Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-[var(--font-fira-sans)]">
              Configurer la Vente Flash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={campaign.endDate}
                  onChange={(e) =>
                    setCampaign({ ...campaign, endDate: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Heure de fin *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={campaign.endTime}
                  onChange={(e) =>
                    setCampaign({ ...campaign, endTime: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockAllocated">
                  Stock alloué (optionnel)
                </Label>
                <Input
                  id="stockAllocated"
                  type="number"
                  min="1"
                  value={campaign.stockAllocated || ""}
                  onChange={(e) =>
                    setCampaign({
                      ...campaign,
                      stockAllocated: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  placeholder="Ex: 10 pièces"
                />
                <p className="text-xs text-slate-500">
                  Limite le nombre de pièces disponibles pour cette vente flash
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || campaign.productIds.length === 0}
                className="w-full"
              >
                {isSubmitting
                  ? "Lancement..."
                  : `Lancer la Flash Sale (${campaign.productIds.length} produit(s))`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Active Flash Sales */}
      {activeFlashSales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-[var(--font-fira-sans)]">
              Ventes Flash Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeFlashSales.map((product) => {
                const endDate = new Date(product.flash_sale_end_at!)
                const now = new Date()
                const hoursLeft = Math.max(
                  0,
                  Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60))
                )
                const minutesLeft = Math.max(
                  0,
                  Math.floor(
                    ((endDate.getTime() - now.getTime()) % (1000 * 60 * 60)) /
                      (1000 * 60)
                  )
                )

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex-1">
                      <p className="text-xs font-medium">{product.title}</p>
                      <p className="text-xs text-slate-500">
                        Se termine dans : {hoursLeft}h {minutesLeft}m
                      </p>
                      {product.flash_sale_stock && (
                        <p className="text-xs text-slate-500">
                          Stock flash : {product.flash_sale_stock} pièces
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFlashSale(product.id)}
                    >
                      Arrêter
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

