"use client"

import {
  Handle,
  NodeResizer,
  NodeToolbar,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react"
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react"

import { NodeColorSwatches } from "@/components/editor/node-color-swatches"
import { CanvasNodeSurface } from "@/components/editor/canvas-node-surface"
import { cn } from "@/lib/utils"
import {
  DEFAULT_NODE_FILL,
  DEFAULT_NODE_LABEL,
  resolveNodeColorPair,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas"

const MIN_NODE_W = 96
const MIN_NODE_H = 48
const LABEL_PLACEHOLDER = "Add label…"

const SIDES = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
] as const

const HANDLE_DOT_CLASS = cn(
  "nodrag nopan !z-10 !flex !size-2 !min-h-0 !min-w-0 !items-center !justify-center",
  "!rounded-full !border !border-solid !border-neutral-950/90 !bg-white !shadow-none",
  "opacity-0 transition-opacity duration-150 group-hover:opacity-100"
)

function CanvasFlowNode(props: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>()
  const data = props.data ?? {
    label: "",
    color: DEFAULT_NODE_FILL,
    labelColor: DEFAULT_NODE_LABEL,
    shape: "rectangle" as const,
  }
  const shape: NodeShape = data.shape ?? "rectangle"
  const width = props.width ?? 128
  const height = props.height ?? 64
  const selected = Boolean(props.selected)

  const { fill: nodeFill, label: textColor } = resolveNodeColorPair(data)

  const [editing, setEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState(data.label ?? "")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (!editing) return
    const id = requestAnimationFrame(() => {
      const el = textareaRef.current
      if (el) {
        el.focus()
        const len = el.value.length
        el.setSelectionRange(len, len)
      }
    })
    return () => cancelAnimationFrame(id)
  }, [editing])

  const openEdit = useCallback(
    (e: ReactMouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      setDraftLabel(data.label ?? "")
      setEditing(true)
    },
    [data.label]
  )

  const patchLabel = useCallback(
    (label: string) => {
      setDraftLabel(label)
      updateNodeData(props.id, { label })
    },
    [props.id, updateNodeData]
  )

  const closeEdit = useCallback(() => {
    setEditing(false)
  }, [])

  return (
    <>
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        offset={14}
        align="center"
        className="nodrag nopan !border-0 !bg-transparent !p-0 !shadow-none"
      >
        <NodeColorSwatches nodeId={props.id} activeFill={nodeFill} />
      </NodeToolbar>
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_W}
        minHeight={MIN_NODE_H}
        autoScale
        handleClassName={cn(
          "!size-2 !min-h-0 !min-w-0 !rounded-sm !border !border-surface-border",
          "!bg-elevated/95 !shadow-sm"
        )}
        lineClassName="!border-surface-border/50"
        color="var(--color-border-subtle)"
      />
      <div
        data-shape={shape}
        className={cn(
          "group relative box-border flex min-h-0 min-w-0 items-center justify-center",
          "text-center text-sm"
        )}
        style={{ width, height }}
      >
        <CanvasNodeSurface
          shape={shape}
          width={width}
          height={height}
          fill={nodeFill}
          selected={selected}
          className="pointer-events-none absolute left-0 top-0"
        />
        {SIDES.map((position) => (
          <Handle
            key={position}
            id={`ghost-${position}`}
            type="source"
            position={position}
            className={HANDLE_DOT_CLASS}
          />
        ))}
        {!editing ? (
          <div
            className="relative z-[1] flex h-full w-full cursor-text items-center justify-center px-3"
            onDoubleClick={openEdit}
          >
            {data.label ? (
              <span
                className="line-clamp-4 w-full whitespace-pre-wrap wrap-break-word"
                style={{ color: textColor }}
              >
                {data.label}
              </span>
            ) : (
              <span
                className="opacity-[0.42]"
                style={{ color: textColor }}
              >
                {LABEL_PLACEHOLDER}
              </span>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "nodrag nopan absolute inset-3 z-[2] flex min-h-0 items-center justify-center px-0"
            )}
          >
            <textarea
              ref={textareaRef}
              value={draftLabel}
              onChange={(e) => patchLabel(e.target.value)}
              onBlur={closeEdit}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation()
                  e.preventDefault()
                  closeEdit()
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className={cn(
                "max-h-full min-h-0 min-w-0 w-full resize-none overflow-y-auto bg-transparent text-center text-sm leading-snug outline-none focus:ring-0 [field-sizing:content]"
              )}
              style={{ color: textColor }}
              rows={1}
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </>
  )
}

export const MemoCanvasFlowNode = memo(CanvasFlowNode)
