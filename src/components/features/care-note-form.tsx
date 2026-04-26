"use client"

import { useState, type FormEvent } from "react"
import { CheckCircle2, HeartHandshake, Loader2 } from "lucide-react"
import { useCreateInteraction } from "@/hooks/use-create-interaction"
import { cn } from "@/lib/utils"
import type { InteractionKind } from "@/types"

const interactionKinds: Array<{ value: InteractionKind; label: string }> = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "call", label: "Ligação" },
  { value: "visit", label: "Visita" },
  { value: "prayer", label: "Oração" },
  { value: "note", label: "Observação" },
]

interface CareNoteFormProps {
  personId: string
}

export function CareNoteForm({ personId }: CareNoteFormProps) {
  const [kind, setKind] = useState<InteractionKind>("whatsapp")
  const [content, setContent] = useState("")
  const [saved, setSaved] = useState(false)
  const createInteraction = useCreateInteraction(personId)

  const trimmedContent = content.trim()
  const canSubmit = trimmedContent.length > 0 && !createInteraction.isPending

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setSaved(false)

    try {
      await createInteraction.mutateAsync({
        kind,
        content: trimmedContent,
      })
      setContent("")
      setKind("whatsapp")
      setSaved(true)
    } catch {
      setSaved(false)
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
          <HeartHandshake className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Registrar cuidado
          </h3>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            Anote só o essencial para a liderança lembrar e continuar perto.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Tipo de contato</p>
          <div className="flex flex-wrap gap-2">
            {interactionKinds.map((option) => {
              const selected = kind === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setKind(option.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
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

        <div>
          <label htmlFor="care-note-content" className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
            Observação breve
          </label>
          <textarea
            id="care-note-content"
            value={content}
            onChange={(event) => {
              setSaved(false)
              setContent(event.target.value)
            }}
            maxLength={2000}
            rows={4}
            placeholder="Ex.: Conversei pelo WhatsApp. Está mais tranquilo e pediu oração pela família."
            className="min-h-[112px] w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[11px] leading-4 text-[var(--text-muted)]">
              Evite detalhes sensíveis além do necessário.
            </p>
            <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
              {content.length}/2000
            </span>
          </div>
        </div>

        {createInteraction.isError && (
          <p className="rounded-lg border border-[var(--risk-border)] bg-[var(--risk-bg)] px-3 py-2 text-xs leading-5 text-[var(--risk)]">
            Não foi possível salvar agora. Tente novamente em instantes.
          </p>
        )}

        {saved && (
          <p className="flex items-center gap-2 rounded-lg border border-[var(--ok-border)] bg-[var(--ok-bg)] px-3 py-2 text-xs leading-5 text-[var(--ok)]">
            <CheckCircle2 className="h-4 w-4" /> Registro salvo no histórico.
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--bg)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createInteraction.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : (
            "Salvar anotação"
          )}
        </button>
      </form>
    </section>
  )
}
