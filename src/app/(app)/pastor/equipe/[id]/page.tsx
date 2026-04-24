"use client"

import { useParams, useRouter } from "next/navigation"
import { useSupervisorProfile } from "@/hooks/use-supervisor-profile"
import { GroupCard } from "@/components/pastor/group-card"
import { User, AlertTriangle, ClipboardList, TrendingUp, Users, ArrowLeft } from "lucide-react"

export default function SupervisorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data, isLoading } = useSupervisorProfile(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-xl bg-[var(--surface)]" />
        <div className="h-32 animate-pulse rounded-xl bg-[var(--surface)]" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--surface)]" />
          ))}
        </div>
      </div>
    )
  }

  const supervisor = data?.supervisor
  const groups = data?.groups ?? []
  const overdueTasks = data?.overdueTasks ?? []

  const totalMembers = groups.reduce((sum, g) => sum + g.memberCount, 0)
  const totalAtRisk = groups.reduce((sum, g) => sum + g.atRiskCount, 0)
  const avgAttendance =
    groups.length > 0
      ? Math.round(groups.reduce((sum, g) => sum + g.averageAttendance, 0) / groups.length)
      : 0

  return (
    <div className="space-y-6">
      {/* Header com voltar */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.replace("/pastor/equipe")} className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-muted)]">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">{supervisor?.name}</h1>
          <p className="text-sm text-[var(--text-muted)]">Supervisora</p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg)] text-[var(--text-muted)]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Células</p>
            <p className="text-lg font-semibold">{groups.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg)] text-[var(--text-muted)]">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Presença Média</p>
            <p className="text-lg font-semibold">{avgAttendance}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg)] text-[var(--text-muted)]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Membros</p>
            <p className="text-lg font-semibold">{totalMembers}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg)] text-[var(--text-muted)]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Em Risco</p>
            <p className="text-lg font-semibold">{totalAtRisk}</p>
          </div>
        </div>
      </div>

      {/* Tasks atrasadas */}
      {overdueTasks.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
            Tarefas Atrasadas
          </h2>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-3 dark:bg-amber-950/20"
              >
                <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{task.description}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {task.assigneeName}
                    {task.groupName ? ` · ${task.groupName}` : ""} · Venceu{" "}
                    {new Date(task.dueAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Células */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
          Células Supervisionadas
        </h2>
        <div className="space-y-2">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </section>
    </div>
  )
}
