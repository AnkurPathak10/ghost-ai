"use client"

import type { ReactNode } from "react"
import { FileText, Sparkles, Users } from "lucide-react"

import { cn } from "@/lib/utils"

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI architecture generation",
    description:
      "Describe your system; AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Users,
    title: "Real-time collaboration",
    description:
      "Live cursors, presence, and shared editing so your team stays in sync.",
  },
  {
    icon: FileText,
    title: "Instant spec generation",
    description:
      "Export a Markdown technical spec directly from the canvas graph.",
  },
] as const

export function AuthPageShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid min-h-full grid-cols-1 bg-base lg:min-h-screen lg:grid-cols-2",
        className
      )}
    >
      {/* Left: elevated surface + subtle brand tint vs pure base on the right */}
      <aside
        className={cn(
          "relative hidden flex-col border-surface-border bg-surface lg:flex",
          "border-r",
          "before:pointer-events-none before:absolute before:inset-0",
          "before:bg-[linear-gradient(160deg,var(--color-accent-primary)_0%,transparent_55%)]",
          "before:opacity-[0.07]"
        )}
      >
        <div className="relative z-10 flex h-full min-h-screen flex-col px-8 py-10 sm:px-10 lg:px-12 xl:pl-16 xl:pr-14">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand/15 ring-1 ring-brand/25"
              aria-hidden
            >
              <span className="h-3.5 w-3.5 rounded-sm bg-brand ring-2 ring-brand/40" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-copy-primary">
              Ghost AI
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center py-12">
            <h1 className="max-w-xl text-balance text-3xl font-semibold leading-tight tracking-tight text-copy-primary sm:text-4xl">
              Design systems at the speed of thought.
            </h1>
            <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-copy-secondary">
              Describe your architecture in plain English. Ghost AI maps it to a
              shared canvas your whole team can refine in real time.
            </p>

            <ul className="mt-10 flex max-w-lg flex-col gap-6">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-dim text-brand">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-copy-primary">
                      {title}
                    </p>
                    <p className="text-sm leading-relaxed text-copy-secondary">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-copy-faint">
            © {new Date().getFullYear()} Ghost AI. All rights reserved.
          </p>
        </div>
      </aside>

      {/* Right: deepest background — Clerk card reads as the elevated panel */}
      <section
        className={cn(
          "flex flex-col items-center justify-center",
          "bg-base px-4 py-10 sm:px-6 lg:py-12"
        )}
      >
        <div className="w-full max-w-[26rem]">{children}</div>
      </section>
    </div>
  )
}
