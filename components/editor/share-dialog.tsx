"use client"

import {
  Check,
  Link2,
  Mail,
  Trash2,
  UserRound,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { useEditorWorkspace } from "@/components/editor/editor-workspace-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type CollaboratorProfile = {
  displayName: string | null
  imageUrl: string | null
}

type CollaboratorRow = {
  id: string
  email: string
  createdAt: string
  profile: CollaboratorProfile
}

type OwnerPayload = {
  userId: string
  primaryEmail: string | null
  profile: CollaboratorProfile
}

type CollaboratorsResponse = {
  role: "owner" | "collaborator"
  owner: OwnerPayload
  collaborators: CollaboratorRow[]
}

async function readApiError(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json()
    if (body && typeof body === "object" && "error" in body) {
      const msg = (body as { error?: unknown }).error
      if (typeof msg === "string" && msg.trim() !== "") return msg
    }
  } catch {
    /* ignore */
  }
  return "Something went wrong"
}

function PersonAvatar({
  profile,
  email,
}: {
  profile: CollaboratorProfile
  email: string | null | undefined
}) {
  const safeEmail = email ?? ""
  if (profile.imageUrl) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- external Clerk avatar URLs */}
        <img
          src={profile.imageUrl}
          alt=""
          className="size-10 shrink-0 rounded-full object-cover ring-1 ring-surface-border"
        />
      </>
    )
  }
  const initial = (
    profile.displayName?.[0] ??
    safeEmail[0] ??
    "?"
  ).toUpperCase()
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-elevated text-sm font-medium text-copy-secondary ring-1 ring-surface-border"
      aria-hidden
    >
      {initial}
    </div>
  )
}

export function ShareDialog() {
  const router = useRouter()
  const { workspaceProject, shareDialogOpen, setShareDialogOpen } =
    useEditorWorkspace()

  const projectId = workspaceProject?.id ?? null

  const [loadState, setLoadState] = useState<
    | { status: "idle" | "loading" }
    | { status: "ready"; data: CollaboratorsResponse }
    | { status: "error"; message: string }
  >({ status: "idle" })

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteErr, setInviteErr] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoadState({ status: "loading" })
    const res = await fetch(
      `/api/projects/${encodeURIComponent(projectId)}/collaborators`
    )
    if (!res.ok) {
      setLoadState({
        status: "error",
        message: await readApiError(res),
      })
      return
    }
    const data = (await res.json()) as CollaboratorsResponse
    setLoadState({ status: "ready", data })
  }, [projectId])

  useEffect(() => {
    if (!shareDialogOpen || !projectId) return
    const id = window.setTimeout(() => {
      setInviteErr(null)
      setCopied(false)
      void load()
    }, 0)
    return () => window.clearTimeout(id)
  }, [shareDialogOpen, projectId, load])

  const close = useCallback(() => setShareDialogOpen(false), [
    setShareDialogOpen,
  ])

  const onInvite = useCallback(async () => {
    if (!projectId || loadState.status !== "ready") return
    if (loadState.data.role !== "owner") return
    const trimmed = inviteEmail.trim()
    if (!trimmed) return

    setInviteBusy(true)
    setInviteErr(null)
    const res = await fetch(
      `/api/projects/${encodeURIComponent(projectId)}/collaborators`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      }
    )
    setInviteBusy(false)

    if (!res.ok) {
      setInviteErr(await readApiError(res))
      return
    }

    await res.json()
    setInviteErr(null)
    setInviteEmail("")
    router.refresh()
    await load()
  }, [inviteEmail, load, loadState, projectId, router])

  const onRemove = useCallback(
    async (email: string, rowId: string) => {
      if (!projectId || loadState.status !== "ready") return
      if (loadState.data.role !== "owner") return

      setRemovingId(rowId)
      setInviteErr(null)
      const res = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/collaborators`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      )
      setRemovingId(null)

      if (!res.ok && res.status !== 204) {
        setInviteErr(await readApiError(res))
        return
      }

      setInviteErr(null)
      router.refresh()
      await load()
    },
    [load, loadState, projectId, router]
  )

  const onCopyLink = useCallback(async () => {
    if (!projectId) return
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const url = `${origin}/editor/${encodeURIComponent(projectId)}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      setInviteErr("Could not copy link")
      return
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }, [projectId])

  const isOwner = loadState.status === "ready" && loadState.data.role === "owner"
  const isCollaboratorViewer =
    loadState.status === "ready" && loadState.data.role === "collaborator"

  const accessTotal = useMemo(() => {
    if (loadState.status !== "ready") return 0
    return 1 + loadState.data.collaborators.length
  }, [loadState])

  return (
    <Dialog
      open={shareDialogOpen && projectId !== null}
      onOpenChange={(next) => {
        if (!next) close()
      }}
    >
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-3xl border-surface-border bg-surface p-0 sm:max-w-lg">
        <div className="border-b border-surface-border px-6 py-5">
          <DialogHeader className="gap-1 space-y-0 text-left">
            <DialogTitle className="text-lg font-semibold text-copy-primary">
              Share project
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-copy-muted">
              Invite collaborators, copy the workspace link, and manage access.
            </DialogDescription>
          </DialogHeader>
        </div>

        {shareDialogOpen && projectId !== null ? (
          <div className="flex flex-col">
            {/* Workspace link row */}
            <div className="px-6 pt-5">
              <div className="flex flex-col gap-3 rounded-xl border border-surface-border bg-base/60 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-copy-primary">
                    Workspace link
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-copy-muted">
                    Share a direct link with teammates after you grant them
                    access.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "h-9 shrink-0 gap-2 self-start rounded-xl border border-surface-border bg-elevated px-4 text-copy-primary hover:bg-subtle sm:self-center",
                    copied && "border-state-success/40 text-state-success"
                  )}
                  onClick={() => void onCopyLink()}
                >
                  {copied ? (
                    <>
                      <Check className="size-4 shrink-0" aria-hidden />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Link2 className="size-4 shrink-0 text-copy-muted" aria-hidden />
                      Copy link
                    </>
                  )}
                </Button>
              </div>
            </div>

            {isOwner ? (
              <div className="border-b border-surface-border px-6 py-5">
                <label
                  htmlFor="share-invite-email"
                  className="text-sm font-semibold text-copy-primary"
                >
                  Invite by email
                </label>
                <div className="relative mt-3 flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Mail
                      className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-copy-muted"
                      aria-hidden
                    />
                    <Input
                      id="share-invite-email"
                      type="email"
                      autoComplete="email"
                      placeholder="teammate@company.com"
                      value={inviteEmail}
                      disabled={inviteBusy}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          void onInvite()
                        }
                      }}
                      className="h-11 rounded-xl pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    className="h-11 shrink-0 rounded-xl px-5 font-semibold bg-brand text-(--color-base) hover:bg-brand/90"
                    disabled={inviteBusy || inviteEmail.trim() === ""}
                    onClick={() => void onInvite()}
                  >
                    Invite
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="px-6 pb-6 pt-5">
              {inviteErr !== null ? (
                <p className="mb-4 text-xs text-state-error">{inviteErr}</p>
              ) : null}

              {loadState.status === "loading" || loadState.status === "idle" ? (
                <p className="text-center text-sm text-copy-muted py-8">
                  Loading…
                </p>
              ) : loadState.status === "error" ? (
                <p className="text-center text-sm text-state-error py-8">
                  {loadState.message}
                </p>
              ) : loadState.status === "ready" ? (
                (() => {
                  const payload = loadState.data
                  const owner = payload.owner
                  const ownerFallback =
                    owner.primaryEmail ?? "Workspace owner"
                  const ownerTitle =
                    owner.profile.displayName ?? ownerFallback

                  return (
                    <>
                      <div className="mb-3 flex items-baseline justify-between gap-4">
                        <p className="text-sm font-semibold text-copy-primary">
                          People with access
                        </p>
                        <p className="shrink-0 text-xs tabular-nums text-copy-muted">
                          {accessTotal} total
                        </p>
                      </div>

                      <div className="max-h-[min(42vh,20rem)] space-y-2 overflow-y-auto pr-1">
                        <ul className="flex flex-col gap-2">
                          <li>
                            <div className="flex items-center gap-3 rounded-xl border border-surface-border bg-base/60 px-3 py-3">
                              <PersonAvatar
                                profile={owner.profile}
                                email={ownerFallback}
                              />
                              <div className="min-w-0 flex-1 text-left">
                                <div className="flex flex-wrap items-center gap-2 gap-y-1">
                                  <span className="truncate text-sm font-medium text-copy-primary">
                                    {ownerTitle}
                                  </span>
                                  <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-(--color-base) uppercase">
                                    Owner
                                  </span>
                                </div>
                                {owner.profile.displayName !== null &&
                                owner.primaryEmail !== null ? (
                                  <p className="truncate text-xs text-copy-muted">
                                    {owner.primaryEmail}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </li>
                          {payload.collaborators.map((row) => {
                            const label =
                              row.profile.displayName ?? row.email
                            const sub =
                              row.profile.displayName !== null
                                ? row.email
                                : null
                            return (
                              <li key={row.id}>
                                <div className="flex items-center gap-3 rounded-xl border border-surface-border bg-base/60 px-3 py-3">
                                  <PersonAvatar
                                    profile={row.profile}
                                    email={row.email}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-copy-primary">
                                      {label}
                                    </p>
                                    {sub ? (
                                      <p className="truncate text-xs text-copy-muted">
                                        {sub}
                                      </p>
                                    ) : (
                                      <p className="sr-only">{row.email}</p>
                                    )}
                                  </div>
                                  {isOwner ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      className="shrink-0 text-copy-muted hover:text-state-error"
                                      aria-label={`Remove ${row.email}`}
                                      disabled={removingId === row.id}
                                      onClick={() =>
                                        void onRemove(row.email, row.id)
                                      }
                                    >
                                      <Trash2 className="size-4" aria-hidden />
                                    </Button>
                                  ) : (
                                    <UserRound
                                      className="size-4 shrink-0 text-copy-faint opacity-60"
                                      aria-hidden
                                    />
                                  )}
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    </>
                  )
                })()
              ) : null}
            </div>
          </div>
        ) : null}

        {isCollaboratorViewer ? (
          <DialogFooter className="gap-3 border-t border-surface-border bg-subtle px-6 py-4">
            <p className="w-full text-left text-xs leading-relaxed text-copy-muted">
              You can review who has access. Only the owner can invite people or
              remove them.
            </p>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
