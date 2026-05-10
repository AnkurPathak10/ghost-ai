
import { cn } from "@/lib/utils"

export default function Home() {
  return (
    <div
      className={cn(
        "flex min-h-full flex-col items-center justify-center gap-2",
        "bg-base px-6 text-center text-copy-primary"
      )}
    >
      <h1 className="text-lg font-medium text-copy-secondary">Ghost AI</h1>
      <p className="max-w-sm text-sm text-copy-muted">
        Design system tokens and shadcn primitives are configured; use{" "}
        <code className="rounded bg-bg-subtle px-1 py-0.5 text-copy-faint">
          components/ui
        </code>{" "}
        and <code className="rounded bg-bg-subtle px-1 py-0.5 text-copy-faint">cn()</code>.
      </p>
    </div>
  )
}
