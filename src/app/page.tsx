import { CalendarDays, HeartHandshake, ShieldCheck, Users } from "lucide-react";

const foundationCards = [
  {
    title: "Banco modelado",
    description:
      "Schema Prisma, migration inicial e seed com igreja, liderança, células e presença histórica.",
    icon: ShieldCheck,
    accent: "from-ok-bg to-white",
  },
  {
    title: "UX pastoral",
    description:
      "Tema visual sóbrio, fonte Inter e animações suaves para uma leitura confortável no mobile.",
    icon: HeartHandshake,
    accent: "from-warn-bg to-white",
  },
  {
    title: "Base para as ondas",
    description:
      "App Router, TypeScript strict, utilitários compartilhados e stack pronta para autenticação e dashboards.",
    icon: Users,
    accent: "from-new-bg to-white",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12 sm:px-10 lg:px-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-card/90 p-8 shadow-[0_24px_80px_-40px_rgba(44,44,42,0.4)] backdrop-blur sm:p-10">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/70 to-transparent" />

        <div className="relative flex flex-col gap-10">
          <div className="flex animate-fade-up flex-col gap-5 opacity-0 [animation-delay:60ms] [animation-fill-mode:forwards]">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-badge uppercase tracking-[0.24em] text-stone-600">
              <CalendarDays className="h-4 w-4 text-new" />
              Onda 0 concluída
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
                Fundação pastoral pronta para o Koinonia evoluir com Next.js 16.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-stone-600">
                Esta base entrega App Router, Tailwind temático, Prisma com PostgreSQL,
                seed inicial da Comunidade Esperança e utilitários compartilhados para as próximas ondas.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="grid gap-4 sm:grid-cols-3">
              {foundationCards.map(({ title, description, icon: Icon, accent }, index) => (
                <article
                  key={title}
                  className="animate-fade-up rounded-[1.75rem] border border-stone-200 bg-gradient-to-br p-5 opacity-0 shadow-sm [animation-fill-mode:forwards]"
                  style={{
                    animationDelay: `${180 + index * 120}ms`,
                  }}
                >
                  <div className={`mb-5 inline-flex rounded-2xl bg-gradient-to-br ${accent} p-3`}>
                    <Icon className="h-6 w-6 text-stone-700" />
                  </div>
                  <h2 className="mb-2 text-card-title font-semibold text-stone-900">{title}</h2>
                  <p className="text-card-meta text-stone-600">{description}</p>
                </article>
              ))}
            </div>

            <aside className="animate-fade-up rounded-[1.75rem] border border-stone-200 bg-stone-900 p-6 text-stone-50 opacity-0 shadow-xl [animation-delay:420ms] [animation-fill-mode:forwards]">
              <p className="text-badge uppercase tracking-[0.24em] text-stone-300">Seed inicial</p>
              <ul className="mt-5 space-y-4 text-card-meta text-stone-200">
                <li>Comunidade Esperança com Roberto, Ana e Bruno.</li>
                <li>3 células: Esperança, Ágape e Shalom.</li>
                <li>10 membros distribuídos e 3 eventos passados com presenças variadas.</li>
                <li>Tipos de evento: Célula e EMC.</li>
              </ul>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-300">
                O projeto já está preparado para autenticação JWT, Query cache,
                formulários com Zod e testes com Vitest.
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
