import { SignUp } from "@clerk/nextjs"

import { AuthPageShell } from "@/components/auth/auth-page-shell"

export default function SignUpPage() {
  return (
    <AuthPageShell>
      <SignUp />
    </AuthPageShell>
  )
}
