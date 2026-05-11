/** URL-style slug preview from a display name (live as the user types). */
export function slugifyPreview(name: string): string {
  const slug = name
    .trim()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[\s_]+/gu, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/gu, "")
  return slug === "" ? "untitled" : slug
}
