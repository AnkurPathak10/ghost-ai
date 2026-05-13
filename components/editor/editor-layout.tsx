"use client"

import { useState, type ReactNode } from "react"

import { CanvasTemplateImportProvider } from "@/components/editor/canvas-template-import-context"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { EditorWorkspaceProvider } from "@/components/editor/editor-workspace-provider"
import { MobileSidebarScrim } from "@/components/editor/mobile-sidebar-scrim"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ShareDialog } from "@/components/editor/share-dialog"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import type { EditorSidebarProject } from "@/lib/editor/editor-project"

export interface EditorLayoutProps {
  children: ReactNode
  initialOwned: EditorSidebarProject[]
  initialShared: EditorSidebarProject[]
}

function EditorLayoutInner({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-full bg-base">
      <EditorNavbar
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen((open) => !open)}
      />
      <MobileSidebarScrim
        isVisible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="min-h-screen pt-14">{children}</main>
      <ProjectDialogs />
      <ShareDialog />
      <StarterTemplatesModal />
    </div>
  )
}

export function EditorLayout({
  children,
  initialOwned,
  initialShared,
}: EditorLayoutProps) {
  return (
    <EditorWorkspaceProvider
      initialOwned={initialOwned}
      initialShared={initialShared}
    >
      <CanvasTemplateImportProvider>
        <EditorLayoutInner>{children}</EditorLayoutInner>
      </CanvasTemplateImportProvider>
    </EditorWorkspaceProvider>
  )
}
