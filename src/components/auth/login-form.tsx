"use client"

import Link from "next/link"
import { LoaderCircle } from "lucide-react"
import { useState, useCallback } from "react"
import { useLogin } from "@/hooks/use-auth"
import { isApiClientError } from "@/lib/api-client"

export function LoginForm() {
  const loginMutation = useLogin({ redirectTo: "/" })
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [validationErrors, setValidationErrors] = useState<{email?: string; password?: string}>({})

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    console.log("[LoginForm] handleSubmit called")

    const errors: {email?: string; password?: string} = {}

    if (!email.trim()) {
      errors.email = "Informe seu e-mail."
    } else if (!email.includes("@")) {
      errors.email = "E-mail inválido."
    }

    if (!password.trim()) {
      errors.password = "Informe sua senha."
    } else if (password.length < 8) {
      errors.password = "A senha precisa ter pelo menos 8 caracteres."
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors({})
    console.log("[LoginForm] calling mutate with", { email, password })
    loginMutation.mutate({ email, password })
  }, [email, password, loginMutation])

  const errorMessage = isApiClientError(loginMutation.error)
    ? loginMutation.error.message
    : null

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      {/* E-mail */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-stone-700" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
          placeholder="voce@igreja.org"
        />
        {validationErrors.email ? (
          <p className="text-sm text-risk">{validationErrors.email}</p>
        ) : null}
      </div>

      {/* Senha */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-stone-700" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
          placeholder="Sua senha"
        />
        {validationErrors.password ? (
          <p className="text-sm text-risk">{validationErrors.password}</p>
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

      {/* Erro da API */}
      {errorMessage ? (
        <p className="text-sm text-risk font-medium">{errorMessage}</p>
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