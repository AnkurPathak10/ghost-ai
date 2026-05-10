import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { getSignInPathname } from "@/lib/auth-paths"

export const dynamic = "force-dynamic"

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect("/editor")
  }

  redirect(getSignInPathname())
}
