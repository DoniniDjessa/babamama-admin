"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SidebarToggle } from "@/components/sidebar-toggle"
import { Sidebar } from "@/components/sidebar"
import { useSettings } from "@/lib/hooks/useSettings"

export function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { settings } = useSettings()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // Don't show navbar on login page
  if (pathname?.startsWith("/login") || pathname?.startsWith("/auth")) {
    return null
  }

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarToggle onClick={() => setSidebarOpen(true)} />
              <h1 className="text-sm font-bold font-[var(--font-fira-sans)]">
                BabaMama Admin
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTools(!showTools)}
                className="text-xs"
              >
                {showTools ? "Masquer" : "Outils"}
              </Button>
              <div className="text-xs text-slate-600">
                {user?.user_metadata?.full_name || user?.email}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-xs"
              >
                Déconnexion
              </Button>
            </div>
          </div>

          {/* Tools Panel */}
          {showTools && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <ToolsPanel settings={settings} />
            </div>
          )}
        </div>
      </nav>
    </>
  )
}

function ToolsPanel({ settings }: { settings: any }) {
  const [calculatorValue, setCalculatorValue] = useState("")
  const [grams, setGrams] = useState("")
  const [kilograms, setKilograms] = useState("")
  const [yuan, setYuan] = useState("")
  const [cfa, setCfa] = useState("")

  // Gram to KG converter
  useEffect(() => {
    if (grams) {
      const kg = parseFloat(grams) / 1000
      setKilograms(kg.toFixed(3))
    } else {
      setKilograms("")
    }
  }, [grams])

  useEffect(() => {
    if (kilograms) {
      const g = parseFloat(kilograms) * 1000
      setGrams(g.toFixed(0))
    } else {
      setGrams("")
    }
  }, [kilograms])

  // Yuan to CFA converter
  useEffect(() => {
    if (yuan && settings?.exchange_rate) {
      const cfaValue = parseFloat(yuan) * settings.exchange_rate
      setCfa(cfaValue.toFixed(0))
    } else if (!yuan) {
      setCfa("")
    }
  }, [yuan, settings])

  useEffect(() => {
    if (cfa && settings?.exchange_rate) {
      const yuanValue = parseFloat(cfa) / settings.exchange_rate
      setYuan(yuanValue.toFixed(2))
    } else if (!cfa) {
      setYuan("")
    }
  }, [cfa, settings])

  const handleCalculatorInput = (value: string) => {
    if (value === "C") {
      setCalculatorValue("")
    } else if (value === "=") {
      try {
        const result = eval(calculatorValue)
        setCalculatorValue(String(result))
      } catch {
        setCalculatorValue("Error")
      }
    } else {
      setCalculatorValue((prev) => prev + value)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Calculator */}
      <div className="space-y-2">
        <label className="text-xs font-semibold">Calculatrice</label>
        <div className="bg-slate-50 rounded-md p-2 space-y-2">
          <input
            type="text"
            value={calculatorValue}
            readOnly
            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-right"
            placeholder="0"
          />
          <div className="grid grid-cols-4 gap-1">
            {["C", "/", "*", "-"].map((op) => (
              <button
                key={op}
                onClick={() => handleCalculatorInput(op)}
                className="bg-slate-200 hover:bg-slate-300 rounded px-2 py-1 text-xs"
              >
                {op}
              </button>
            ))}
            {["7", "8", "9", "+"].map((num) => (
              <button
                key={num}
                onClick={() => handleCalculatorInput(num)}
                className="bg-slate-200 hover:bg-slate-300 rounded px-2 py-1 text-xs"
              >
                {num}
              </button>
            ))}
            {["4", "5", "6"].map((num) => (
              <button
                key={num}
                onClick={() => handleCalculatorInput(num)}
                className="bg-slate-200 hover:bg-slate-300 rounded px-2 py-1 text-xs"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleCalculatorInput("=")}
              className="bg-indigo-600 text-white hover:bg-indigo-700 rounded px-2 py-1 text-xs row-span-2"
            >
              =
            </button>
            {["1", "2", "3"].map((num) => (
              <button
                key={num}
                onClick={() => handleCalculatorInput(num)}
                className="bg-slate-200 hover:bg-slate-300 rounded px-2 py-1 text-xs"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleCalculatorInput("0")}
              className="bg-slate-200 hover:bg-slate-300 rounded px-2 py-1 text-xs col-span-2"
            >
              0
            </button>
            <button
              onClick={() => handleCalculatorInput(".")}
              className="bg-slate-200 hover:bg-slate-300 rounded px-2 py-1 text-xs"
            >
              .
            </button>
          </div>
        </div>
      </div>

      {/* Gram to KG Converter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold">Grammes ↔ Kilogrammes</label>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-600">Grammes</label>
            <input
              type="number"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
            />
          </div>
          <div className="text-center text-xs text-slate-400">⇄</div>
          <div>
            <label className="text-xs text-slate-600">Kilogrammes</label>
            <input
              type="number"
              value={kilograms}
              onChange={(e) => setKilograms(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Yuan to CFA Converter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold">
          Yuan ↔ FCFA {settings?.exchange_rate ? `(Taux: ${settings.exchange_rate})` : "(Chargement...)"}
        </label>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-600">Yuan</label>
            <input
              type="number"
              value={yuan}
              onChange={(e) => setYuan(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
            />
          </div>
          <div className="text-center text-xs text-slate-400">⇄</div>
          <div>
            <label className="text-xs text-slate-600">FCFA</label>
            <input
              type="number"
              value={cfa}
              onChange={(e) => setCfa(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

