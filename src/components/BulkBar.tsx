"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

type Decision = "PENDING" | "INCLUDE" | "EXCLUDE" | "MAYBE";

const OPTIONS: { value: Decision; icon: string; label: string; color: string }[] = [
  { value: "INCLUDE", icon: "✓", label: "Include", color: "hover:bg-[rgba(52,211,153,0.1)] hover:text-[var(--slr-include)]" },
  { value: "EXCLUDE", icon: "✕", label: "Exclude", color: "hover:bg-[rgba(248,113,113,0.1)] hover:text-[var(--slr-exclude)]" },
  { value: "MAYBE",   icon: "?", label: "Maybe",   color: "hover:bg-[rgba(251,191,36,0.1)] hover:text-[var(--slr-maybe)]"  },
  { value: "PENDING", icon: "↺", label: "Reset",   color: "hover:bg-[var(--slr-card)] hover:text-[var(--slr-muted)]"               },
];

export function BulkBar({ selectedCount, articleIds, projectId, onDone }: {
  selectedCount: number; articleIds: string[]; projectId: string; onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const bulk = api.article.bulkUpdateDecision.useMutation({
    onSuccess: () => { setOpen(false); onDone(); },
  });

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 animate-up">
      <div className="bg-[var(--slr-surface)] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[var(--slr-gold)] flex items-center justify-center text-[11px] font-bold text-[var(--slr-bg)]">
            {selectedCount}
          </div>
          <span className="text-sm text-[var(--slr-ink)]/70 font-medium">
            {selectedCount === 1 ? "article" : "articles"} selected
          </span>
        </div>

        <div className="w-px h-4 bg-[rgba(255,255,255,0.1)]" />

        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            disabled={bulk.isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--slr-gold)] text-[var(--slr-bg)] text-xs font-bold rounded-xl hover:bg-[var(--slr-gold-hover)] active:scale-95 transition-all disabled:opacity-50"
          >
            {bulk.isPending ? "Updating…" : "Set decision"}
            <span className="text-[10px] opacity-60">{open ? "▲" : "▼"}</span>
          </button>

          {open && (
            <div className="absolute bottom-full mb-2 left-0 bg-[var(--slr-surface)] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-xl py-1.5 min-w-[150px] animate-scale overflow-hidden">
              {OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => bulk.mutate({ articleIds, decision: opt.value, projectId })}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--slr-ink)]/70 transition-colors ${opt.color}`}
                >
                  <span className="w-4 text-center font-bold">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={onDone} className="text-xs text-[rgba(255,255,255,0.25)] hover:text-[rgba(255,255,255,0.6)] transition-colors">
          Clear
        </button>
      </div>
    </div>
  );
}
