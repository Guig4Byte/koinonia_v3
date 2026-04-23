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
    <div className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-card/95 p-7 shadow-[0_30px_90px_-48px_rgba(44,44,42,0.45)] backdrop-blur">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-2xl bg-ok-bg p-3 text-ok">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
            Primeiro acesso
          </p>
          <h1 className="text-2xl font-semibold text-stone-900">Criar igreja</h1>
        </div>
      </div>

      <form className="space-y-5" onSubmit={submitForm}>
        {step === 1 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="churchName">
                Nome da igreja
              </label>
              <input
                {...register("churchName")}
                id="churchName"
                type="text"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-new focus:ring-2 focus:ring-new/20"
                placeholder="Comunidade Esperança"
              />
              {errors.churchName ? (
                <p className="text-sm text-stone-500">{errors.churchName.message}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={goToNextStep}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-stone-900 px-4 text-base font-semibold text-white transition hover:bg-stone-800"
            >
              Continuar
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="pastorName">
                Nome do pastor
              </label>
              <input
                {...register("pastorName")}
                id="pastorName"
                type="text"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-new focus:ring-2 focus:ring-new/20"
                placeholder="Roberto Almeida"
              />
              {errors.pastorName ? (
                <p className="text-sm text-stone-500">{errors.pastorName.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="email">
                E-mail
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                autoComplete="email"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-new focus:ring-2 focus:ring-new/20"
                placeholder="pastor@igreja.org"
              />
              {errors.email ? (
                <p className="text-sm text-stone-500">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="password">
                Senha
              </label>
              <input
                {...register("password")}
                id="password"
                type="password"
                autoComplete="new-password"
                className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-new focus:ring-2 focus:ring-new/20"
                placeholder="Crie uma senha"
              />
              {errors.password ? (
                <p className="text-sm text-stone-500">{errors.password.message}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-stone-200 px-4 text-base font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Voltar
              </button>

              <button
                type="submit"
                disabled={onboardingMutation.isPending}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 text-base font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
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

        {errorMessage ? <p className="text-sm text-stone-500">{errorMessage}</p> : null}
      </form>

      <div className="mt-6 border-t border-stone-200 pt-4">
        <Link
          href="/login"
          className="inline-flex h-12 items-center text-sm font-medium text-new transition hover:text-new/80"
        >
          Já tem acesso? Entrar
        </Link>
      </div>
    </div>
  )
}
