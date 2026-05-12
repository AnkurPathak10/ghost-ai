import Link from "next/link"
import { Lock } from "lucide-react"

import { cn } from "@/lib/utils"

export function AccessDenied() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full items-center justify-center bg-base px-4 py-10 sm:px-6">
      <div
        role="alert"
        className="w-full max-w-md rounded-3xl border border-surface-border bg-surface px-8 py-10 shadow-lg sm:px-12 sm:py-12"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-xl border border-surface-border bg-base shadow-inner">
            <Lock
              className="size-7 text-copy-primary"
              strokeWidth={1.65}
              aria-hidden
            />
          </div>
          <h1 className="mt-8 text-xl font-semibold tracking-tight text-copy-primary">
            You don&apos;t have access to this workspace.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-copy-muted">
            Head back to your editor home to open a project you can access.
          </p>
          <Link
            href="/editor"
            className={cn(
              "mt-10 inline-flex min-h-11 items-center justify-center px-10 font-semibold leading-snug tracking-tight rounded-full bg-brand text-(--color-base) transition-colors",
              "hover:bg-brand/90 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 outline-none",
              "text-[1rem]"
            )}
          >
            Back to Editor
          </Link>
        </div>
      </div>
    </div>
  )
}
