"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useEditorWorkspace } from "@/components/editor/editor-workspace-provider"

export function ProjectDialogs() {
  const {
    dialogState,
    targetProject,
    formState,
    isLoading,
    setCreateName,
    setRenameName,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  } = useEditorWorkspace()

  useEffect(() => {
    if (dialogState !== "rename") return
    const id = window.requestAnimationFrame(() => {
      const el = document.getElementById("rename-project-name-input")
      if (el instanceof HTMLInputElement) {
        el.focus()
        el.select()
      }
    })
    return () => window.cancelAnimationFrame(id)
  }, [dialogState])

  const isCreateOpen = dialogState === "create"
  const isRenameOpen = dialogState === "rename"
  const isDeleteOpen = dialogState === "delete"

  return (
    <>
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>
              Name your workspace. The slug updates as you type.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              void submitCreate()
            }}
          >
            <div className="grid gap-2">
              <label className="text-sm font-medium text-copy-secondary">
                Project name
              </label>
              <Input
                value={formState.createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Payment service"
                autoComplete="off"
                disabled={isLoading}
              />
              <p className="text-xs text-copy-muted">
                Slug preview:{" "}
                <span className="font-mono text-copy-secondary">
                  {formState.slugPreview
                    ? `/${formState.slugPreview}`
                    : "—"}
                </span>
              </p>
            </div>
            <DialogFooter className="rounded-b-3xl sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isRenameOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>
              Current project name:{" "}
              <span className="font-medium text-copy-primary">
                {targetProject?.name ?? "—"}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              void submitRename()
            }}
          >
            <div className="grid gap-2">
              <label className="text-sm font-medium text-copy-secondary">
                Project name
              </label>
              <Input
                id="rename-project-name-input"
                value={formState.renameName}
                onChange={(e) => setRenameName(e.target.value)}
                autoComplete="off"
                disabled={isLoading}
              />
            </div>
            <DialogFooter className="rounded-b-3xl sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent className="rounded-3xl sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This will remove{" "}
              <span className="font-medium text-copy-primary">
                {targetProject?.name ?? "this project"}
              </span>{" "}
              from your list. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="rounded-b-3xl sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void submitDelete()}
              disabled={isLoading}
            >
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
