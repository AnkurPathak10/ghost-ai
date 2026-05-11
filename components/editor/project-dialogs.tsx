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
    mutationError,
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
              Name your workspace. The room ID preview updates as you type.
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
                Room ID preview:{" "}
                <span className="font-mono text-copy-secondary">
                  {formState.roomIdPreview
                    ? `/${formState.roomIdPreview}`
                    : "—"}
                </span>
              </p>
              {mutationError && dialogState === "create" ? (
                <p className="text-xs text-state-error" role="alert">
                  {mutationError}
                </p>
              ) : null}
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
              {mutationError && dialogState === "rename" ? (
                <p className="text-xs text-state-error" role="alert">
                  {mutationError}
                </p>
              ) : null}
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
          {mutationError && dialogState === "delete" ? (
            <p className="px-6 text-xs text-state-error sm:px-0" role="alert">
              {mutationError}
            </p>
          ) : null}
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
