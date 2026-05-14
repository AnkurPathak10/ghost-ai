import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import { NODE_COLORS } from "@/types/canvas"
import type { NodeShape } from "@/types/canvas"

const neutral = NODE_COLORS[0]
const blue = NODE_COLORS[1]
const purple = NODE_COLORS[2]
const orange = NODE_COLORS[3]
const red = NODE_COLORS[4]
const green = NODE_COLORS[6]
const teal = NODE_COLORS[7]

export type CanvasTemplate = {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

/** Build a `canvasNode` entry for template data. */
export function tplNode(
  id: string,
  position: { x: number; y: number },
  size: { width: number; height: number },
  label: string,
  shape: NodeShape,
  colorSpec: (typeof NODE_COLORS)[number]
): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position,
    width: size.width,
    height: size.height,
    data: {
      label,
      color: colorSpec.fill,
      labelColor: colorSpec.label,
      shape,
    },
  }
}

function tplEdge(
  id: string,
  source: string,
  target: string,
  sourceHandle: string,
  targetHandle: string
): CanvasEdge {
  return {
    id,
    type: "canvasEdge",
    source,
    target,
    sourceHandle,
    targetHandle,
  }
}

/**
 * Microservices-style diagram: gateway, domain services, and data stores.
 */
const microservicesNodes: CanvasNode[] = [
  tplNode(
    "svc-gateway",
    { x: 300, y: 24 },
    { width: 140, height: 52 },
    "API Gateway",
    "rectangle",
    blue
  ),
  tplNode(
    "svc-auth",
    { x: 40, y: 140 },
    { width: 128, height: 52 },
    "Auth",
    "pill",
    purple
  ),
  tplNode(
    "svc-users",
    { x: 220, y: 140 },
    { width: 128, height: 52 },
    "Users",
    "rectangle",
    green
  ),
  tplNode(
    "svc-orders",
    { x: 400, y: 140 },
    { width: 128, height: 52 },
    "Orders",
    "rectangle",
    orange
  ),
  tplNode(
    "svc-notify",
    { x: 580, y: 140 },
    { width: 128, height: 52 },
    "Notify",
    "hexagon",
    teal
  ),
  tplNode(
    "data-pg",
    { x: 160, y: 280 },
    { width: 140, height: 56 },
    "Postgres",
    "cylinder",
    neutral
  ),
  tplNode(
    "data-cache",
    { x: 460, y: 280 },
    { width: 120, height: 52 },
    "Cache",
    "pill",
    red
  ),
]

const microservicesEdges: CanvasEdge[] = [
  tplEdge("e-gw-auth", "svc-gateway", "svc-auth", "ghost-bottom", "ghost-top"),
  tplEdge("e-gw-users", "svc-gateway", "svc-users", "ghost-bottom", "ghost-top"),
  tplEdge("e-gw-orders", "svc-gateway", "svc-orders", "ghost-bottom", "ghost-top"),
  tplEdge("e-gw-notify", "svc-gateway", "svc-notify", "ghost-bottom", "ghost-top"),
  tplEdge("e-auth-pg", "svc-auth", "data-pg", "ghost-bottom", "ghost-top"),
  tplEdge("e-users-pg", "svc-users", "data-pg", "ghost-bottom", "ghost-top"),
  tplEdge("e-orders-cache", "svc-orders", "data-cache", "ghost-bottom", "ghost-top"),
  tplEdge("e-notify-cache", "svc-notify", "data-cache", "ghost-bottom", "ghost-top"),
]

/** Linear CI/CD pipeline. */
const ciCdNodes: CanvasNode[] = [
  tplNode(
    "cicd-source",
    { x: 40, y: 100 },
    { width: 112, height: 48 },
    "Source",
    "rectangle",
    neutral
  ),
  tplNode(
    "cicd-build",
    { x: 200, y: 100 },
    { width: 112, height: 48 },
    "Build",
    "rectangle",
    blue
  ),
  tplNode(
    "cicd-test",
    { x: 360, y: 100 },
    { width: 112, height: 48 },
    "Test",
    "pill",
    purple
  ),
  tplNode(
    "cicd-stage",
    { x: 520, y: 100 },
    { width: 120, height: 48 },
    "Staging",
    "rectangle",
    orange
  ),
  tplNode(
    "cicd-prod",
    { x: 688, y: 100 },
    { width: 112, height: 48 },
    "Production",
    "rectangle",
    green
  ),
]

const ciCdEdges: CanvasEdge[] = [
  tplEdge("e-c1", "cicd-source", "cicd-build", "ghost-right", "ghost-left"),
  tplEdge("e-c2", "cicd-build", "cicd-test", "ghost-right", "ghost-left"),
  tplEdge("e-c3", "cicd-test", "cicd-stage", "ghost-right", "ghost-left"),
  tplEdge("e-c4", "cicd-stage", "cicd-prod", "ghost-right", "ghost-left"),
]

/** Event-driven flow with bus and consumers. */
const eventDrivenNodes: CanvasNode[] = [
  tplNode(
    "evt-api",
    { x: 40, y: 120 },
    { width: 120, height: 48 },
    "API",
    "rectangle",
    blue
  ),
  tplNode(
    "evt-bus",
    { x: 240, y: 112 },
    { width: 100, height: 64 },
    "Event bus",
    "diamond",
    purple
  ),
  tplNode(
    "evt-worker",
    { x: 420, y: 120 },
    { width: 128, height: 48 },
    "Workers",
    "hexagon",
    orange
  ),
  tplNode(
    "evt-projection",
    { x: 620, y: 120 },
    { width: 140, height: 48 },
    "Projection",
    "pill",
    teal
  ),
  tplNode(
    "evt-store",
    { x: 340, y: 260 },
    { width: 140, height: 56 },
    "Read store",
    "cylinder",
    neutral
  ),
]

const eventDrivenEdges: CanvasEdge[] = [
  tplEdge("e-evt-1", "evt-api", "evt-bus", "ghost-right", "ghost-left"),
  tplEdge("e-evt-2", "evt-bus", "evt-worker", "ghost-right", "ghost-left"),
  tplEdge("e-evt-3", "evt-worker", "evt-projection", "ghost-right", "ghost-left"),
  tplEdge("e-evt-4", "evt-projection", "evt-store", "ghost-bottom", "ghost-top"),
  tplEdge("e-evt-5", "evt-bus", "evt-store", "ghost-bottom", "ghost-top"),
]

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description:
      "Gateway routing to bounded services with shared data and cache layers.",
    nodes: microservicesNodes,
    edges: microservicesEdges,
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD pipeline",
    description:
      "Linear flow from source control through build, test, staging, and production.",
    nodes: ciCdNodes,
    edges: ciCdEdges,
  },
  {
    id: "event-driven",
    name: "Event-driven system",
    description:
      "APIs publish to a bus; workers process streams and feed read-optimized projections.",
    nodes: eventDrivenNodes,
    edges: eventDrivenEdges,
  },
]
