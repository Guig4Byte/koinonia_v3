export default function SupervisorEventosPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Leituras dos encontros
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
          A supervisão lê encontros dentro de cada célula.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          O encontro deve revelar queda, ausência, presença pendente e necessidade de apoiar o líder. Por isso, essa leitura está concentrada no detalhe da célula.
        </p>
      </div>
    </div>
  )
}
