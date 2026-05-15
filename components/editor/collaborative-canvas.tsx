"use client"

import { LiveMap, LiveObject } from "@liveblocks/client"
import {
  ClientSideSuspense,
  useMutation,
  useRoom,
  useStorage,
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
  useReactFlow,
  useStoreApi,
  type OnNodesChange,
} from "@xyflow/react"
import { Loader2 } from "lucide-react"

import { CanvasPeerCursors } from "@/components/editor/canvas-peer-cursors"
import { CanvasPresenceBar } from "@/components/editor/canvas-presence-bar"

import { MemoCanvasFlowEdge } from "@/components/editor/canvas-flow-edge"
import { MemoCanvasFlowNode } from "@/components/editor/canvas-flow-node"
import { CanvasAiToggle } from "@/components/editor/canvas-ai-toggle"
import { CanvasViewportControls } from "@/components/editor/canvas-viewport-controls"
import { ShapePalette } from "@/components/editor/shape-palette"
import { useCanvasTemplateImport } from "@/components/editor/canvas-template-import-context"
import { useEditorWorkspace } from "@/components/editor/editor-workspace-provider"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { liveblocksCanvasEdgeSync, liveblocksCanvasNodeSync } from "@/lib/canvas-liveblocks-flow-sync"
import {
  DEFAULT_NEW_NODE_COLOR,
  nextCanvasShapeNodeId,
  type CanvasShapeDragPayload,
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
  type MouseEvent,
} from "react"

/** Must match `RoomProvider` initialStorage and @liveblocks/react-flow default. */
const LIVEBLOCKS_FLOW_STORAGE_KEY = "flow"

const nodeTypes = { canvasNode: MemoCanvasFlowNode }
const edgeTypes = { canvasEdge: MemoCanvasFlowEdge }

/** Must render under `<ReactFlow>` so `screenToFlowPosition` and `domNode` are valid. */
function CanvasShapePaletteBridge({
  onNodesChange,
  seedFlowStorage,
}: {
  onNodesChange: OnNodesChange<CanvasNode>
  /** Ensures Liveblocks `flow` exists before `onNodesChange` runs (otherwise adds are dropped). */
  seedFlowStorage: () => void
}) {
  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>()
  const storeApi = useStoreApi()
  const flowRoot = useStorage((storage) => storage.flow)
  const flowReadyRef = useRef(flowRoot !== undefined)

  useEffect(() => {
    flowReadyRef.current = flowRoot !== undefined
  }, [flowRoot])

  const onPlaceShape = useCallback(
    (payload: CanvasShapeDragPayload, clientX: number, clientY: number) => {
      seedFlowStorage()

      const insetPx = 2
      const maxAttempts = 90

      const tryPlace = (attemptsLeft: number) => {
        if (!flowReadyRef.current) {
          if (attemptsLeft > 0) {
            requestAnimationFrame(() => tryPlace(attemptsLeft - 1))
          }
          return
        }

        const domNode = storeApi.getState().domNode
        if (!domNode) {
          if (attemptsLeft > 0) {
            requestAnimationFrame(() => tryPlace(attemptsLeft - 1))
          }
          return
        }

        const pane =
          domNode.querySelector<HTMLElement>(".react-flow__pane") ?? domNode
        const r = pane.getBoundingClientRect()
        if (
          clientX < r.left - insetPx ||
          clientX > r.right + insetPx ||
          clientY < r.top - insetPx ||
          clientY > r.bottom + insetPx
        ) {
          return
        }

        const { width, height } = payload
        const p = screenToFlowPosition({ x: clientX, y: clientY })
        const newNode: CanvasNode = {
          id: nextCanvasShapeNodeId(payload.shape),
          type: "canvasNode",
          position: {
            x: p.x - width / 2,
            y: p.y - height / 2,
          },
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
      }

      queueMicrotask(() => {
        requestAnimationFrame(() => tryPlace(maxAttempts))
      })
    },
    [onNodesChange, screenToFlowPosition, seedFlowStorage, storeApi]
  )

  return <ShapePalette onPlaceShape={onPlaceShape} />
}

function CollaborativeFlowCanvasInner({ projectId }: { projectId: string }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [], sync: liveblocksCanvasNodeSync },
      edges: { initial: [], sync: liveblocksCanvasEdgeSync },
    })

  /**
   * `useLiveblocksFlow` applies node/edge changes only when `storage.get("flow")`
   * exists (@liveblocks/react-flow `onNodesChange` returns early otherwise).
   * Its own `setInitialStorage` runs in `useEffect`, so there is a frame where
   * `flow` can be missing (e.g. legacy rooms). Seed synchronously before paint.
   */
  const initFlowStorageIfMissing = useMutation(
    ({ storage }) => {
      if (storage.get(LIVEBLOCKS_FLOW_STORAGE_KEY) !== undefined) {
        return
      }
      storage.set(
        LIVEBLOCKS_FLOW_STORAGE_KEY,
        new LiveObject({
          nodes: new LiveMap(),
          edges: new LiveMap(),
        })
      )
    },
    []
  )

  useLayoutEffect(() => {
    initFlowStorageIfMissing()
  }, [initFlowStorageIfMissing])

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
      return
    }
    if (nodes.length > 0 || edges.length > 0) {
      hydrationDoneRef.current = true
      startTransition(() => {
        setPersistReady(true)
      })
    }
  }, [nodes.length, edges.length])

  useEffect(() => {
    if (hydrationDoneRef.current) {
      return
    }

    let cancelled = false
    const storageGraceMs = 320

    const timer = window.setTimeout(() => {
      ;(async () => {
        if (cancelled) {
          return
        }
        if (hydrationDoneRef.current) {
          return
        }
        if (nodesRef.current.length > 0 || edgesRef.current.length > 0) {
          hydrationDoneRef.current = true
          startTransition(() => {
            setPersistReady(true)
          })
          return
        }
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
          if (cancelled) {
            return
          }
          if (!hydrationDoneRef.current) {
            hydrationDoneRef.current = true
          }
          startTransition(() => {
            setPersistReady(true)
          })
        }
      })()
    }, storageGraceMs)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [projectId, fitView, onEdgesChange, onNodesChange])

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
        <CanvasShapePaletteBridge
          onNodesChange={onNodesChange}
          seedFlowStorage={initFlowStorageIfMissing}
        />
      </ReactFlow>
      <CanvasPresenceBar />
      <CanvasAiToggle />
      <CanvasViewportControls />
    </div>
  )
}

function CollaborativeFlowCanvas() {
  const { id: projectId } = useRoom()

  return <CollaborativeFlowCanvasInner key={projectId} projectId={projectId} />
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
    <div className="size-full min-h-0">
      <ClientSideSuspense fallback={<CanvasLoadingFallback />}>
        <CollaborativeFlowCanvas />
      </ClientSideSuspense>
    </div>
  )
}
