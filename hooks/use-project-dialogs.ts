"use client"

import { useCallback, useMemo, useState } from "react"

import {
  INITIAL_MOCK_PROJECTS,
  type MockProject,
} from "@/lib/editor/mock-projects"
import { slugifyPreview } from "@/lib/editor/project-slug"

export type ProjectDialogMode = "create" | "rename" | "delete" | null

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export interface UseProjectDialogsOptions {
  initialProjects?: MockProject[]
}

export function useProjectDialogs({
  initialProjects = INITIAL_MOCK_PROJECTS,
}: UseProjectDialogsOptions = {}) {
  const [projects, setProjects] = useState<MockProject[]>(initialProjects)
  const [activeDialog, setActiveDialog] = useState<ProjectDialogMode>(null)
  const [targetProject, setTargetProject] = useState<MockProject | null>(null)
  const [createName, setCreateName] = useState("")
  const [renameName, setRenameName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const myProjects = useMemo(
    () => projects.filter((p) => p.membership === "owner"),
    [projects]
  )
  const sharedProjects = useMemo(
    () => projects.filter((p) => p.membership === "collaborator"),
    [projects]
  )

  const slugPreview = useMemo(() => slugifyPreview(createName), [createName])

  const closeDialog = useCallback(() => {
    setActiveDialog(null)
    setTargetProject(null)
    setCreateName("")
    setRenameName("")
    setIsLoading(false)
  }, [])

  const openCreate = useCallback(() => {
    setTargetProject(null)
    setCreateName("")
    setRenameName("")
    setActiveDialog("create")
  }, [])

  const openRename = useCallback((project: MockProject) => {
    setTargetProject(project)
    setRenameName(project.name)
    setActiveDialog("rename")
  }, [])

  const openDelete = useCallback((project: MockProject) => {
    setTargetProject(project)
    setActiveDialog("delete")
  }, [])

  const submitCreate = useCallback(async () => {
    const name = createName.trim()
    if (!name || isLoading) return
    setIsLoading(true)
    await delay(280)
    const slug =
      slugifyPreview(name) ||
      `project-${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}`
    const next: MockProject = {
      id: crypto.randomUUID(),
      name,
      slug,
      membership: "owner",
    }
    setProjects((prev) => [...prev, next])
    setIsLoading(false)
    closeDialog()
  }, [closeDialog, createName, isLoading])

  const submitRename = useCallback(async () => {
    const name = renameName.trim()
    if (!name || !targetProject || isLoading) return
    setIsLoading(true)
    await delay(280)
    const slug =
      slugifyPreview(name) ||
      targetProject.slug ||
      `project-${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}`
    setProjects((prev) =>
      prev.map((p) =>
        p.id === targetProject.id ? { ...p, name, slug } : p
      )
    )
    setIsLoading(false)
    closeDialog()
  }, [closeDialog, isLoading, renameName, targetProject])

  const submitDelete = useCallback(async () => {
    if (!targetProject || isLoading) return
    setIsLoading(true)
    await delay(280)
    setProjects((prev) => prev.filter((p) => p.id !== targetProject.id))
    setIsLoading(false)
    closeDialog()
  }, [closeDialog, isLoading, targetProject])

  return {
    projects,
    myProjects,
    sharedProjects,
    dialogState: activeDialog,
    targetProject,
    formState: {
      createName,
      renameName,
      slugPreview,
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
