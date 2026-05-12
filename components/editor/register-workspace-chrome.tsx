"use client"

import { useEffect } from "react"

import { useEditorWorkspace } from "@/components/editor/editor-workspace-provider"

export interface RegisterWorkspaceChromeProps {
  projectId: string
  projectName: string
}

/** Binds navbar / chrome to the active workspace while this route is mounted. */
export function RegisterWorkspaceChrome({
  projectId,
  projectName,
}: RegisterWorkspaceChromeProps) {
  const { bindWorkspaceChrome, clearWorkspaceChrome } = useEditorWorkspace()

  useEffect(() => {
    bindWorkspaceChrome({ id: projectId, name: projectName })
    return () => clearWorkspaceChrome()
  }, [bindWorkspaceChrome, clearWorkspaceChrome, projectId, projectName])

  return null
}
