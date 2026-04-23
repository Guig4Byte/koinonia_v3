export default function PastorPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-12 sm:px-10">
      <section className="w-full rounded-[2rem] border border-white/70 bg-card/95 p-8 shadow-[0_30px_90px_-48px_rgba(44,44,42,0.45)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
          Pastor
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900">
          Visao pastoral habilitada.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
          A autenticacao da Onda 1 esta ativa. Os dashboards do pastor entram nas
          proximas ondas.
        </p>
      </section>
    </main>
  );
}
