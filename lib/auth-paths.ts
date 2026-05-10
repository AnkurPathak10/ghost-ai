/**
 * Paths for Clerk sign-in / sign-up routes derived from env (see Clerk dashboard / env template).
 * Never rename env keys — only read them.
 */
export function pathnameFromClerkUrl(
  envUrl: string | undefined,
  fallback: string
): string {
  if (!envUrl) return fallback
  try {
    const pathname = new URL(envUrl).pathname
    return pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname
  } catch {
    return envUrl.startsWith("/") ? envUrl : fallback
  }
}

export function getSignInPathname(): string {
  return pathnameFromClerkUrl(
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    "/sign-in"
  )
}

export function getSignUpPathname(): string {
  return pathnameFromClerkUrl(
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    "/sign-up"
  )
}
