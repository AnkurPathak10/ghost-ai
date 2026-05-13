"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import type { NodeShape } from "@/types/canvas"

const VB = 100

type CanvasNodeSurfaceProps = {
  shape: NodeShape
  width: number
  height: number
  fill: string
  selected: boolean
  className?: string
}

function borderColors(selected: boolean) {
  return {
    border: selected
      ? "var(--color-accent-primary)"
      : "var(--color-border-default)",
    stroke: selected
      ? "var(--color-accent-primary)"
      : "var(--color-border-default)",
  }
}

function SvgShapeShell({
  children,
  width,
  height,
  className,
}: {
  children: ReactNode
  width: number
  height: number
  className?: string
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${VB} ${VB}`}
      preserveAspectRatio="none"
      className={cn("block shrink-0", className)}
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** Shape silhouette only (fill + border). Used by node view and drag preview. */
export function CanvasNodeSurface({
  shape,
  width,
  height,
  fill,
  selected,
  className,
}: CanvasNodeSurfaceProps) {
  const { border, stroke } = borderColors(selected)
  const strokeW = Math.max(1, Math.min(width, height) * 0.012)
  const strokeUser = (100 * strokeW) / Math.min(width, height)

  switch (shape) {
    case "rectangle":
      return (
        <div
          className={cn("box-border shadow-sm", className)}
          style={{
            width,
            height,
            backgroundColor: fill,
            borderRadius: 8,
            border: `1px solid ${border}`,
          }}
        />
      )
    case "circle":
      return (
        <div
          className={cn("box-border shadow-sm", className)}
          style={{
            width,
            height,
            backgroundColor: fill,
            borderRadius: "50%",
            border: `1px solid ${border}`,
          }}
        />
      )
    case "pill":
      return (
        <div
          className={cn("box-border shadow-sm", className)}
          style={{
            width,
            height,
            backgroundColor: fill,
            borderRadius: Math.min(width, height) / 2,
            border: `1px solid ${border}`,
          }}
        />
      )
    case "diamond":
      return (
        <SvgShapeShell width={width} height={height} className={className}>
          <polygon
            points={`${VB / 2},0 ${VB},${VB / 2} ${VB / 2},${VB} 0,${VB / 2}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeUser}
            strokeLinejoin="round"
          />
        </SvgShapeShell>
      )
    case "hexagon":
      return (
        <SvgShapeShell width={width} height={height} className={className}>
          <polygon
            points={`${VB * 0.25},0 ${VB * 0.75},0 ${VB},${VB / 2} ${VB * 0.75},${VB} ${VB * 0.25},${VB} 0,${VB / 2}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeUser}
            strokeLinejoin="round"
          />
        </SvgShapeShell>
      )
    case "cylinder": {
      // Cylinder with true elliptical top cap + elliptical bottom rim (straight vertical sides).
      const cx = 50
      const rx = 36
      const ry = 12
      const yTop = 24
      const yBot = 76
      const xL = cx - rx
      const xR = cx + rx

      // Filled barrel: upper semellipse (front of top rim), sides, lower semellipse (front of bottom rim).
      // Bottom arc must use the *lower* half of the ellipse at yBot (bulge toward +y). Wrong sweep draws the upper half and looks concave.
      const bodyFill = [
        `M ${xL} ${yTop}`,
        `A ${rx} ${ry} 0 0 1 ${xR} ${yTop}`,
        `L ${xR} ${yBot}`,
        `A ${rx} ${ry} 0 0 1 ${xL} ${yBot}`,
        "Z",
      ].join(" ")

      // Stroke sides + bottom rim (same lower semellipse as fill, left → right).
      const sidesBottomStroke = [
        `M ${xL} ${yTop}`,
        `L ${xL} ${yBot}`,
        `A ${rx} ${ry} 0 0 0 ${xR} ${yBot}`,
        `L ${xR} ${yTop}`,
      ].join(" ")

      return (
        <SvgShapeShell width={width} height={height} className={className}>
          <path d={bodyFill} fill={fill} stroke="none" />
          <path
            d={sidesBottomStroke}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeUser}
            strokeLinejoin="round"
          />
          <ellipse
            cx={cx}
            cy={yTop}
            rx={rx}
            ry={ry}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeUser}
          />
        </SvgShapeShell>
      )
    }
    default:
      return null
  }
}
