"use client"

import { cn } from "@/lib/utils"

export interface MobileSidebarScrimProps {
  isVisible: boolean
  onClose: () => void
  className?: string
}

/**
 * Mobile-only backdrop: tap outside the sidebar closes it (feature 04).
 * Hidden from `md` and up so desktop behavior stays unchanged.
 */
export function MobileSidebarScrim({
  isVisible,
  onClose,
  className,
}: MobileSidebarScrimProps) {
  return (
    <button
      type="button"
      aria-label="Close project sidebar"
      className={cn(
        "fixed inset-x-0 top-14 bottom-0 z-25 cursor-default border-0 bg-base/75 backdrop-blur-[2px] transition-opacity md:hidden",
        isVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        className
      )}
      onClick={onClose}
    />
  )
}
