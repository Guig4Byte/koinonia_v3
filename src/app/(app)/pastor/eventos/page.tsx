export default function PastorEventosPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Leituras dos encontros
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
          Esta visão ainda não é a entrada principal do pastor.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          Para o pastor, os encontros devem aparecer como sinais dentro de pessoas, equipe e regiões em atenção — não como uma lista administrativa de eventos.
        </p>
      </div>
    </div>
  )
}
