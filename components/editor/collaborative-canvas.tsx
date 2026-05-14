"use client"

import {
  ClientSideSuspense,
  useRoom,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStoreApi,
} from "@xyflow/react"
import { Loader2 } from "lucide-react"

import { CanvasPeerCursors } from "@/components/editor/canvas-peer-cursors"
import { CanvasPresenceBar } from "@/components/editor/canvas-presence-bar"

import { MemoCanvasFlowEdge } from "@/components/editor/canvas-flow-edge"
import { MemoCanvasFlowNode } from "@/components/editor/canvas-flow-node"
import { CanvasViewportControls } from "@/components/editor/canvas-viewport-controls"
import { ShapePalette } from "@/components/editor/shape-palette"
import { useCanvasTemplateImport } from "@/components/editor/canvas-template-import-context"
import { useEditorWorkspace } from "@/components/editor/editor-workspace-provider"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import {
  CANVAS_SHAPE_DRAG_MIME,
  DEFAULT_NEW_NODE_COLOR,
  nextCanvasShapeNodeId,
  parseShapeDragPayload,
} from "@/lib/canvas-shape-drag"
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave"
import { useCanvasDeleteShortcut } from "@/hooks/useKeyboardShortcuts"
import {
  DEFAULT_NODE_LABEL,
  EDGE_DEFAULT_STROKE,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas"

import "@liveblocks/react-ui/styles.css"
import "@xyflow/react/dist/style.css"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  startTransition,
  type DragEvent,
  type MouseEvent,
} from "react"

const nodeTypes = { canvasNode: MemoCanvasFlowNode }
const edgeTypes = { canvasEdge: MemoCanvasFlowEdge }

function CollaborativeFlowCanvasInner({ projectId }: { projectId: string }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>()
  const { screenToFlowPosition, fitView } = reactFlow
  const reactFlowStore = useStoreApi()
  const updateMyPresence = useUpdateMyPresence()
  const { setImportHandler } = useCanvasTemplateImport()
  const { setCanvasSaveStatus } = useEditorWorkspace()

  const [persistReady, setPersistReady] = useState(false)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const hydrationDoneRef = useRef(false)

  useLayoutEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
  }, [nodes, edges])

  useEffect(() => {
    if (hydrationDoneRef.current) {
      startTransition(() => {
        setPersistReady(true)
      })
      return
    }

    if (nodes.length > 0 || edges.length > 0) {
      hydrationDoneRef.current = true
      startTransition(() => {
        setPersistReady(true)
      })
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`)
        if (cancelled) {
          return
        }
        if (nodesRef.current.length > 0 || edgesRef.current.length > 0) {
          hydrationDoneRef.current = true
          startTransition(() => {
            setPersistReady(true)
          })
          return
        }
        if (!res.ok) {
          hydrationDoneRef.current = true
          startTransition(() => {
            setPersistReady(true)
          })
          return
        }
        const data = (await res.json()) as {
          nodes?: CanvasNode[]
          edges?: CanvasEdge[]
        }
        if (cancelled) {
          return
        }
        if (nodesRef.current.length > 0 || edgesRef.current.length > 0) {
          hydrationDoneRef.current = true
          startTransition(() => {
            setPersistReady(true)
          })
          return
        }
        const n = data.nodes ?? []
        const e = data.edges ?? []
        if (n.length === 0 && e.length === 0) {
          hydrationDoneRef.current = true
          startTransition(() => {
            setPersistReady(true)
          })
          return
        }
        if (n.length > 0) {
          onNodesChange(
            n.map((item) => ({
              type: "add" as const,
              item: structuredClone(item),
            }))
          )
        }
        if (e.length > 0) {
          onEdgesChange(
            e.map((item) => ({
              type: "add" as const,
              item: structuredClone(item),
            }))
          )
        }
        hydrationDoneRef.current = true
        window.setTimeout(() => {
          void fitView({ padding: 0.2, duration: 320 })
        }, 0)
      } finally {
        if (!cancelled) {
          startTransition(() => {
            setPersistReady(true)
          })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    projectId,
    nodes.length,
    edges.length,
    fitView,
    onEdgesChange,
    onNodesChange,
  ])

  useCanvasAutosave({
    projectId,
    nodes,
    edges,
    debounceMs: 2000,
    enabled: persistReady,
    onStatusChange: setCanvasSaveStatus,
  })

  const deleteSelection = useCallback(() => {
    const selectedNodes = reactFlow.getNodes().filter((n) => n.selected)
    const selectedEdges = reactFlow.getEdges().filter((e) => e.selected)
    if (selectedNodes.length === 0 && selectedEdges.length === 0) {
      return
    }
    void reactFlow.deleteElements({
      nodes: selectedNodes.map((n) => ({ id: n.id })),
      edges: selectedEdges.map((e) => ({ id: e.id })),
    })
  }, [reactFlow])

  useCanvasDeleteShortcut(deleteSelection)

  const onCanvasMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (reactFlowStore.getState().paneDragging) return
      updateMyPresence({
        cursor: screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      })
    },
    [reactFlowStore, screenToFlowPosition, updateMyPresence]
  )

  const onCanvasMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  useEffect(() => {
    const onBlur = () => {
      updateMyPresence({ cursor: null })
    }
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("blur", onBlur)
    }
  }, [updateMyPresence])

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
        onMouseMove={onCanvasMouseMove}
        onMouseLeave={onCanvasMouseLeave}
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
        <CanvasPeerCursors />
      </ReactFlow>
      <CanvasPresenceBar />
      <CanvasViewportControls />
      <ShapePalette />
    </div>
  )
}

function CollaborativeFlowCanvas() {
  const { id: projectId } = useRoom()

  return (
    <ReactFlowProvider>
      <CollaborativeFlowCanvasInner key={projectId} projectId={projectId} />
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

export function CollaborativeCanvas() {
  return (
    <div className="size-full min-h-[calc(100vh-3.5rem)]">
      <ClientSideSuspense fallback={<CanvasLoadingFallback />}>
        <CollaborativeFlowCanvas />
      </ClientSideSuspense>
    </div>
  )
}
