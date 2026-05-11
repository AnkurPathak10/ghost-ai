import { slugifyPreview } from "@/lib/editor/project-slug"

const SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789"

export function generateRoomIdSuffix(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let out = ""
  for (let i = 0; i < length; i++) {
    out += SUFFIX_ALPHABET[bytes[i]! % SUFFIX_ALPHABET.length]!
  }
  return out
}

/** Room ID aligned with persisted `Project.id` when creation succeeds (slug + random suffix). */
export function buildRoomIdPreview(name: string, suffix: string): string {
  const base = slugifyPreview(name)
  return `${base}-${suffix}`
}
