"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import type { CanvasTemplate } from "@/components/editor/starter-templates"

type CanvasTemplateImportContextValue = {
  /** Invokes the collaborative canvas import when the room is mounted; no-op if unset. */
  importTemplate: (template: CanvasTemplate) => void
  /** Registered by `CollaborativeFlowCanvasInner`; cleared on unmount. */
  setImportHandler: (fn: ((t: CanvasTemplate) => void) | null) => void
}

const CanvasTemplateImportContext =
  createContext<CanvasTemplateImportContextValue | null>(null)

export function CanvasTemplateImportProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<((t: CanvasTemplate) => void) | null>(null)

  const setImportHandler = useCallback((fn: ((t: CanvasTemplate) => void) | null) => {
    handlerRef.current = fn
  }, [])

  const importTemplate = useCallback((template: CanvasTemplate) => {
    handlerRef.current?.(template)
  }, [])

  const value = useMemo<CanvasTemplateImportContextValue>(
    () => ({ importTemplate, setImportHandler }),
    [importTemplate, setImportHandler]
  )

  return (
    <CanvasTemplateImportContext.Provider value={value}>
      {children}
    </CanvasTemplateImportContext.Provider>
  )
}

export function useCanvasTemplateImport() {
  const ctx = useContext(CanvasTemplateImportContext)
  if (!ctx) {
    throw new Error(
      "useCanvasTemplateImport must be used within CanvasTemplateImportProvider"
    )
  }
  return ctx
}
