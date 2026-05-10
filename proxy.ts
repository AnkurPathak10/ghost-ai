import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

import { getSignInPathname, getSignUpPathname } from "@/lib/auth-paths"

const signInPath = getSignInPathname()
const signUpPath = getSignUpPathname()

const isPublicRoute = createRouteMatcher([
  "/",
  `${signInPath}(.*)`,
  `${signUpPath}(.*)`,
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
