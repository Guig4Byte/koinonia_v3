import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12 sm:px-10">
      <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-stone-500">
            Koinonia
          </p>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              Veja a saude da igreja em segundos, com calma e contexto.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-stone-600">
              Entre para acompanhar pessoas, renovar sessoes com JWT e preparar a
              proxima onda do cuidado pastoral.
            </p>
          </div>
        </section>

        <div className="flex justify-center lg:justify-end">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
