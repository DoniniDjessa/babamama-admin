import { useState, useEffect } from "react"

export type GlobalSettings = {
  exchange_rate: number // Ex: 90
  shipping_per_kg: number // Ex: 9000
  customs_percent: number // Ex: 10
  margin_percent: number // Ex: 25
}

export type PriceCalculationResult = {
  finalPrice: number
  details: {
    purchaseCost: number
    transportCost: number
    landedCost: number
    customsAmount: number
    marginAmount: number
  }
}

// Fonction de calcul PURE
export const calculateFinalPrice = (
  priceYuan: number,
  weightKg: number,
  settings: GlobalSettings
): PriceCalculationResult => {
  // 1. Conversion Achat en CFA
  const purchaseCost = priceYuan * settings.exchange_rate

  // 2. Coût Transport
  const transportCost = weightKg * settings.shipping_per_kg

  // 3. Coût Débarqué (Landed Cost)
  const landedCost = purchaseCost + transportCost

  // 4. Application Douane
  const customsAmount = landedCost * (settings.customs_percent / 100)
  const withCustoms = landedCost + customsAmount

  // 5. Application Marge
  const sellingPriceRaw = withCustoms * (1 + (settings.margin_percent / 100))
  const marginAmount = sellingPriceRaw - withCustoms

  // 6. Règle d'Arrondi "Joli Prix" (Arrondi au 50 ou 100 supérieur)
  // Ex: 14320 -> 14350. 14370 -> 14400.
  const finalPrice = Math.ceil(sellingPriceRaw / 50) * 50

  return {
    finalPrice,
    details: {
      purchaseCost,
      transportCost,
      landedCost,
      customsAmount,
      marginAmount: finalPrice - withCustoms,
    },
  }
}

// Hook pour utiliser le calculateur avec les settings depuis Supabase
export function usePriceCalculator(
  priceYuan: number | null,
  weightKg: number | null,
  settings: GlobalSettings | null
) {
  const [result, setResult] = useState<PriceCalculationResult | null>(null)

  useEffect(() => {
    if (
      priceYuan !== null &&
      priceYuan > 0 &&
      weightKg !== null &&
      weightKg > 0 &&
      settings
    ) {
      const calculation = calculateFinalPrice(priceYuan, weightKg, settings)
      setResult(calculation)
    } else {
      setResult(null)
    }
  }, [priceYuan, weightKg, settings])

  return result
}

