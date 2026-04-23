import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import prisma from "@/lib/prisma";

export default async function OnboardingPage() {
  const churchCount = await prisma.church.count();

  if (churchCount > 0) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12 sm:px-10">
      <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-stone-500">
            Primeiro acesso
          </p>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              Configure a igreja e o primeiro pastor em poucos passos.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-stone-600">
              O onboarding inicial fica disponivel apenas enquanto ainda nao existe
              nenhuma igreja cadastrada no banco.
            </p>
          </div>
        </section>

        <div className="flex justify-center lg:justify-end">
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
}
