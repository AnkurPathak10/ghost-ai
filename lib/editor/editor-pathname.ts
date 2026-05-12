/** Project slug segment after `/editor/`, if this is a workspace URL. */
export function pathnameWorkspaceProjectId(
  pathname: string | null | undefined
): string | null {
  if (!pathname?.startsWith("/editor/")) return null
  const segment = pathname.slice("/editor/".length).split("/")[0]?.trim()
  return segment ?? null
}
