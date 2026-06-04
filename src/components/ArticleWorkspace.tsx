"use client";

import { useState, useCallback, useTransition } from "react";
import { api } from "~/trpc/react";
import { ReviewPanel } from "~/components/ReviewPanel";
import { DecisionBadge } from "~/components/DecisionBadge";
import { BulkBar } from "~/components/BulkBar";

type Decision = "PENDING" | "INCLUDE" | "EXCLUDE" | "MAYBE";
type FilterDecision = "ALL" | Decision;
type SortField = "title" | "firstAuthor" | "journal" | "publicationYear" | "importedAt";

const TABS: { label: string; value: FilterDecision }[] = [
  { label: "All",     value: "ALL"     },
  { label: "Pending", value: "PENDING" },
  { label: "Include", value: "INCLUDE" },
  { label: "Exclude", value: "EXCLUDE" },
  { label: "Maybe",   value: "MAYBE"   },
];

const leftBorder: Record<Decision, string> = {
  INCLUDE: "border-l-[var(--slr-include)]",
  EXCLUDE: "border-l-[var(--slr-exclude)]",
  MAYBE:   "border-l-[var(--slr-maybe)]",
  PENDING: "border-l-transparent",
};

const COLS: { label: string; field: SortField }[] = [
  { label: "Title",        field: "title"           },
  { label: "First Author", field: "firstAuthor"     },
  { label: "Journal",      field: "journal"         },
  { label: "Year",         field: "publicationYear" },
];

export function ArticleWorkspace({
  projectId, orgSlug, projectSlug, articleCount,
}: { projectId: string; orgSlug: string; projectSlug: string; articleCount: number; userId: string }) {

  const [search, setSearch]               = useState("");
  const [debouncedSearch, setDebounced]   = useState("");
  const [decision, setDecision]           = useState<FilterDecision>("ALL");
  const [sortBy, setSortBy]               = useState<SortField>("importedAt");
  const [sortDir, setSortDir]             = useState<"asc"|"desc">("desc");
  const [page, setPage]                   = useState(1);
  const [selected, setSelected]           = useState<Set<string>>(new Set());
  const [reviewId, setReviewId]           = useState<string|null>(null);
  const [, startT]                        = useTransition();

  const utils = api.useUtils();

  const { data, isLoading, isFetching } = api.article.list.useQuery(
    { projectId, search: debouncedSearch, decision, sortBy, sortDir, page, pageSize: 10 },
    { placeholderData: (p) => p },
  );

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    const t = setTimeout(() => startT(() => { setDebounced(v); setPage(1); }), 300);
    return () => clearTimeout(t);
  }, []);

  const handleSort = (f: SortField) => {
    if (sortBy === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(f); setSortDir("asc"); }
    setPage(1);
  };

  const toggleOne = (id: string) =>
    setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () => {
    if (!data) return;
    const ids = data.articles.map(a => a.id);
    setSelected(selected.size === ids.length ? new Set() : new Set(ids));
  };

  const Arrow = ({ f }: { f: SortField }) =>
    sortBy === f
      ? <span className="text-[var(--slr-gold)] ml-1 text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>
      : <span className="text-[rgba(255,255,255,0.15)] ml-1 text-[10px]">↕</span>;

  const reviewArticle = data?.articles.find(a => a.id === reviewId) ?? null;
  const counts = data?.decisionCounts;

  if (articleCount === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center animate-scale">
          <div className="w-16 h-16 rounded-2xl bg-[var(--slr-gold)]/10 border border-[var(--slr-gold)]/20 flex items-center justify-center mx-auto mb-5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-[var(--slr-gold)]">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="font-serif text-2xl font-bold text-[var(--slr-ink)] mb-2">No articles yet.</p>
          <p className="text-sm text-[var(--slr-muted)] mb-6 max-w-xs mx-auto">
            Import your PubMed Excel export to start screening.
          </p>
          <a
            href={`/orgs/${orgSlug}/${projectSlug}/import`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--slr-gold)] text-[var(--slr-bg)] text-sm font-bold rounded-xl hover:bg-[var(--slr-gold-hover)] active:scale-95 transition-all shadow-lg shadow-[var(--slr-gold)]/15"
          >
            Import Articles
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${reviewId ? "md:mr-[440px]" : ""}`}>

        {/* Controls */}
        <div className="px-4 md:px-8 py-3 border-b border-[rgba(255,255,255,0.06)] bg-[var(--slr-bg)] space-y-2">
          {/* Filter tabs — scrollable on mobile */}
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none pb-0.5">
            {TABS.map(tab => {
              const active = decision === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => { setDecision(tab.value); setPage(1); }}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
                    active ? "text-[var(--slr-ink)]" : "text-[var(--slr-muted)] hover:text-[var(--slr-ink)]"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 bg-[var(--slr-surface)] rounded-lg border border-[rgba(255,255,255,0.08)] animate-scale" />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {tab.label}
                    {counts && (
                      <span className={`text-[10px] ${active ? "text-[var(--slr-muted)]" : "text-[rgba(255,255,255,0.15)]"}`}>
                        {counts[tab.value]}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Search — full width on mobile */}
          <div className="relative">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--slr-dim)]">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text" value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Search articles…"
              className="w-full pl-8 pr-3 py-2 text-xs bg-[var(--slr-surface)] border border-[rgba(255,255,255,0.07)] rounded-lg text-[var(--slr-ink)] placeholder-[var(--slr-dim)] focus:outline-none focus:border-[var(--slr-gold)]/40 focus:ring-1 focus:ring-[var(--slr-gold)]/20 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl shimmer" style={{ animationDelay: `${i*40}ms` }} />
              ))}
            </div>
          ) : !data?.articles.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade px-6">
              <p className="font-serif text-xl text-[rgba(255,255,255,0.15)] mb-2">No results.</p>
              <p className="text-sm text-[var(--slr-dim)]">Try a different search or filter.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <table className="hidden md:table w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[var(--slr-bg)] sticky top-0 z-10">
                    <th className="w-12 px-6 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.size === data.articles.length && data.articles.length > 0}
                        onChange={toggleAll}
                        className="rounded border-[rgba(255,255,255,0.15)] bg-transparent accent-[var(--slr-gold)] w-3.5 h-3.5"
                      />
                    </th>
                    {COLS.map(({ label, field }) => (
                      <th
                        key={field} onClick={() => handleSort(field)}
                        className="px-3 py-3.5 text-left text-[10px] font-semibold text-[var(--slr-dim)] uppercase tracking-widest cursor-pointer hover:text-[var(--slr-muted)] select-none transition-colors"
                      >
                        {label} <Arrow f={field} />
                      </th>
                    ))}
                    <th className="px-3 py-3.5 text-left text-[10px] font-semibold text-[var(--slr-dim)] uppercase tracking-widest">Decision</th>
                  </tr>
                </thead>
                <tbody className={isFetching ? "opacity-50 transition-opacity" : "transition-opacity"}>
                  {data.articles.map((article, idx) => {
                    const d   = (article.myReview?.decision as Decision) ?? "PENDING";
                    const sel = selected.has(article.id);
                    const open = article.id === reviewId;
                    return (
                      <tr
                        key={article.id}
                        onClick={() => setReviewId(open ? null : article.id)}
                        style={{ animationDelay: `${idx * 18}ms` }}
                        className={`group border-b border-l-2 cursor-pointer animate-up transition-all duration-150 ${
                          open
                            ? "bg-[var(--slr-gold)]/8 border-l-[var(--slr-gold)] border-b-[rgba(201,168,112,0.1)]"
                            : sel
                              ? `bg-[var(--slr-surface)] ${leftBorder[d]}`
                              : `border-b-[rgba(255,255,255,0.04)] ${leftBorder[d]} hover:bg-[var(--slr-surface)]`
                        }`}
                      >
                        <td className="px-6 py-3.5" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={sel} onChange={() => toggleOne(article.id)}
                            className="rounded border-[rgba(255,255,255,0.15)] bg-transparent accent-[var(--slr-gold)] w-3.5 h-3.5" />
                        </td>
                        <td className="px-3 py-3.5 max-w-xs">
                          <p className="font-medium leading-snug line-clamp-2 text-[var(--slr-ink)] group-hover:text-[var(--slr-gold)] transition-colors text-[13px]">{article.title}</p>
                          {article.pmid && (
                            <span className="mt-1 inline-block text-[10px] font-mono text-[var(--slr-dim)] bg-[var(--slr-card)] px-1.5 py-0.5 rounded">{article.pmid}</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-[var(--slr-muted)] text-xs whitespace-nowrap max-w-[130px] truncate">{article.firstAuthor ?? "—"}</td>
                        <td className="px-3 py-3.5 text-[var(--slr-muted)] text-xs max-w-[160px]"><span className="truncate block">{article.journal ?? "—"}</span></td>
                        <td className="px-3 py-3.5 text-[var(--slr-muted)] text-xs tabular-nums whitespace-nowrap">{article.publicationYear ?? "—"}</td>
                        <td className="px-3 py-3.5"><DecisionBadge decision={d} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-[rgba(255,255,255,0.04)]">
                {data.articles.map((article, idx) => {
                  const d    = (article.myReview?.decision as Decision) ?? "PENDING";
                  const sel  = selected.has(article.id);
                  const open = article.id === reviewId;
                  return (
                    <div
                      key={article.id}
                      onClick={() => setReviewId(open ? null : article.id)}
                      style={{ animationDelay: `${idx * 18}ms` }}
                      className={`flex items-start gap-3 px-4 py-4 cursor-pointer animate-up transition-colors border-l-2 ${
                        open ? `bg-[var(--slr-gold)]/8 border-l-[var(--slr-gold)]` : `${leftBorder[d]} hover:bg-[var(--slr-surface)]`
                      }`}
                    >
                      <div onClick={e => e.stopPropagation()} className="pt-0.5 shrink-0">
                        <input type="checkbox" checked={sel} onChange={() => toggleOne(article.id)}
                          className="rounded border-[rgba(255,255,255,0.15)] bg-transparent accent-[var(--slr-gold)] w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--slr-ink)] text-sm leading-snug mb-1">{article.title}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--slr-muted)]">
                          {article.firstAuthor && <span>{article.firstAuthor}</span>}
                          {article.journal && <span className="truncate max-w-[160px]">{article.journal}</span>}
                          {article.publicationYear && <span>{article.publicationYear}</span>}
                          {article.pmid && <span className="font-mono text-[var(--slr-dim)]">{article.pmid}</span>}
                        </div>
                      </div>
                      <div className="shrink-0"><DecisionBadge decision={d} /></div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {data && data.total > 10 && (
          <div className="px-4 md:px-8 py-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between shrink-0">
            <span className="text-xs text-[var(--slr-dim)]">
              {(page-1)*10+1}–{Math.min(page*10, data.total)} of {data.total}
            </span>
            <div className="flex gap-1.5">
              {[["← Prev", page === 1, () => setPage(p => p-1)], ["Next →", page*10 >= data.total, () => setPage(p => p+1)]].map(([label, disabled, fn]) => (
                <button key={label as string} disabled={disabled as boolean} onClick={fn as () => void}
                  className="px-3 py-1.5 text-xs border border-[rgba(255,255,255,0.08)] text-[var(--slr-muted)] rounded-lg disabled:opacity-30 hover:border-[rgba(255,255,255,0.15)] hover:text-[var(--slr-ink)] transition-all">
                  {label as string}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {reviewId && reviewArticle && (
        <ReviewPanel
          article={reviewArticle}
          projectId={projectId}
          onClose={() => setReviewId(null)}
          onUpdated={() => utils.article.list.invalidate({ projectId })}
        />
      )}

      {selected.size > 0 && (
        <BulkBar
          selectedCount={selected.size}
          articleIds={Array.from(selected)}
          projectId={projectId}
          onDone={() => { setSelected(new Set()); void utils.article.list.invalidate({ projectId }); }}
        />
      )}
    </div>
  );
}
