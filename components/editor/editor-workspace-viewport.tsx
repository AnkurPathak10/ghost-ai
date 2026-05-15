"use client"

import { AiWorkspaceSidebar } from "@/components/editor/ai-workspace-sidebar"
import { CollaborativeCanvas } from "@/components/editor/collaborative-canvas"
import { EditorLiveblocksCollaborationRoot } from "@/components/editor/editor-liveblocks-collaboration-root"
import { useEditorWorkspace } from "@/components/editor/editor-workspace-provider"
import { cn } from "@/lib/utils"
import { ReactFlowProvider } from "@xyflow/react"

export function EditorWorkspaceViewport({ roomId }: { roomId: string }) {
  const { aiSidebarOpen, setAiSidebarOpen } = useEditorWorkspace()

  return (
    <EditorLiveblocksCollaborationRoot roomId={roomId}>
      <ReactFlowProvider>
        <div className="relative h-[calc(100vh-3.5rem)] min-h-0 w-full overflow-hidden bg-base">
          <CollaborativeCanvas />
          <aside
            aria-hidden={!aiSidebarOpen}
            className={cn(
              "fixed z-30 flex min-h-0 w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-surface-border bg-base/95 shadow-xl backdrop-blur-sm sm:w-96",
              /* Float above the canvas: inset from navbar (h-14 + 1rem), screen right, and bottom */
              "top-18 bottom-4 right-4",
              "transition-[transform,visibility,opacity] duration-200 ease-out",
              aiSidebarOpen
                ? "visible translate-x-0 opacity-100"
                : "pointer-events-none invisible translate-x-full opacity-0"
            )}
          >
            <AiWorkspaceSidebar
              projectId={roomId}
              onClose={() => setAiSidebarOpen(false)}
            />
          </aside>
        </div>
      </ReactFlowProvider>
    </EditorLiveblocksCollaborationRoot>
  )
}
