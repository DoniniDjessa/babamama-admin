"use client"

import * as React from "react"
import PhoneInputWithCountry from "react-phone-number-input"
import { cn } from "@/lib/utils"
import "react-phone-number-input/style.css"

interface PhoneInputProps {
  value?: string
  onChange?: (value: string | undefined) => void
  className?: string
  name?: string
  error?: boolean
}

export function PhoneInput({ value, onChange, className, name, error }: PhoneInputProps) {
  return (
    <div className={cn("relative", className)}>
      <PhoneInputWithCountry
        value={value}
        onChange={onChange}
        name={name}
        defaultCountry="SN"
        international
        withCountryCallingCode
        className={cn(
          "PhoneInput",
          error && "PhoneInput--error"
        )}
        numberInputProps={{
          className: cn(
            "PhoneInputInput",
            error && "border-red-500 focus-visible:ring-red-500"
          )
        }}
      />
    </div>
  )
}

