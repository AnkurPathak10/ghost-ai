"use client"

import { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import type { EditorSidebarProject } from "@/lib/editor/editor-project"
import {
  buildRoomIdPreview,
  generateRoomIdSuffix,
} from "@/lib/editor/project-room-id"

export type ProjectDialogMode = "create" | "rename" | "delete" | null

export interface UseProjectDialogsOptions {
  initialOwned: EditorSidebarProject[]
  initialShared: EditorSidebarProject[]
}

type ApiProject = { id: string; name: string }

async function readApiError(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json()
    if (body && typeof body === "object" && "error" in body) {
      const msg = (body as { error?: unknown }).error
      if (typeof msg === "string" && msg.trim() !== "") return msg
    }
  } catch {
    /* ignore */
  }
  return "Something went wrong"
}

export function useProjectDialogs({
  initialOwned,
  initialShared,
}: UseProjectDialogsOptions) {
  const router = useRouter()
  const pathname = usePathname()

  const projects = useMemo(
    () => [...initialOwned, ...initialShared],
    [initialOwned, initialShared]
  )

  const [activeDialog, setActiveDialog] = useState<ProjectDialogMode>(null)
  const [targetProject, setTargetProject] =
    useState<EditorSidebarProject | null>(null)
  const [createName, setCreateName] = useState("")
  const [createRoomSuffix, setCreateRoomSuffix] = useState(() =>
    generateRoomIdSuffix()
  )
  const [renameName, setRenameName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const roomIdPreview = useMemo(
    () => buildRoomIdPreview(createName, createRoomSuffix),
    [createName, createRoomSuffix]
  )

  const closeDialog = useCallback(() => {
    setActiveDialog(null)
    setTargetProject(null)
    setCreateName("")
    setCreateRoomSuffix(generateRoomIdSuffix())
    setRenameName("")
    setIsLoading(false)
    setMutationError(null)
  }, [])

  const openCreate = useCallback(() => {
    setTargetProject(null)
    setCreateName("")
    setCreateRoomSuffix(generateRoomIdSuffix())
    setRenameName("")
    setMutationError(null)
    setActiveDialog("create")
  }, [])

  const openRename = useCallback((project: EditorSidebarProject) => {
    setTargetProject(project)
    setRenameName(project.name)
    setMutationError(null)
    setActiveDialog("rename")
  }, [])

  const openDelete = useCallback((project: EditorSidebarProject) => {
    setTargetProject(project)
    setMutationError(null)
    setActiveDialog("delete")
  }, [])

  const submitCreate = useCallback(async () => {
    const name = createName.trim()
    if (!name || isLoading) return

    setIsLoading(true)
    setMutationError(null)

    let suffix = createRoomSuffix
    const maxAttempts = 8
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const id = buildRoomIdPreview(name, suffix)
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, id }),
      })

      if (res.ok) {
        const created = (await res.json()) as ApiProject
        setIsLoading(false)
        closeDialog()
        router.push(`/editor/${created.id}`)
        router.refresh()
        return
      }

      if (res.status === 409) {
        suffix = generateRoomIdSuffix()
        continue
      }

      setMutationError(await readApiError(res))
      setIsLoading(false)
      return
    }

    setMutationError("Could not create project. Try again.")
    setIsLoading(false)
  }, [closeDialog, createName, createRoomSuffix, isLoading, router])

  const submitRename = useCallback(async () => {
    const name = renameName.trim()
    if (!name || !targetProject || isLoading) return
    if (targetProject.membership !== "owner") return

    setIsLoading(true)
    setMutationError(null)

    const res = await fetch(
      `/api/projects/${encodeURIComponent(targetProject.id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }
    )

    if (!res.ok) {
      setMutationError(await readApiError(res))
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    closeDialog()
    router.refresh()
  }, [closeDialog, isLoading, renameName, router, targetProject])

  const submitDelete = useCallback(async () => {
    if (!targetProject || isLoading) return
    if (targetProject.membership !== "owner") return

    setIsLoading(true)
    setMutationError(null)

    const id = targetProject.id
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
      method: "DELETE",
    })

    if (!(res.ok || res.status === 204)) {
      setMutationError(await readApiError(res))
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    closeDialog()

    const workspacePath = `/editor/${id}`
    if (pathname === workspacePath) {
      router.replace("/editor")
    }
    router.refresh()
  }, [closeDialog, isLoading, pathname, router, targetProject])

  return {
    projects,
    myProjects: initialOwned,
    sharedProjects: initialShared,
    dialogState: activeDialog,
    targetProject,
    mutationError,
    formState: {
      createName,
      renameName,
      roomIdPreview,
    },
    isLoading,
    setCreateName,
    setRenameName,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  }
}
