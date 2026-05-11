"use client"

import { createContext, type ReactNode, useContext } from "react"

import type { EditorSidebarProject } from "@/lib/editor/editor-project"
import { useProjectDialogs } from "@/hooks/use-project-dialogs"

const EditorWorkspaceContext = createContext<
  ReturnType<typeof useProjectDialogs> | undefined
>(undefined)

export interface EditorWorkspaceProviderProps {
  children: ReactNode
  initialOwned: EditorSidebarProject[]
  initialShared: EditorSidebarProject[]
}

export function EditorWorkspaceProvider({
  children,
  initialOwned,
  initialShared,
}: EditorWorkspaceProviderProps) {
  const value = useProjectDialogs({ initialOwned, initialShared })
  return (
    <EditorWorkspaceContext.Provider value={value}>
      {children}
    </EditorWorkspaceContext.Provider>
  )
}

export function useEditorWorkspace() {
  const ctx = useContext(EditorWorkspaceContext)
  if (!ctx) {
    throw new Error("useEditorWorkspace must be used within EditorWorkspaceProvider")
  }
  return ctx
}
