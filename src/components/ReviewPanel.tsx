"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";

type Decision = "PENDING" | "INCLUDE" | "EXCLUDE" | "MAYBE";

const DECISIONS: { value: Decision; icon: string; label: string; active: string; idle: string }[] = [
  { value: "INCLUDE", icon: "✓", label: "Include",
    active: "bg-[var(--slr-include)] text-[var(--slr-bg)] border-[var(--slr-include)] shadow-lg shadow-[var(--slr-include)]/20",
    idle:   "border-[rgba(255,255,255,0.08)] text-[var(--slr-muted)] hover:border-[var(--slr-include)]/40 hover:text-[var(--slr-include)]" },
  { value: "EXCLUDE", icon: "✕", label: "Exclude",
    active: "bg-[var(--slr-exclude)] text-[var(--slr-bg)] border-[var(--slr-exclude)] shadow-lg shadow-[var(--slr-exclude)]/20",
    idle:   "border-[rgba(255,255,255,0.08)] text-[var(--slr-muted)] hover:border-[var(--slr-exclude)]/40 hover:text-[var(--slr-exclude)]" },
  { value: "MAYBE",   icon: "?", label: "Maybe",
    active: "bg-[var(--slr-maybe)] text-[var(--slr-bg)] border-[var(--slr-maybe)] shadow-lg shadow-[var(--slr-maybe)]/20",
    idle:   "border-[rgba(255,255,255,0.08)] text-[var(--slr-muted)] hover:border-[var(--slr-maybe)]/40 hover:text-[var(--slr-maybe)]" },
  { value: "PENDING", icon: "↺", label: "Reset",
    active: "bg-[var(--slr-dim)] text-[var(--slr-ink)] border-[var(--slr-dim)]",
    idle:   "border-[rgba(255,255,255,0.08)] text-[var(--slr-dim)] hover:border-[var(--slr-dim)]/50 hover:text-[var(--slr-muted)]" },
];

interface Article {
  id: string; title: string; authors?: string|null; firstAuthor?: string|null;
  journal?: string|null; publicationYear?: number|null; pmid?: string|null; doi?: string|null;
  myReview?: { decision: string; notes?: string|null; updatedAt: Date }|null;
}

export function ReviewPanel({ article, projectId, onClose, onUpdated }: {
  article: Article; projectId: string; onClose: () => void; onUpdated: () => void;
}) {
  const current = (article.myReview?.decision as Decision) ?? "PENDING";
  const [decision, setDecision] = useState<Decision>(current);
  const [notes, setNotes]       = useState(article.myReview?.notes ?? "");
  const [saved, setSaved]       = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => {
    setDecision((article.myReview?.decision as Decision) ?? "PENDING");
    setNotes(article.myReview?.notes ?? "");
    setSaved(false);
  }, [article.id, article.myReview?.decision, article.myReview?.notes]);

  const upsert = api.review.upsert.useMutation({
    onSuccess: () => { setSaved(true); onUpdated(); },
  });

  const save = (d: Decision, n: string) => {
    setSaved(false);
    upsert.mutate({ articleId: article.id, projectId, decision: d, notes: n });
  };

  return (
    <>
      <div className="fixed inset-0 z-10 bg-black/40 md:bg-transparent" onClick={onClose} />
      <div className="fixed inset-0 md:inset-auto md:right-0 md:top-0 md:h-full md:w-[440px] bg-[var(--slr-surface)] border-l border-[rgba(255,255,255,0.07)] z-20 flex flex-col animate-right shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-[var(--slr-gold)]" />
            <span className="text-sm font-semibold text-[var(--slr-ink)]">Review</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--slr-dim)] hover:text-[var(--slr-ink)] hover:bg-[var(--slr-card)] transition-all"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Metadata */}
          <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.06)]">
            <h2 className="text-[14px] font-semibold text-[var(--slr-ink)] leading-snug mb-3">{article.title}</h2>
            {article.authors && (
              <p className="text-xs text-[var(--slr-muted)] mb-3 leading-relaxed">{article.authors}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {article.journal && (
                <span className="text-xs text-[var(--slr-muted)] bg-[var(--slr-card)] px-2.5 py-1 rounded-lg border border-[rgba(255,255,255,0.05)]">
                  {article.journal}
                </span>
              )}
              {article.publicationYear && (
                <span className="text-xs text-[var(--slr-muted)] bg-[var(--slr-card)] px-2.5 py-1 rounded-lg border border-[rgba(255,255,255,0.05)]">
                  {article.publicationYear}
                </span>
              )}
              {article.pmid && (
                <span className="text-xs font-mono text-[var(--slr-dim)] bg-[var(--slr-card)] px-2.5 py-1 rounded-lg border border-[rgba(255,255,255,0.05)]">
                  PMID: {article.pmid}
                </span>
              )}
            </div>
            {article.doi && (
              <p className="mt-2 text-[10px] font-mono text-[var(--slr-dim)] break-all">{article.doi}</p>
            )}
          </div>

          {/* Decision */}
          <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.06)]">
            <p className="text-[10px] font-semibold text-[var(--slr-dim)] uppercase tracking-widest mb-3">Your Decision</p>
            <div className="grid grid-cols-2 gap-2">
              {DECISIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => { setDecision(d.value); save(d.value, notes); }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all duration-200 active:scale-95 ${
                    decision === d.value ? d.active : d.idle
                  }`}
                >
                  <span className="text-base leading-none">{d.icon}</span>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-[var(--slr-dim)] uppercase tracking-widest">Notes</p>
              <span className={`text-[10px] transition-all ${upsert.isPending ? "text-[var(--slr-gold)]" : saved ? "text-[var(--slr-include)]" : "opacity-0"}`}>
                {upsert.isPending ? "Saving…" : "Saved ✓"}
              </span>
            </div>
            <textarea
              value={notes}
              onChange={e => {
                setNotes(e.target.value);
                setSaved(false);
                if (timer.current) clearTimeout(timer.current);
                timer.current = setTimeout(() => save(decision, e.target.value), 900);
              }}
              placeholder="Add your notes, reasoning, or observations…"
              rows={6}
              className="w-full px-4 py-3 text-sm bg-[var(--slr-card)] border border-[rgba(255,255,255,0.07)] rounded-xl text-[var(--slr-ink)] placeholder-[var(--slr-dim)] focus:outline-none focus:border-[var(--slr-gold)]/40 focus:ring-1 focus:ring-[var(--slr-gold)]/20 resize-none transition-all"
            />
            <p className="text-[10px] text-[var(--slr-dim)] mt-1.5 text-right">{notes.length}/2000</p>
          </div>
        </div>

        {article.myReview?.updatedAt && (
          <div className="px-6 py-3 border-t border-[rgba(255,255,255,0.06)] shrink-0">
            <p className="text-[10px] text-[var(--slr-dim)]">
              Updated {new Date(article.myReview.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
