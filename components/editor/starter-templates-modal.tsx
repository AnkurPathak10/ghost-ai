"use client"

import { Import } from "lucide-react"
import { useCallback, useMemo } from "react"

import { CanvasNodeSurface } from "@/components/editor/canvas-node-surface"
import { useCanvasTemplateImport } from "@/components/editor/canvas-template-import-context"
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates"
import { useEditorWorkspace } from "@/components/editor/editor-workspace-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  EDGE_DEFAULT_STROKE,
  resolveNodeColorPair,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas"
import { cn } from "@/lib/utils"

function diagramBounds(nodes: CanvasNode[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const n of nodes) {
    const w = n.width ?? 128
    const h = n.height ?? 64
    minX = Math.min(minX, n.position.x)
    minY = Math.min(minY, n.position.y)
    maxX = Math.max(maxX, n.position.x + w)
    maxY = Math.max(maxY, n.position.y + h)
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, w: 1, h: 1 }
  }
  return { minX, minY, w: maxX - minX, h: maxY - minY }
}

function nodeCenterAbs(n: CanvasNode) {
  const w = n.width ?? 128
  const h = n.height ?? 64
  return { x: n.position.x + w / 2, y: n.position.y + h / 2 }
}

function TemplateDiagramPreview({ template }: { template: CanvasTemplate }) {
  const nodeById = useMemo(() => {
    const m = new Map<string, CanvasNode>()
    for (const n of template.nodes) m.set(n.id, n)
    return m
  }, [template.nodes])

  const { minX, minY, w, h } = useMemo(
    () => diagramBounds(template.nodes),
    [template.nodes]
  )

  const pad = 28
  const vbX = minX - pad
  const vbY = minY - pad
  const vbW = Math.max(w + pad * 2, 1)
  const vbH = Math.max(h + pad * 2, 1)
  const edgeStroke = Math.max(3.5, Math.max(vbW, vbH) * 0.004)

  return (
    <div className="relative h-40 w-full overflow-hidden rounded-lg border border-surface-border/60 bg-bg-subtle">
      <svg
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className="pointer-events-none block h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
      >
        <g opacity={0.88}>
          {template.edges.map((e: CanvasEdge) => {
            const s = nodeById.get(e.source)
            const t = nodeById.get(e.target)
            if (!s || !t) return null
            const p0 = nodeCenterAbs(s)
            const p1 = nodeCenterAbs(t)
            return (
              <line
                key={e.id}
                x1={p0.x}
                y1={p0.y}
                x2={p1.x}
                y2={p1.y}
                stroke={EDGE_DEFAULT_STROKE}
                strokeWidth={edgeStroke}
                strokeLinecap="round"
              />
            )
          })}
        </g>
        {template.nodes.map((n) => {
          const nw = n.width ?? 128
          const nh = n.height ?? 64
          const { fill } = resolveNodeColorPair(n.data)
          return (
            <foreignObject
              key={n.id}
              x={n.position.x}
              y={n.position.y}
              width={nw}
              height={nh}
              className="overflow-visible"
            >
              <div
                className="flex size-full min-h-0 min-w-0 overflow-hidden"
                {...({
                  xmlns: "http://www.w3.org/1999/xhtml",
                } as object)}
              >
                <CanvasNodeSurface
                  shape={n.data.shape}
                  width={nw}
                  height={nh}
                  fill={fill}
                  selected={false}
                />
              </div>
            </foreignObject>
          )
        })}
      </svg>
    </div>
  )
}

function TemplateCard({
  template,
  onImport,
}: {
  template: CanvasTemplate
  onImport: (t: CanvasTemplate) => void
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-surface-border bg-elevated/90 p-4 shadow-sm",
        "transition-[box-shadow,background-color,border-color]",
        "hover:border-surface-border hover:bg-elevated"
      )}
    >
      <TemplateDiagramPreview template={template} />
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="truncate text-sm font-semibold text-copy-primary">
          {template.name}
        </h3>
        <p className="line-clamp-3 text-xs leading-snug text-copy-muted">
          {template.description}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "w-full shrink-0 gap-2 border-white/30 bg-transparent text-foreground",
          "hover:bg-white/5 dark:border-white/25 dark:hover:bg-white/10"
        )}
        onClick={() => onImport(template)}
      >
        <Import className="size-4" aria-hidden />
        Import
      </Button>
    </div>
  )
}

export function StarterTemplatesModal() {
  const {
    starterTemplatesDialogOpen,
    setStarterTemplatesDialogOpen,
  } = useEditorWorkspace()
  const { importTemplate } = useCanvasTemplateImport()

  const handleImport = useCallback(
    (template: CanvasTemplate) => {
      importTemplate(template)
      setStarterTemplatesDialogOpen(false)
    },
    [importTemplate, setStarterTemplatesDialogOpen]
  )

  return (
    <Dialog
      open={starterTemplatesDialogOpen}
      onOpenChange={setStarterTemplatesDialogOpen}
    >
      <DialogContent className="max-h-[min(90vh,720px)] gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-surface-border px-6 py-4 text-left">
          <DialogTitle>Import template</DialogTitle>
          <DialogDescription>
            Choose a starter template to pre-populate your canvas. Any existing
            nodes will be replaced — use Ctrl+Z or ⌘Z to undo.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[min(70vh,560px)] px-6 py-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CANVAS_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onImport={handleImport}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
