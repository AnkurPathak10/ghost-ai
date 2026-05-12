"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import type { EditorSidebarProject } from "@/lib/editor/editor-project"
import { useProjectDialogs } from "@/hooks/use-project-dialogs"

export interface WorkspaceChromeProject {
  id: string
  name: string
}

type WorkspaceContextValue = ReturnType<typeof useProjectDialogs> & {
  workspaceProject: WorkspaceChromeProject | null
  bindWorkspaceChrome: (project: WorkspaceChromeProject) => void
  clearWorkspaceChrome: () => void
  aiSidebarOpen: boolean
  setAiSidebarOpen: (open: boolean) => void
  toggleAiSidebar: () => void
  shareDialogOpen: boolean
  setShareDialogOpen: (open: boolean) => void
  openShareDialog: () => void
}

const EditorWorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined
)

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
  const dialogs = useProjectDialogs({ initialOwned, initialShared })
  const [workspaceProject, setWorkspaceProject] =
    useState<WorkspaceChromeProject | null>(null)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  const bindWorkspaceChrome = useCallback((project: WorkspaceChromeProject) => {
    setWorkspaceProject(project)
    setAiSidebarOpen(true)
  }, [])

  const clearWorkspaceChrome = useCallback(() => {
    setWorkspaceProject(null)
    setAiSidebarOpen(false)
    setShareDialogOpen(false)
  }, [])

  const toggleAiSidebar = useCallback(() => {
    setAiSidebarOpen((open) => !open)
  }, [])

  const openShareDialog = useCallback(() => {
    if (workspaceProject) {
      setShareDialogOpen(true)
    }
  }, [workspaceProject])

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ...dialogs,
      workspaceProject,
      bindWorkspaceChrome,
      clearWorkspaceChrome,
      aiSidebarOpen,
      setAiSidebarOpen,
      toggleAiSidebar,
      shareDialogOpen,
      setShareDialogOpen,
      openShareDialog,
    }),
    [
      aiSidebarOpen,
      bindWorkspaceChrome,
      clearWorkspaceChrome,
      dialogs,
      openShareDialog,
      shareDialogOpen,
      toggleAiSidebar,
      workspaceProject,
    ]
  )

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
