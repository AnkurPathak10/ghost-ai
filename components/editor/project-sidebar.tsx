"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Pencil, Plus, Trash2, X } from "lucide-react"

import { useEditorWorkspace } from "@/components/editor/editor-workspace-provider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { EditorSidebarProject } from "@/lib/editor/editor-project"
import { pathnameWorkspaceProjectId } from "@/lib/editor/editor-pathname"
import { cn } from "@/lib/utils"

export interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function ProjectSidebar({ isOpen, onClose, className }: ProjectSidebarProps) {
  const pathname = usePathname()
  const activeProjectId = pathnameWorkspaceProjectId(pathname)

  const {
    myProjects,
    sharedProjects,
    openCreate,
    openRename,
    openDelete,
  } = useEditorWorkspace()

  return (
    <aside
      aria-hidden={!isOpen}
      className={cn(
        "fixed top-14 bottom-4 left-4 z-30 flex w-[min(100%-2rem,20rem)] flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface/95 shadow-lg backdrop-blur-sm transition-[transform,opacity] duration-200 ease-out",
        isOpen
          ? "translate-x-0 opacity-100"
          : "pointer-events-none -translate-x-full opacity-0",
        className
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-surface-border px-4 py-3">
          <h2 className="text-sm font-medium text-copy-primary">Projects</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-copy-secondary"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden={true} />          
          </Button>
        </div>

        <Tabs
          defaultValue="my-projects"
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <div className="shrink-0 px-4 pt-3">
            <TabsList className="w-full">
              <TabsTrigger value="my-projects" className="flex-1">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1">
                Shared
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContentMy
            value="my-projects"
            projects={myProjects}
            activeProjectId={activeProjectId}
            showActions
            onNavigate={onClose}
            onRename={openRename}
            onDelete={openDelete}
            emptyLabel="No projects yet"
          />

          <TabsContentMy
            value="shared"
            projects={sharedProjects}
            activeProjectId={activeProjectId}
            showActions={false}
            onNavigate={onClose}
            onRename={openRename}
            onDelete={openDelete}
            emptyLabel="No shared projects"
          />
        </Tabs>

        <div className="shrink-0 border-t border-surface-border p-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" aria-hidden={true} />
            New Project
          </Button>
        </div>
      </div>
    </aside>
  )
}

interface TabsContentMyProps {
  value: string
  projects: EditorSidebarProject[]
  activeProjectId: string | null
  showActions: boolean
  onNavigate: () => void
  onRename: (project: EditorSidebarProject) => void
  onDelete: (project: EditorSidebarProject) => void
  emptyLabel: string
}

function TabsContentMy({
  value,
  projects,
  activeProjectId,
  showActions,
  onNavigate,
  onRename,
  onDelete,
  emptyLabel,
}: TabsContentMyProps) {
  return (
    <TabsContent
      value={value}
      className="mt-0 flex min-h-0 flex-1 flex-col overflow-auto px-4 py-6"
    >
      {projects.length === 0 ? (
        <p className="text-center text-sm text-copy-muted">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {projects.map((project) => (
            <li key={project.id}>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl px-2 py-2",
                  showActions ? "pr-1" : "",
                  project.id === activeProjectId
                    ? "bg-accent-dim ring-1 ring-brand/25"
                    : ""
                )}
              >
                <Link
                  href={`/editor/${project.id}`}
                  className="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  onClick={() => onNavigate()}
                >
                  <p className="truncate text-sm font-medium text-copy-primary">
                    {project.name}
                  </p>
                  <p className="truncate font-mono text-xs text-copy-muted">
                    /{project.id}
                  </p>
                </Link>
                {showActions ? (
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-copy-secondary"
                      aria-label={`Rename ${project.name}`}
                      onClick={() => onRename(project)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-copy-secondary"
                      aria-label={`Delete ${project.name}`}
                      onClick={() => onDelete(project)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </TabsContent>
  )
}
