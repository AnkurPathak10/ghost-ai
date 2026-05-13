"use client"

import { LiveblocksError, LiveMap, LiveObject } from "@liveblocks/client"
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useErrorListener,
} from "@liveblocks/react/suspense"
import { Cursors, useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  SmoothStepEdge,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react"
import { Loader2 } from "lucide-react"
import {
  memo,
  useCallback,
  useState,
  type CSSProperties,
  type DragEvent,
  type ReactNode,
} from "react"

import {
  CANVAS_SHAPE_DRAG_MIME,
  DEFAULT_NEW_NODE_COLOR,
  nextCanvasShapeNodeId,
  parseShapeDragPayload,
} from "@/lib/canvas-shape-drag"
import { cn } from "@/lib/utils"
import {
  DEFAULT_NODE_FILL,
  EDGE_DEFAULT_STROKE,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas"

import { ShapePalette } from "@/components/editor/shape-palette"

import "@liveblocks/react-flow/styles.css"
import "@liveblocks/react-ui/styles.css"
import "@xyflow/react/dist/style.css"

/**
 * Minimal placeholder for `canvasNode` — shape/color styling ships in a later spec.
 * Handles match the four-sided connection model from `context/ui-context.md`.
 */
function CanvasNodePlaceholder(props: NodeProps<CanvasNode>) {
  const shape: NodeShape = props.data.shape ?? "rectangle"
  const handleClass =
    "!size-2 !border !border-white !bg-white opacity-0 transition-opacity group-hover:opacity-100"
  const width = props.width
  const height = props.height

  return (
    <div
      data-shape={shape}
      className={cn(
        "group relative box-border flex min-h-16 min-w-[128px] items-center justify-center rounded-lg border border-surface-border px-3 py-2 text-center text-sm shadow-sm",
        "bg-[color:var(--canvas-node-fill)] text-copy-primary"
      )}
      style={
        {
          "--canvas-node-fill": props.data.color || DEFAULT_NODE_FILL,
          ...(width !== undefined ? { width } : null),
          ...(height !== undefined ? { height } : null),
        } as CSSProperties
      }
    >
      <Handle
        type="target"
        position={Position.Left}
        className={handleClass}
      />
      <Handle
        type="target"
        position={Position.Top}
        className={handleClass}
      />
      <span className="w-full truncate">{props.data.label || "\u00a0"}</span>
      <Handle
        type="source"
        position={Position.Right}
        className={handleClass}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={handleClass}
      />
    </div>
  )
}

const nodeTypes = { canvasNode: memo(CanvasNodePlaceholder) }
const edgeTypes = { canvasEdge: SmoothStepEdge }

function CollaborativeFlowCanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  const { screenToFlowPosition } = useReactFlow()

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData(CANVAS_SHAPE_DRAG_MIME)
      const payload = parseShapeDragPayload(raw)
      if (!payload) return

      const { width, height } = payload
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const position = {
        x: p.x - width / 2,
        y: p.y - height / 2,
      }

      const newNode: CanvasNode = {
        id: nextCanvasShapeNodeId(payload.shape),
        type: "canvasNode",
        position,
        width,
        height,
        data: {
          label: "",
          color: DEFAULT_NEW_NODE_COLOR,
          shape: payload.shape,
        },
      }

      onNodesChange([{ type: "add", item: newNode }])
    },
    [onNodesChange, screenToFlowPosition]
  )

  return (
    <div className="relative size-full">
      <ReactFlow
        colorMode="dark"
        className="bg-base"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: "canvasEdge",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: EDGE_DEFAULT_STROKE,
          },
          style: { stroke: EDGE_DEFAULT_STROKE },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--color-border-default)"
        />
        <MiniMap
          className="rounded-xl! border! border-surface-border!"
          bgColor="var(--color-bg-subtle)"
          maskColor="color-mix(in srgb, var(--color-bg-base) 72%, transparent)"
          maskStrokeColor="var(--color-border-default)"
          maskStrokeWidth={1}
          nodeColor="var(--color-bg-elevated)"
          nodeStrokeColor="var(--color-border-subtle)"
        />
        <Cursors />
      </ReactFlow>
      <ShapePalette />
    </div>
  )
}

function CollaborativeFlowCanvas() {
  return (
    <ReactFlowProvider>
      <CollaborativeFlowCanvasInner />
    </ReactFlowProvider>
  )
}

function CanvasLoadingFallback() {
  return (
    <div
      className="flex size-full flex-col items-center justify-center gap-3 bg-base text-copy-muted"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-6 animate-spin text-brand" aria-hidden />
      <p className="text-sm">Loading canvas…</p>
    </div>
  )
}

function LiveblocksRoomShell({ children }: { children: ReactNode }) {
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useErrorListener(
    useCallback((error) => {
      const message =
        error instanceof LiveblocksError
          ? error.message
          : "Could not connect to collaboration."
      setConnectionError(message)
    }, [])
  )

  if (connectionError !== null) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 bg-base px-6 text-center">
        <p className="text-sm font-medium text-copy-primary">
          Liveblocks connection error
        </p>
        <p className="max-w-sm text-xs text-copy-muted">{connectionError}</p>
      </div>
    )
  }

  return children
}

export function CollaborativeCanvas({ roomId }: { roomId: string }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isThinking: false }}
        initialStorage={() => ({
          flow: new LiveObject({
            nodes: new LiveMap(),
            edges: new LiveMap(),
          }),
        })}
      >
        <div className="size-full min-h-[calc(100vh-3.5rem)]">
          <LiveblocksRoomShell>
            <ClientSideSuspense fallback={<CanvasLoadingFallback />}>
              <CollaborativeFlowCanvas />
            </ClientSideSuspense>
          </LiveblocksRoomShell>
        </div>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
