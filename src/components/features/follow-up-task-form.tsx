"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { CheckCircle2, ClipboardList, Loader2 } from "lucide-react"
import { useCreateTask } from "@/hooks/use-create-task"
import { cn } from "@/lib/utils"
import type { AppRole } from "@/types"

type DueOption = "today" | "tomorrow" | "two_days" | "seven_days"

interface FollowUpAssignee {
  id: string
  name: string
  role: AppRole
}

interface FollowUpTask {
  id: string
  description: string
  dueAt: string
  completedAt: string | null
  assigneeName: string
}

interface FollowUpTaskFormProps {
  personId: string
  personName: string
  groupId: string | null
  groupName: string | null
  assignees: FollowUpAssignee[]
  tasks: FollowUpTask[]
}

const dueOptions: Array<{ value: DueOption; label: string; days: number }> = [
  { value: "today", label: "Hoje", days: 0 },
  { value: "tomorrow", label: "Amanhã", days: 1 },
  { value: "two_days", label: "2 dias", days: 2 },
  { value: "seven_days", label: "7 dias", days: 7 },
]

function getRoleLabel(role: AppRole) {
  const labels: Record<AppRole, string> = {
    pastor: "Pastor",
    supervisor: "Supervisor",
    leader: "Líder",
    host: "Anfitrião",
    member: "Membro",
  }

  return labels[role]
}

function buildDueAt(option: DueOption) {
  const selectedOption = dueOptions.find((item) => item.value === option) ?? {
    value: "tomorrow",
    label: "Amanhã",
    days: 1,
  }
  const dueAt = new Date()

  dueAt.setDate(dueAt.getDate() + selectedOption.days)
  dueAt.setHours(18, 0, 0, 0)

  if (selectedOption.days === 0 && dueAt.getTime() <= Date.now()) {
    dueAt.setHours(new Date().getHours() + 2, 0, 0, 0)
  }

  return dueAt.toISOString()
}

function formatDueDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

export function FollowUpTaskForm({
  personId,
  personName,
  groupId,
  groupName,
  assignees,
  tasks,
}: FollowUpTaskFormProps) {
  const [description, setDescription] = useState("")
  const [dueOption, setDueOption] = useState<DueOption>("two_days")
  const [assigneeId, setAssigneeId] = useState(() => assignees[0]?.id ?? "")
  const [saved, setSaved] = useState(false)
  const createTask = useCreateTask()

  useEffect(() => {
    if (!assignees.some((assignee) => assignee.id === assigneeId)) {
      setAssigneeId(assignees[0]?.id ?? "")
    }
  }, [assigneeId, assignees])

  const activeTasks = useMemo(
    () => tasks.filter((task) => !task.completedAt).slice(0, 3),
    [tasks],
  )

  const selectedAssigneeId = assignees.some((assignee) => assignee.id === assigneeId)
    ? assigneeId
    : assignees[0]?.id ?? ""

  const trimmedDescription = description.trim()
  const canCreate = Boolean(groupId && selectedAssigneeId && trimmedDescription) && !createTask.isPending

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canCreate || !groupId) {
      return
    }

    setSaved(false)

    try {
      await createTask.mutateAsync({
        assigneeId: selectedAssigneeId,
        groupId,
        description: trimmedDescription,
        dueAt: buildDueAt(dueOption),
        targetType: "person",
        targetId: personId,
      })

      setDescription("")
      setDueOption("two_days")
      setSaved(true)
    } catch {
      setSaved(false)
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Criar acompanhamento
          </h3>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            Transforme o cuidado em uma ação simples, com responsável e prazo curto.
          </p>
        </div>
      </div>

      {activeTasks.length > 0 && (
        <div className="mb-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg)] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Em aberto
          </p>
          <div className="space-y-2">
            {activeTasks.map((task) => (
              <div key={task.id} className="rounded-lg bg-[var(--surface)] px-3 py-2">
                <p className="text-sm font-medium leading-5 text-[var(--text-primary)]">
                  {task.description}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {task.assigneeName} · até {formatDueDate(task.dueAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!groupId || assignees.length === 0 ? (
        <p className="rounded-lg border border-[var(--warn-border)] bg-[var(--warn-bg)] px-3 py-2 text-xs leading-5 text-[var(--warn)]">
          Para criar acompanhamento, esta pessoa precisa estar ligada a uma célula com líder ou supervisor.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="follow-up-description" className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
              O que precisa acontecer?
            </label>
            <textarea
              id="follow-up-description"
              value={description}
              onChange={(event) => {
                setSaved(false)
                setDescription(event.target.value)
              }}
              maxLength={500}
              rows={3}
              placeholder={`Ex.: Procurar ${personName.split(" ")[0]} e registrar retorno breve.`}
              className="min-h-[88px] w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[11px] leading-4 text-[var(--text-muted)]">
                Uma ação curta. Sem transformar em relatório.
              </p>
              <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
                {description.length}/500
              </span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Responsável</p>
            <div className="space-y-2">
              {assignees.map((assignee) => {
                const selected = selectedAssigneeId === assignee.id

                return (
                  <button
                    key={assignee.id}
                    type="button"
                    onClick={() => {
                      setSaved(false)
                      setAssigneeId(assignee.id)
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition",
                      selected
                        ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{assignee.name}</span>
                      <span className="block text-xs opacity-80">
                        {getRoleLabel(assignee.role)}{groupName ? ` · ${groupName}` : ""}
                      </span>
                    </span>
                    {selected && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Prazo</p>
            <div className="grid grid-cols-4 gap-2">
              {dueOptions.map((option) => {
                const selected = dueOption === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSaved(false)
                      setDueOption(option.value)
                    }}
                    className={cn(
                      "rounded-full border px-2 py-2 text-xs font-medium transition",
                      selected
                        ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {createTask.isError && (
            <p className="rounded-lg border border-[var(--risk-border)] bg-[var(--risk-bg)] px-3 py-2 text-xs leading-5 text-[var(--risk)]">
              Não foi possível criar o acompanhamento agora.
            </p>
          )}

          {saved && (
            <p className="flex items-center gap-2 rounded-lg border border-[var(--ok-border)] bg-[var(--ok-bg)] px-3 py-2 text-xs leading-5 text-[var(--ok)]">
              <CheckCircle2 className="h-4 w-4" /> Acompanhamento criado.
            </p>
          )}

          <button
            type="submit"
            disabled={!canCreate}
            className="flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--bg)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createTask.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...
              </>
            ) : (
              "Criar acompanhamento"
            )}
          </button>
        </form>
      )}
    </section>
  )
}
