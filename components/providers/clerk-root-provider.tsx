"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/ui/themes"
import type { ReactNode } from "react"

/**
 * Clerk dark theme expects `colorNeutral` to be a *light* value (see Variables.colorNeutral
 * in @clerk/ui). We had mistakenly set it to `--muted` (#1e1e23), which made text on
 * buttons and menus resolve to near-black on dark surfaces.
 */
export function ClerkRootProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        ...dark,
        variables: {
          ...dark.variables,
          colorPrimary: "var(--primary)",
          colorPrimaryForeground: "var(--primary-foreground)",
          colorBackground: "var(--background)",
          colorForeground: "var(--foreground)",
          colorMuted: "var(--muted)",
          colorMutedForeground: "var(--muted-foreground)",
          colorInput: "var(--card)",
          colorInputForeground: "var(--foreground)",
          colorNeutral: "var(--foreground)",
          colorDanger: "var(--destructive)",
          colorBorder: "var(--border)",
          colorRing: "var(--ring)",
          borderRadius: "var(--radius-lg)",
          fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
          fontFamilyButtons:
            "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
        },
        elements: {
          socialButtonsBlockButton: {
            color: "var(--foreground)",
          },
          socialButtonsBlockButtonText: {
            color: "var(--foreground)",
          },
          socialButtonsIconButton: {
            color: "var(--foreground)",
          },
          socialButtons: {
            color: "var(--foreground)",
          },
          userButtonPopoverActionButton: {
            color: "var(--foreground)",
          },
          userButtonPopoverActionButtonIcon: {
            color: "var(--foreground)",
          },
          userButtonPopoverActionButtonIconBox: {
            color: "var(--foreground)",
          },
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
