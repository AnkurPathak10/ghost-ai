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
  ConnectionLineType,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import { Loader2 } from "lucide-react"
import { useCallback, useEffect, useState, type DragEvent, type ReactNode } from "react"

import { useCanvasTemplateImport } from "@/components/editor/canvas-template-import-context"

import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { MemoCanvasFlowEdge } from "@/components/editor/canvas-flow-edge"
import { MemoCanvasFlowNode } from "@/components/editor/canvas-flow-node"
import { CanvasViewportControls } from "@/components/editor/canvas-viewport-controls"
import { ShapePalette } from "@/components/editor/shape-palette"
import {
  CANVAS_SHAPE_DRAG_MIME,
  DEFAULT_NEW_NODE_COLOR,
  nextCanvasShapeNodeId,
  parseShapeDragPayload,
} from "@/lib/canvas-shape-drag"
import {
  DEFAULT_NODE_LABEL,
  EDGE_DEFAULT_STROKE,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas"

import "@liveblocks/react-flow/styles.css"
import "@liveblocks/react-ui/styles.css"
import "@xyflow/react/dist/style.css"

const nodeTypes = { canvasNode: MemoCanvasFlowNode }
const edgeTypes = { canvasEdge: MemoCanvasFlowEdge }

function CollaborativeFlowCanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  const { screenToFlowPosition, fitView } = useReactFlow<CanvasNode, CanvasEdge>()
  const { setImportHandler } = useCanvasTemplateImport()

  const importStarterTemplate = useCallback(
    (template: CanvasTemplate) => {
      if (edges.length > 0) {
        onEdgesChange(edges.map((e) => ({ type: "remove", id: e.id })))
      }
      if (nodes.length > 0) {
        onNodesChange(nodes.map((n) => ({ type: "remove", id: n.id })))
      }
      if (template.nodes.length > 0) {
        onNodesChange(
          template.nodes.map((item) => ({
            type: "add" as const,
            item: structuredClone(item),
          }))
        )
      }
      if (template.edges.length > 0) {
        onEdgesChange(
          template.edges.map((item) => ({
            type: "add" as const,
            item: structuredClone(item),
          }))
        )
      }
      window.setTimeout(() => {
        void fitView({ padding: 0.2, duration: 320 })
      }, 0)
    },
    [edges, nodes, onEdgesChange, onNodesChange, fitView]
  )

  useEffect(() => {
    setImportHandler(importStarterTemplate)
    return () => setImportHandler(null)
  }, [importStarterTemplate, setImportHandler])

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
          labelColor: DEFAULT_NODE_LABEL,
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
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{
          stroke: EDGE_DEFAULT_STROKE,
          strokeWidth: 1.5,
          strokeLinecap: "round",
          opacity: 0.52,
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: "canvasEdge",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: EDGE_DEFAULT_STROKE,
            width: 20,
            height: 20,
          },
          style: {
            stroke: EDGE_DEFAULT_STROKE,
            strokeWidth: 1.5,
            strokeLinecap: "round",
            strokeLinejoin: "round",
          },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--color-border-default)"
        />
        <Cursors />
      </ReactFlow>
      <CanvasViewportControls />
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
