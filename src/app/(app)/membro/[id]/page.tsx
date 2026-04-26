"use client"

import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  HeartHandshake,
  MessageSquare,
  Phone,
  Users,
  XCircle,
} from "lucide-react"
import { useMe } from "@/hooks/use-auth"
import {
  useSharedMemberProfile,
  type SharedMemberProfile,
} from "@/hooks/use-shared-member-profile"
import type { RiskLevel } from "@/types"
import { cn } from "@/lib/utils"

type CareTone = "risk" | "warn" | "ok"

const careToneClasses: Record<CareTone, string> = {
  risk: "border-[var(--risk-border)] bg-[var(--risk-bg)] text-[var(--risk)]",
  warn: "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn)]",
  ok: "border-[var(--ok-border)] bg-[var(--ok-bg)] text-[var(--ok)]",
}

function riskLabel(level: RiskLevel | null) {
  switch (level) {
    case "green":
      return "Tranquilo"
    case "yellow":
      return "Atenção"
    case "red":
      return "Prioritário"
    default:
      return "Sem leitura"
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getCareReading(
  person: SharedMemberProfile["person"],
  attendanceRate: number,
  totalCount: number,
) {
  if (person.riskLevel === "red") {
    return {
      tone: "risk" as const,
      title: "Cuidado prioritário",
      description:
        "Procure esta pessoa e registre um retorno breve.",
      nextStep: "Procure a pessoa e entenda o contexto.",
    }
  }

  if (person.riskLevel === "yellow") {
    return {
      tone: "warn" as const,
      title: "Acompanhar de perto",
      description:
        "Existe sinal de atenção. Um contato simples agora pode ajudar bastante.",
      nextStep: "Confirme como ela está.",
    }
  }

  if (totalCount > 0 && attendanceRate < 60) {
    return {
      tone: "warn" as const,
      title: "Presença pede atenção",
      description:
        "A frequência recente está baixa. Vale entender se existe algo por trás.",
      nextStep: "Pergunte com cuidado e registre um breve retorno.",
    }
  }

  if (person.interactions.length === 0) {
    return {
      tone: "warn" as const,
      title: "Sem histórico ainda",
      description:
        "Ainda não há registro. Anote quando houver contato relevante.",
      nextStep: "Registre uma primeira anotação quando houver contato.",
    }
  }

  return {
    tone: "ok" as const,
    title: "Cuidado estável por agora",
    description:
      "Nenhum alerta por agora. Continue perto e registre mudanças importantes.",
    nextStep: "Mantenha por perto nos encontros.",
  }
}

function getInteractionKindLabel(kind: string) {
  const labels: Record<string, string> = {
    call: "Ligação",
    whatsapp: "WhatsApp",
    visit: "Visita",
    prayer: "Oração",
    note: "Anotação",
  }

  return labels[kind] ?? kind
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
  const presentCount = person.attendances.filter((attendance) => attendance.present).length
  const totalCount = person.attendances.length
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
  const careReading = getCareReading(person, attendanceRate, totalCount)

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col bg-[var(--bg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/80 px-5 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.replace(backRoute)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Perfil pastoral</h1>
        </div>
      </header>

      <main className="flex-1 px-5 pb-10 pt-4">
        <section className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface)] text-2xl font-bold text-[var(--text-muted)]">
            {person.photoUrl ? (
              <img src={person.photoUrl} alt={person.name} className="h-full w-full object-cover" />
            ) : (
              getInitials(person.name)
            )}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-[var(--text-primary)]">{person.name}</h2>
            {person.groupName && (
              <p className="mt-1 flex items-center gap-1 text-sm text-[var(--text-muted)]">
                <Users className="h-3.5 w-3.5" /> {person.groupName}
              </p>
            )}
            <span className={cn(
              "mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
              careReading.tone === "risk" && "bg-[var(--risk-bg)] text-[var(--risk)]",
              careReading.tone === "warn" && "bg-[var(--warn-bg)] text-[var(--warn)]",
              careReading.tone === "ok" && "bg-[var(--ok-bg)] text-[var(--ok)]",
            )}>
              {riskLabel(person.riskLevel)}
            </span>
          </div>
        </section>

        <section className={cn("mb-6 rounded-2xl border p-4", careToneClasses[careReading.tone])}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/60 dark:bg-black/10">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-current">
                Leitura pastoral
              </p>
              <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)]">
                {careReading.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {careReading.description}
              </p>
              <p className="mt-3 text-xs font-semibold text-[var(--accent)]">
                {careReading.nextStep}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="text-sm font-medium text-[var(--text-muted)]">Dados para contato</h3>
          {person.phone ? (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-sm text-[var(--text-primary)]">{person.phone}</span>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Sem telefone cadastrado.
            </p>
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
              Estado pastoral: <span className="font-medium">{riskLabel(person.riskLevel)}</span>
              {person.riskScore != null && (
                <span className="ml-1 text-xs text-[var(--text-muted)]">({person.riskScore} pts)</span>
              )}
            </span>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="mb-1 text-sm font-medium text-[var(--text-muted)]">
            Presença como sinal
          </h3>
          <p className="mb-3 text-xs leading-5 text-[var(--text-muted)]">
            Últimos {totalCount} encontros usados para entender continuidade.
          </p>
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
                {person.attendances.map((attendance, index) => (
                  <div key={`${attendance.eventDate}-${index}`} className="flex items-center justify-between rounded-lg bg-[var(--bg)] px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{attendance.eventTypeName}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(attendance.eventDate).toLocaleDateString("pt-BR")} · {attendance.groupName}
                      </p>
                    </div>
                    {attendance.present ? (
                      <CheckCircle2 className="h-5 w-5 text-[var(--ok)]" />
                    ) : (
                      <XCircle className="h-5 w-5 text-[var(--risk)]" />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="mb-1 text-sm font-medium text-[var(--text-muted)]">
            Histórico pastoral
          </h3>
          <p className="mb-3 text-xs leading-5 text-[var(--text-muted)]">
            Registros que ajudam a liderança a lembrar o contexto antes de agir.
          </p>
          {person.interactions.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nenhuma interação registrada.</p>
          ) : (
            <div className="space-y-3">
              {person.interactions.map((interaction) => (
                <div key={interaction.id} className="border-l-2 border-[var(--accent)] pl-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      {getInteractionKindLabel(interaction.kind)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      por {interaction.authorName} · {new Date(interaction.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-primary)]">{interaction.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8">
          <Link href={backRoute} className="flex w-full items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--border)]">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Link>
        </div>
      </main>
    </div>
  )
}
