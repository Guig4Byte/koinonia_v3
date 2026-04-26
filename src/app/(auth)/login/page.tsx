import { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"
import { Church } from "lucide-react"

export const metadata: Metadata = {
  title: "Entrar — Koinonia",
  description: "Acesse sua conta pastoral",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-5 py-8">
      <div className="w-full max-w-sm">
        {/* Header pastoral */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-[#fffaf2]">
            <Church className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Koinonia
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Cuidado pastoral em suas mãos
            </p>
          </div>
        </div>

        {/* Card clean */}
        <div className="rounded-2xl bg-[var(--card)] p-6 shadow-sm border border-[var(--border-light)]">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
