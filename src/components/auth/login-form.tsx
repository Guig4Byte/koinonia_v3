"use client"

import Link from "next/link"
import { LoaderCircle } from "lucide-react"
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
    <form className="flex flex-col gap-5" onSubmit={submitForm}>
      {/* E-mail */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-stone-700" htmlFor="email">
          E-mail
        </label>
        <input
          {...register("email")}
          id="email"
          type="email"
          autoComplete="email"
          className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
          placeholder="voce@igreja.org"
        />
        {errors.email ? (
          <p className="text-sm text-stone-500">{errors.email.message}</p>
        ) : null}
      </div>

      {/* Senha */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-stone-700" htmlFor="password">
          Senha
        </label>
        <input
          {...register("password")}
          id="password"
          type="password"
          autoComplete="current-password"
          className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
          placeholder="Sua senha"
        />
        {errors.password ? (
          <p className="text-sm text-stone-500">{errors.password.message}</p>
        ) : null}
      </div>

      {/* Botão */}
      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-800 px-4 text-base font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-70"
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

      {/* Erro */}
      {errorMessage ? (
        <p className="text-sm text-risk">{errorMessage}</p>
      ) : null}

      {/* Link onboarding */}
      <div className="border-t border-stone-100 pt-4">
        <Link
          href="/onboarding"
          className="text-sm font-medium text-new transition hover:text-new/80"
        >
          Primeiro acesso? Criar igreja
        </Link>
      </div>
    </form>
  )
}
