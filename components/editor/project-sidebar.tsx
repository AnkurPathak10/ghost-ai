"use client"

import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function ProjectSidebar({ isOpen, onClose, className }: ProjectSidebarProps) {
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
      <div className="flex flex-1 flex-col min-h-0">
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
            <X className="h-5 w-5" aria-hidden />
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

          <TabsContent
            value="my-projects"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-auto px-4 py-6"
          >
            <p className="text-center text-sm text-copy-muted">No projects yet</p>
          </TabsContent>

          <TabsContent
            value="shared"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-auto px-4 py-6"
          >
            <p className="text-center text-sm text-copy-muted">No shared projects</p>
          </TabsContent>
        </Tabs>

        <div className="shrink-0 border-t border-surface-border p-4">
          <Button type="button" variant="secondary" className="w-full gap-2">
            <Plus className="h-4 w-4" aria-hidden />
            New Project
          </Button>
        </div>
      </div>
    </aside>
  )
}
