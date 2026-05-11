"use client"

import { createContext, type ReactNode, useContext } from "react"

import { useProjectDialogs } from "@/hooks/use-project-dialogs"

const EditorWorkspaceContext = createContext<
  ReturnType<typeof useProjectDialogs> | undefined
>(undefined)

export function EditorWorkspaceProvider({ children }: { children: ReactNode }) {
  const value = useProjectDialogs()
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
