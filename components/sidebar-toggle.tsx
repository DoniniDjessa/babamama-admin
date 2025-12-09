"use client"

import { Button } from "@/components/ui/button"

interface SidebarToggleProps {
  onClick: () => void
}

export function SidebarToggle({ onClick }: SidebarToggleProps) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className="p-2"
      aria-label="Toggle sidebar"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </Button>
  )
}

