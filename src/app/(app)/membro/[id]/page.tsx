"use client"

import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMe } from "@/hooks/use-auth"
import { useSharedMemberProfile } from "@/hooks/use-shared-member-profile"
import { ArrowLeft, Phone, Calendar, Users, AlertTriangle, CheckCircle2, XCircle, MessageSquare } from "lucide-react"



function riskLabel(level: string | null) {
  switch (level) {
    case "low": return "Baixo"
    case "medium": return "Médio"
    case "high": return "Alto"
    case "critical": return "Crítico"
    default: return "—"
  }
}

function riskColor(level: string | null) {
  switch (level) {
    case "low": return "text-emerald-600"
    case "medium": return "text-yellow-600"
    case "high": return "text-orange-600"
    case "critical": return "text-red-600"
    default: return "text-[var(--text-muted)]"
  }
}

export default function MembroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: personId } = use(params)
  const router = useRouter()
  const { data: user } = useMe()
  const { data, isLoading, error } = useSharedMemberProfile(personId)

  const backRoute =
    user?.role === "pastor" ? "/pastor/busca" :
    user?.role === "supervisor" ? "/supervisor/celulas" :
    "/lider/membros"

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <p className="text-[var(--text-muted)]">Não foi possível carregar o perfil.</p>
        <button onClick={() => router.replace(backRoute)} className="mt-4 text-[var(--accent)]">
          Voltar
        </button>
      </div>
    )
  }

  const { person } = data
  const presentCount = person.attendances.filter((a) => a.present).length
  const totalCount = person.attendances.length
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-[var(--bg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/80 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.replace(backRoute)} className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)]">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Perfil do Membro</h1>
        </div>
      </header>

      <main className="flex-1 px-5 pb-10 pt-4">
        {/* Header do Membro */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface)] text-2xl font-bold text-[var(--text-muted)]">
            {person.photoUrl ? (
              <img src={person.photoUrl} alt={person.name} className="h-full w-full object-cover" />
            ) : (
              person.name.charAt(0)
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{person.name}</h2>
            {person.groupName && (
              <p className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                <Users className="h-3.5 w-3.5" /> {person.groupName}
              </p>
            )}
          </div>
        </div>

        {/* Dados Básicos */}
        <section className="mb-6 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="text-sm font-medium text-[var(--text-muted)]">Dados Básicos</h3>
          {person.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-sm text-[var(--text-primary)]">{person.phone}</span>
            </div>
          )}
          {person.birthDate && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-sm text-[var(--text-primary)]">
                {new Date(person.birthDate).toLocaleDateString("pt-BR")}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-sm text-[var(--text-primary)]">
              Risco: <span className={`font-medium ${riskColor(person.riskLevel)}`}>{riskLabel(person.riskLevel)}</span>
              {person.riskScore != null && (
                <span className="ml-1 text-xs text-[var(--text-muted)]">({person.riskScore} pts)</span>
              )}
            </span>
          </div>
        </section>

        {/* Presença */}
        <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="mb-3 text-sm font-medium text-[var(--text-muted)]">Presença (últimos {totalCount} encontros)</h3>
          {totalCount === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nenhum registro de presença.</p>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                  <div className="h-2 rounded-full bg-[var(--accent)] transition-all" style={{ width: `${attendanceRate}%` }} />
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{attendanceRate}%</span>
              </div>
              <div className="space-y-2">
                {person.attendances.map((a, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--bg)] px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{a.eventTypeName}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(a.eventDate).toLocaleDateString("pt-BR")} · {a.groupName}
                      </p>
                    </div>
                    {a.present ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Interações */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="mb-3 text-sm font-medium text-[var(--text-muted)]">Interações Recentes</h3>
          {person.interactions.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nenhuma interação registrada.</p>
          ) : (
            <div className="space-y-3">
              {person.interactions.map((i) => (
                <div key={i.id} className="border-l-2 border-[var(--accent)] pl-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span className="text-xs font-medium text-[var(--text-primary)]">{i.kind}</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      por {i.authorName} · {new Date(i.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">{i.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Botão Voltar */}
        <div className="mt-8">
          <Link href={backRoute} className="flex w-full items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--border)]">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Link>
        </div>
      </main>
    </div>
  )
}
