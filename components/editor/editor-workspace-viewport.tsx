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
              "fixed top-14 right-0 z-30 flex h-[calc(100vh-3.5rem)] w-[min(100%,24rem)] flex-col border-l border-surface-border bg-base/95 shadow-lg backdrop-blur-sm sm:w-96",
              "transition-[transform,visibility] duration-200 ease-out",
              aiSidebarOpen
                ? "visible translate-x-0"
                : "pointer-events-none invisible translate-x-full"
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
