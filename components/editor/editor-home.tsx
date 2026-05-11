"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useEditorWorkspace } from "@/components/editor/editor-workspace-provider"

export function EditorHome() {
  const { openCreate } = useEditorWorkspace()

  return (
    <div
      className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6"
      role="region"
      aria-label="Editor home"
    >
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
        <h1 className="text-lg font-medium text-copy-primary">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-copy-secondary">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
        <Button
          type="button"
          className="gap-2"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" aria-hidden />
          New Project
        </Button>
      </div>
    </div>
  )
}
