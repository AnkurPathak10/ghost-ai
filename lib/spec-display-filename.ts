/** Short display/download name for a saved spec, e.g. `1777586189829.md`. */
export function formatSpecDisplayFilename(createdAt: Date | string): string {
  const ms = new Date(createdAt).getTime()
  return Number.isFinite(ms) ? `${ms}.md` : "spec.md"
}
