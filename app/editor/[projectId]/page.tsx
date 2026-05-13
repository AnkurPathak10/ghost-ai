import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AccessDenied } from "@/components/editor/access-denied"
import { EditorWorkspaceViewport } from "@/components/editor/editor-workspace-viewport"
import { RegisterWorkspaceChrome } from "@/components/editor/register-workspace-chrome"
import { getSignInPathname } from "@/lib/auth-paths"
import {
  getEditorClerkIdentity,
  getProjectAccessibleToEditor,
} from "@/lib/project-access"

type EditorWorkspacePageProps = {
  params: Promise<{ projectId: string }>
}

export async function generateMetadata({
  params,
}: EditorWorkspacePageProps): Promise<Metadata> {
  const { projectId } = await params
  const identity = await getEditorClerkIdentity()
  if (!identity) {
    return { title: "Workspace" }
  }
  const project = await getProjectAccessibleToEditor(projectId, identity)
  return {
    title: project?.name ?? "Workspace",
  }
}

export default async function EditorWorkspacePage({
  params,
}: EditorWorkspacePageProps) {
  const { projectId } = await params

  const identity = await getEditorClerkIdentity()
  if (!identity) {
    redirect(getSignInPathname())
  }

  const project = await getProjectAccessibleToEditor(projectId, identity)
  if (!project) {
    return <AccessDenied />
  }

  return (
    <>
      <RegisterWorkspaceChrome projectId={project.id} projectName={project.name} />
      <EditorWorkspaceViewport roomId={project.id} />
    </>
  )
}
