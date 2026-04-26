"use client"

import Link from "next/link"
import { ContextSignalList } from "@/components/features/context-signal-list"
import { useLeaderTasks } from "@/hooks/use-leader-tasks"
import { useToggleTask } from "@/hooks/use-toggle-task"
import { Loader2, CheckCircle2, Circle, CalendarDays, User, ArrowRight } from "lucide-react"

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date()
}

export default function AcoesPage() {
  const { data, isLoading, isError } = useLeaderTasks()
  const toggleMutation = useToggleTask()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <p className="text-[var(--text-secondary)]">Erro ao carregar ações.</p>
        <p className="text-sm text-[var(--text-muted)]">
          Tente recarregar a página.
        </p>
      </div>
    )
  }

  const pending = data.tasks.filter((t) => !t.completedAt)
  const completed = data.tasks.filter((t) => t.completedAt)

  return (
    <div className="flex flex-col gap-6">
      <section className="opacity-0 animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Ações da célula
        </p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight text-[var(--text-primary)]">
          O que precisa virar contato?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          {pending.length} contato{pending.length !== 1 ? "s" : ""} pendente{pending.length !== 1 ? "s" : ""}. Marque como concluído após o retorno.
        </p>
      </section>

      <section
        className="grid grid-cols-2 gap-3 opacity-0 animate-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4 shadow-sm">
          <p className="text-2xl font-semibold text-[var(--text-primary)]">{pending.length}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">em aberto</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--card)] p-4 shadow-sm">
          <p className="text-2xl font-semibold text-[var(--ok)]">{completed.length}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">concluídas</p>
        </div>
      </section>

      {pending.length > 0 && (
        <div
          className="flex flex-col gap-3 opacity-0 animate-fade-up"
          style={{ animationDelay: "160ms" }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Para fazer
          </h3>
          {pending.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => toggleMutation.mutate(task.id)}
              isLoading={toggleMutation.isPending}
            />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div
          className="flex flex-col gap-3 opacity-0 animate-fade-up"
          style={{ animationDelay: "240ms" }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Concluídas
          </h3>
          {completed.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => toggleMutation.mutate(task.id)}
              isLoading={toggleMutation.isPending}
            />
          ))}
        </div>
      )}

      {pending.length === 0 && completed.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center opacity-0 animate-fade-up">
          <CheckCircle2 className="h-12 w-12 text-[var(--ok)]" />
          <p className="text-[var(--text-secondary)]">Tudo em ordem.</p>
          <p className="text-sm text-[var(--text-muted)]">
            Nenhum contato pendente agora.
          </p>
        </div>
      )}
    </div>
  )
}

interface TaskCardProps {
  task: {
    id: string
    description: string
    dueAt: string
    completedAt: string | null
    personId: string | null
    personName: string | null
  }
  onToggle: () => void
  isLoading: boolean
}

function getTaskSignals(task: TaskCardProps["task"], overdue: boolean) {
  const signals: string[] = []

  if (overdue) {
    signals.push("Prazo já passou")
  } else {
    signals.push(`Prazo até ${formatDate(task.dueAt)}`)
  }

  if (task.personName) {
    signals.push(`Pessoa: ${task.personName}`)
  }

  if (task.completedAt) {
    signals.push("Acompanhamento concluído")
  } else {
    signals.push("Ainda precisa de retorno")
  }

  return signals
}

function TaskCard({ task, onToggle, isLoading }: TaskCardProps) {
  const overdue = !task.completedAt && isOverdue(task.dueAt)

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl bg-[var(--card)] p-4 border shadow-sm transition ${
        task.completedAt
          ? "border-[var(--border-light)] opacity-70"
          : overdue
            ? "border-[var(--risk)]"
            : "border-[var(--border)]"
      }`}
    >
      <button
        onClick={onToggle}
        disabled={isLoading}
        className="mt-0.5 shrink-0 transition hover:scale-110 disabled:opacity-50"
      >
        {task.completedAt ? (
          <CheckCircle2 className="h-6 w-6 text-[var(--ok)]" />
        ) : (
          <Circle className="h-6 w-6 text-[var(--border)]" />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1">
        <p
          className={`text-sm ${
            task.completedAt
              ? "text-[var(--text-muted)] line-through"
              : "text-[var(--text-primary)]"
          }`}
        >
          {task.description}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`flex items-center gap-1 text-xs ${
              overdue ? "text-[var(--risk)] font-medium" : "text-[var(--text-muted)]"
            }`}
          >
            <CalendarDays className="h-3 w-3" />
            {overdue ? "Atrasado" : "Até"} {formatDate(task.dueAt)}
          </span>

          {task.personId && (
            <Link
              href={`/membro/${task.personId}`}
              className="flex items-center gap-1 text-xs text-[var(--new)] transition hover:opacity-80"
            >
              <User className="h-3 w-3" />
              {task.personName ?? "Pessoa"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        <ContextSignalList
          signals={getTaskSignals(task, overdue)}
          tone={task.completedAt ? "ok" : overdue ? "risk" : "neutral"}
          className="mt-2"
        />
      </div>
    </div>
  )
}
