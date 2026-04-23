import { Metadata } from "next"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { OnboardingForm } from "@/components/auth/onboarding-form"
import { Church } from "lucide-react"

export const metadata: Metadata = {
  title: "Criar Igreja — Koinonia",
  description: "Configure sua igreja no Koinonia",
}

export default async function OnboardingPage() {
  const existingChurch = await prisma.church.findFirst()

  if (existingChurch) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-800 text-white">
            <Church className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-stone-800">
              Bem-vindo
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Configure sua igreja em poucos passos
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm border border-stone-200">
          <OnboardingForm />
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          Já tem uma conta?{" "}
          <a
            href="/login"
            className="font-medium text-stone-800 underline underline-offset-4"
          >
            Entrar
          </a>
        </p>
      </div>
    </div>
  )
}
