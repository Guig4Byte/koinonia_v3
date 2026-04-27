"use client";

import { cn } from "@/lib/utils";

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "default" | "risk" | "ok";
  helperText?: string;
}

export function SummaryCard({
  label,
  value,
  icon,
  accent = "default",
  helperText,
}: SummaryCardProps) {
  const accentClass = {
    default: "bg-[var(--surface)]",
    risk: "bg-[var(--risk-bg)] border-[var(--risk-border)]",
    ok: "bg-[var(--ok-bg)] border-[var(--ok-border)]",
  };

  const iconClass = {
    default: "text-[var(--text-muted)]",
    risk: "text-[var(--risk)]",
    ok: "text-[var(--ok)]",
  };

  return (
    <div
      className={cn(
        "flex min-h-[5rem] items-center gap-3 rounded-xl border border-[var(--border-light)] p-3",
        accentClass[accent],
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--card)]",
          iconClass[accent],
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs leading-4 text-[var(--text-muted)]">{label}</p>
        <p className="text-lg font-semibold leading-6 tabular-nums text-[var(--text-primary)]">
          {value}
        </p>
        <p className="mt-0.5 min-h-4 truncate text-[0.68rem] leading-4 text-[var(--text-muted)]">
          {helperText ?? "\u00a0"}
        </p>
      </div>
    </div>
  );
}
