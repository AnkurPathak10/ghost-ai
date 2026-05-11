export type EditorProjectMembership = "owner" | "collaborator"

/** Serializable project row for editor sidebar / dialogs */
export interface EditorSidebarProject {
  id: string
  name: string
  membership: EditorProjectMembership
}
