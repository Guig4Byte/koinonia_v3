"use client"

import Link from "next/link"
import { LoaderCircle, Sparkles } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { useOnboarding } from "@/hooks/use-auth"
import { isApiClientError } from "@/lib/api-client"
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/auth"

export function OnboardingForm() {
  const [step, setStep] = useState<1 | 2>(1)
  const onboardingMutation = useOnboarding({ redirectTo: "/" })

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      churchName: "",
      pastorName: "",
      email: "",
      password: "",
    },
  })

  const goToNextStep = async () => {
    const isChurchNameValid = await trigger("churchName")
    if (isChurchNameValid) {
      setStep(2)
    }
  }

  const submitForm = handleSubmit((values) => {
    onboardingMutation.mutate(values)
  })

  const errorMessage = isApiClientError(onboardingMutation.error)
    ? onboardingMutation.error.message
    : null

  return (
    <div className="w-full rounded-2xl bg-[var(--card)] p-6 shadow-sm border border-[var(--border)]">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-2xl bg-[var(--ok-bg)] p-3 text-[var(--ok)]">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            Primeiro acesso
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Criar igreja</h1>
        </div>
      </div>

      <form className="space-y-5" onSubmit={submitForm} noValidate>
        {step === 1 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]" htmlFor="churchName">
                Nome da igreja
              </label>
              <input
                {...register("churchName")}
                id="churchName"
                type="text"
                className="h-12 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
                placeholder="Comunidade Esperança"
              />
              {errors.churchName ? (
                <p className="text-sm text-[var(--risk)]">{errors.churchName.message}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={goToNextStep}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-base font-semibold text-[var(--pulse-card-fg)] transition hover:opacity-90"
            >
              Continuar
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]" htmlFor="pastorName">
                Nome do pastor
              </label>
              <input
                {...register("pastorName")}
                id="pastorName"
                type="text"
                className="h-12 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
                placeholder="Roberto Almeida"
              />
              {errors.pastorName ? (
                <p className="text-sm text-[var(--risk)]">{errors.pastorName.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]" htmlFor="email">
                E-mail
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                autoComplete="email"
                className="h-12 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
                placeholder="pastor@igreja.org"
              />
              {errors.email ? (
                <p className="text-sm text-[var(--risk)]">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]" htmlFor="password">
                Senha
              </label>
              <input
                {...register("password")}
                id="password"
                type="password"
                autoComplete="new-password"
                className="h-12 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
                placeholder="Crie uma senha"
              />
              {errors.password ? (
                <p className="text-sm text-[var(--risk)]">{errors.password.message}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-[var(--input-border)] px-4 text-base font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface)]"
              >
                Voltar
              </button>

              <button
                type="submit"
                disabled={onboardingMutation.isPending}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-base font-semibold text-[var(--pulse-card-fg)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {onboardingMutation.isPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar igreja"
                )}
              </button>
            </div>
          </div>
        )}

        {errorMessage ? <p className="text-sm font-medium text-[var(--risk)]">{errorMessage}</p> : null}
      </form>

      <div className="mt-6 border-t border-[var(--border-light)] pt-4">
        <Link
          href="/login"
          className="inline-flex h-12 items-center text-sm font-medium text-[var(--new)] transition hover:opacity-80"
        >
          Já tem acesso? Entrar
        </Link>
      </div>
    </div>
  )
}
