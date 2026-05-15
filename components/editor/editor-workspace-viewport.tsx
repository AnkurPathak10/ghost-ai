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
        <div className="flex min-h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-base">
          <div className="relative flex min-w-0 flex-1 flex-col bg-base">
            <CollaborativeCanvas />
          </div>
          <aside
          aria-hidden={!aiSidebarOpen}
          className={cn(
            "shrink-0 border-l border-surface-border bg-base/95 shadow-lg backdrop-blur-sm transition-[width,opacity] duration-200 ease-out",
            aiSidebarOpen
              ? "w-[min(100%,24rem)] opacity-100 sm:w-96"
              : "w-0 overflow-hidden border-transparent opacity-0"
          )}
        >
          <div className="flex h-full min-h-[calc(100vh-3.5rem)] w-[min(100vw,24rem)] flex-col sm:w-96">
            <AiWorkspaceSidebar
              projectId={roomId}
              onClose={() => setAiSidebarOpen(false)}
            />
          </div>
        </aside>
      </div>
      </ReactFlowProvider>
    </EditorLiveblocksCollaborationRoot>
  )
}
