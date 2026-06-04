"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { parseExcelBuffer } from "~/lib/import/parseExcel";
import type { ValidatedRow } from "~/lib/import/validateRow";

type Step = "upload" | "preview" | "result";

const ROW = {
  valid:   { bar: "bg-[var(--slr-include)]", badge: "bg-[rgba(52,211,153,0.1)] text-[var(--slr-include)]",   label: "✓ Ready"   },
  warning: { bar: "bg-[var(--slr-maybe)]", badge: "bg-[rgba(251,191,36,0.1)] text-[var(--slr-maybe)]",   label: "⚠ Warning" },
  error:   { bar: "bg-[var(--slr-exclude)]", badge: "bg-[rgba(248,113,113,0.1)] text-[var(--slr-exclude)]",  label: "✕ Skip"    },
};

const STEPS = ["Upload", "Preview", "Done"];

export function ImportWizard({ projectId, backHref }: { projectId: string; backHref: string }) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep]           = useState<Step>("upload");
  const [dragging, setDragging]   = useState(false);
  const [fileName, setFileName]   = useState("");
  const [rows, setRows]           = useState<ValidatedRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [result, setResult]       = useState<{ imported: number; skipped: number }|null>(null);

  const importMutation = api.article.import.useMutation({
    onSuccess: (d) => { setResult(d); setStep("result"); },
  });

  const validRows   = rows.filter(r => r.status !== "error");
  const errorRows   = rows.filter(r => r.status === "error");
  const warningRows = rows.filter(r => r.status === "warning");

  const process = async (file: File) => {
    if (!file.name.endsWith(".xlsx")) { setParseError("Please upload an Excel (.xlsx) file."); return; }
    setParseError(""); setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const v   = parseExcelBuffer(buf);
      if (!v.length) { setParseError("No rows found. Check the file format."); return; }
      setRows(v); setStep("preview");
    } catch { setParseError("Couldn't read the file."); }
  };

  const stepIndex = step === "upload" ? 0 : step === "preview" ? 1 : 2;

  return (
    <div className="animate-up">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
              i === stepIndex ? "text-[var(--slr-gold)]" : i < stepIndex ? "text-[var(--slr-include)]" : "text-[var(--slr-dim)]"
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                i < stepIndex   ? "bg-[var(--slr-include)] text-[var(--slr-bg)]"  :
                i === stepIndex ? "bg-[var(--slr-gold)] text-[var(--slr-bg)]"  :
                                  "bg-[var(--slr-card)] text-[var(--slr-dim)]"
              }`}>{i < stepIndex ? "✓" : i + 1}</span>
              {s}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-px mx-1 ${i < stepIndex ? "bg-[var(--slr-include)]/40" : "bg-[rgba(255,255,255,0.07)]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Upload */}
      {step === "upload" && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) void process(f); }}
          onClick={() => fileRef.current?.click()}
          className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-20 text-center transition-all duration-200 ${
            dragging ? "border-[var(--slr-gold)]/60 bg-[var(--slr-gold)]/5 scale-[1.01]" : "border-[rgba(255,255,255,0.08)] hover:border-[var(--slr-gold)]/30 hover:bg-[var(--slr-surface)]"
          }`}
        >
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) void process(f); }} />
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center transition-all ${
            dragging ? "bg-[var(--slr-gold)]/20 scale-110" : "bg-[var(--slr-card)] group-hover:bg-[var(--slr-gold)]/10 group-hover:scale-105"
          }`}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className={`transition-colors ${dragging ? "text-[var(--slr-gold)]" : "text-[var(--slr-dim)] group-hover:text-[var(--slr-gold)]"}`}>
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M16 8l-4-4-4 4M12 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="font-serif text-2xl font-bold text-[var(--slr-ink)] mb-2">
            {dragging ? "Drop it here." : "Drop your Excel file."}
          </p>
          <p className="text-sm text-[var(--slr-muted)] mb-6">PubMed .xlsx exports · click to browse</p>
          <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--slr-gold)] text-[var(--slr-bg)] text-sm font-bold rounded-xl shadow-lg shadow-[var(--slr-gold)]/15 group-hover:bg-[var(--slr-gold-hover)] transition-colors">
            Choose file
          </span>
          {parseError && <p className="mt-5 text-sm text-[var(--slr-exclude)] font-medium animate-pop">⚠ {parseError}</p>}
        </div>
      )}

      {/* Preview */}
      {step === "preview" && (
        <div className="animate-fade">
          <div className="bg-[var(--slr-surface)] border border-[rgba(255,255,255,0.07)] rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-[var(--slr-dim)]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="font-semibold text-[var(--slr-ink)]">{fileName}</span>
              <span className="text-[var(--slr-dim)]">· {rows.length} rows</span>
            </div>
            <div className="ml-auto flex items-center gap-4 text-sm font-semibold">
              <span className="text-[var(--slr-include)]">✓ {validRows.length} import</span>
              {warningRows.length > 0 && <span className="text-[var(--slr-maybe)]">⚠ {warningRows.length} warnings</span>}
              {errorRows.length > 0   && <span className="text-[var(--slr-exclude)]">✕ {errorRows.length} skip</span>}
            </div>
          </div>

          <div className="bg-[var(--slr-surface)] border border-[rgba(255,255,255,0.07)] rounded-2xl overflow-hidden mb-5">
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--slr-surface)] border-b border-[rgba(255,255,255,0.07)] z-10">
                  <tr>
                    <th className="w-1.5 p-0" />
                    {["Status","Title","PMID","Year","Issue"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[var(--slr-dim)] uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const s = ROW[row.status];
                    return (
                      <tr key={i} style={{ animationDelay: `${Math.min(i*12,250)}ms` }}
                        className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[var(--slr-card)] animate-up transition-colors">
                        <td className="w-1.5 p-0"><div className={`w-1 min-h-[44px] ${s.bar}`} /></td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${s.badge}`}>{s.label}</span>
                        </td>
                        <td className="px-4 py-2.5 max-w-xs">
                          <p className="line-clamp-2 text-[var(--slr-ink)] font-medium text-[13px]">
                            {row.title || <span className="text-[var(--slr-exclude)] italic">No title</span>}
                          </p>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-[var(--slr-dim)]">{row.pmid ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-[var(--slr-muted)]">{row.publicationYear ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-[var(--slr-dim)] italic">{row.reason ?? ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {validRows.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-[var(--slr-exclude)] font-medium bg-[rgba(248,113,113,0.08)] px-4 py-2.5 rounded-xl border border-[rgba(248,113,113,0.15)]">
                ⚠ No valid rows to import.
              </div>
            ) : (
              <button
                onClick={() => importMutation.mutate({ projectId, rows: validRows.filter(r => r.title).map(r => ({
                  pmid: r.pmid, title: r.title, authors: r.authors, citation: r.citation,
                  firstAuthor: r.firstAuthor, journal: r.journal, publicationYear: r.publicationYear,
                  createDate: r.createDate, pmcid: r.pmcid, nimsId: r.nimsId, doi: r.doi,
                })) })}
                disabled={importMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-[var(--slr-gold)] text-[var(--slr-bg)] text-sm font-bold rounded-xl hover:bg-[var(--slr-gold-hover)] active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-[var(--slr-gold)]/15"
              >
                {importMutation.isPending
                  ? <><span className="w-4 h-4 border-2 border-[var(--slr-bg)]/30 border-t-[var(--slr-bg)] rounded-full animate-spin" /> Importing…</>
                  : <>Import {validRows.length} article{validRows.length !== 1 ? "s" : ""} →</>
                }
              </button>
            )}
            <button onClick={() => { setStep("upload"); setRows([]); setFileName(""); }}
              className="px-4 py-2.5 text-sm text-[var(--slr-muted)] hover:text-[var(--slr-ink)] transition-colors">
              ← Different file
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {step === "result" && result && (
        <div className="flex flex-col items-center text-center py-16 animate-scale">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl text-4xl font-bold ${
            result.imported > 0
              ? "bg-[var(--slr-include)] text-[var(--slr-bg)] shadow-[var(--slr-include)]/20"
              : "bg-[var(--slr-maybe)] text-[var(--slr-bg)] shadow-[var(--slr-maybe)]/20"
          }`}>
            {result.imported > 0 ? "✓" : "⚠"}
          </div>
          <h2 className="font-serif text-3xl font-bold text-[var(--slr-ink)] mb-2">
            {result.imported === 0 ? "Nothing new imported." : "Import complete."}
          </h2>
          <p className="text-[var(--slr-muted)] mb-1">
            <span className="text-[var(--slr-include)] font-semibold">{result.imported} article{result.imported !== 1 ? "s" : ""}</span> imported
          </p>
          {result.skipped > 0 && (
            <p className="text-sm text-[var(--slr-dim)] mb-8">{result.skipped} skipped (duplicates or errors)</p>
          )}
          <button
            onClick={() => router.push(backHref)}
            className="mt-4 flex items-center gap-2 px-6 py-3 bg-[var(--slr-gold)] text-[var(--slr-bg)] text-sm font-bold rounded-xl hover:bg-[var(--slr-gold-hover)] active:scale-95 transition-all shadow-lg shadow-[var(--slr-gold)]/15"
          >
            View article table →
          </button>
        </div>
      )}
    </div>
  );
}
