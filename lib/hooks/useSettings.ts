import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { GlobalSettings } from "./usePriceCalculator"

export function useSettings() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("ali-settings")
          .select("*")
          .single()

        if (fetchError) {
          setError(fetchError.message)
          // Use default values if settings don't exist
          setSettings({
            exchange_rate: 90.0,
            shipping_per_kg: 9000,
            customs_percent: 10,
            margin_percent: 25,
          })
        } else if (data) {
          setSettings({
            exchange_rate: data.exchange_rate_yuan_xof,
            shipping_per_kg: data.shipping_price_per_kg,
            customs_percent: data.customs_percentage,
            margin_percent: data.margin_percentage,
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings")
        // Use default values on error
        setSettings({
          exchange_rate: 90.0,
          shipping_per_kg: 9000,
          customs_percent: 10,
          margin_percent: 25,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [supabase])

  return { settings, loading, error }
}

