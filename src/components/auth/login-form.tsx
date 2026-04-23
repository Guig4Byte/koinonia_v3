"use client"

import Link from "next/link"
import { LoaderCircle, ShieldCheck } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useLogin } from "@/hooks/use-auth"
import { isApiClientError } from "@/lib/api-client"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

export function LoginForm() {
  const loginMutation = useLogin({ redirectTo: "/" })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const submitForm = handleSubmit((values) => {
    loginMutation.mutate(values)
  })

  const errorMessage = isApiClientError(loginMutation.error)
    ? loginMutation.error.message
    : null

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-card/95 p-7 shadow-[0_30px_90px_-48px_rgba(44,44,42,0.45)] backdrop-blur">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-2xl bg-new-bg p-3 text-new">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
            Koinonia
          </p>
          <h1 className="text-2xl font-semibold text-stone-900">Entrar</h1>
        </div>
      </div>

      <form className="space-y-5" onSubmit={submitForm}>
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
            placeholder="voce@igreja.org"
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
            autoComplete="current-password"
            className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-new focus:ring-2 focus:ring-new/20"
            placeholder="Sua senha"
          />
          {errors.password ? (
            <p className="text-sm text-stone-500">{errors.password.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 text-base font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loginMutation.isPending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </button>

        {errorMessage ? <p className="text-sm text-stone-500">{errorMessage}</p> : null}
      </form>

      <div className="mt-6 border-t border-stone-200 pt-4">
        <Link
          href="/onboarding"
          className="inline-flex h-12 items-center text-sm font-medium text-new transition hover:text-new/80"
        >
          Primeiro acesso? Criar igreja
        </Link>
      </div>
    </div>
  )
}
