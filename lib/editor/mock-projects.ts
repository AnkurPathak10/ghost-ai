export type ProjectMembership = "owner" | "collaborator"

export interface MockProject {
  id: string
  name: string
  slug: string
  membership: ProjectMembership
}

/** Mock data only — no persistence (feature 04). */
export const INITIAL_MOCK_PROJECTS: MockProject[] = [
  {
    id: "mp-owner-1",
    name: "Checkout rewrite",
    slug: "checkout-rewrite",
    membership: "owner",
  },
  {
    id: "mp-owner-2",
    name: "Infra map",
    slug: "infra-map",
    membership: "owner",
  },
  {
    id: "mp-shared-1",
    name: "Team roadmap",
    slug: "team-roadmap",
    membership: "collaborator",
  },
]
