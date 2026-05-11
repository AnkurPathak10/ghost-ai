type EditorWorkspacePageProps = {
  params: Promise<{ projectId: string }>
}

export default async function EditorWorkspacePage({
  params,
}: EditorWorkspacePageProps) {
  const { projectId } = await params

  return (
    <div
      className="flex min-h-[calc(100vh-3.5rem)] flex-col px-6 py-10"
      role="region"
      aria-label="Editor workspace"
    >
      <h1 className="text-lg font-medium text-copy-primary">Workspace</h1>
      <p className="mt-2 max-w-prose text-sm text-copy-secondary">
        Canvas and collaboration will live here. Room ID matches this project.
      </p>
      <p className="mt-4 truncate font-mono text-xs text-copy-muted">
        {projectId}
      </p>
    </div>
  )
}
