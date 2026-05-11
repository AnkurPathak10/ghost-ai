import type { ReactNode } from "react"

import { EditorLayout } from "@/components/editor/editor-layout"
import { fetchEditorProjectLists } from "@/lib/editor/server-project-lists"

export default async function EditorRouteLayout({
  children,
}: {
  children: ReactNode
}) {
  const { owned, shared } = await fetchEditorProjectLists()

  return (
    <EditorLayout initialOwned={owned} initialShared={shared}>
      {children}
    </EditorLayout>
  )
}
