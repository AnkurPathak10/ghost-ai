"use client"

import { useState, type ReactNode } from "react"

import { EditorNavbar } from "@/components/editor/editor-navbar"
import { EditorWorkspaceProvider } from "@/components/editor/editor-workspace-provider"
import { MobileSidebarScrim } from "@/components/editor/mobile-sidebar-scrim"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectSidebar } from "@/components/editor/project-sidebar"

export interface EditorLayoutProps {
  children: ReactNode
}

function EditorLayoutInner({ children }: EditorLayoutProps) {
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
    </div>
  )
}

export function EditorLayout({ children }: EditorLayoutProps) {
  return (
    <EditorWorkspaceProvider>
      <EditorLayoutInner>{children}</EditorLayoutInner>
    </EditorWorkspaceProvider>
  )
}
