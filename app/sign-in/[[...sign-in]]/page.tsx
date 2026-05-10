import { SignIn } from "@clerk/nextjs"

import { AuthPageShell } from "@/components/auth/auth-page-shell"

export default function SignInPage() {
  return (
    <AuthPageShell>
      <SignIn />
    </AuthPageShell>
  )
}
