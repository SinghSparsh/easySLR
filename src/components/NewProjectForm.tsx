"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export function NewProjectForm({ organizationId, orgSlug }: { organizationId: string; orgSlug: string }) {
  const router = useRouter();
  const [open, setOpen]   = useState(false);
  const [name, setName]   = useState("");
  const [desc, setDesc]   = useState("");
  const [error, setError] = useState("");

  const create = api.project.create.useMutation({
    onSuccess: (p) => router.push(`/orgs/${orgSlug}/${p.slug}`),
    onError:   (e) => setError(e.message),
  });

  const reset = () => { setOpen(false); setName(""); setDesc(""); setError(""); };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2.5 py-4 border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-2xl text-sm text-[var(--slr-muted)] hover:border-[var(--slr-gold)]/30 hover:text-[var(--slr-gold)] transition-all duration-200"
      >
        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs font-bold">+</span>
        New project
      </button>
    );
  }

  return (
    <div className="bg-[var(--slr-surface)] border border-[var(--slr-gold)]/20 rounded-2xl p-6 animate-scale">
      <h3 className="text-sm font-semibold text-[var(--slr-ink)] mb-4">New project</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setError("");
          create.mutate({ name: name.trim(), description: desc.trim() || undefined, organizationId });
        }}
        className="space-y-3"
      >
        <input
          type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Project name" autoFocus
          className="w-full px-4 py-2.5 bg-[var(--slr-card)] border border-[rgba(255,255,255,0.07)] rounded-xl text-[var(--slr-ink)] placeholder-[rgba(255,255,255,0.2)] text-sm focus:outline-none focus:border-[var(--slr-gold)]/50 focus:ring-1 focus:ring-[var(--slr-gold)]/30 transition-all"
        />
        <input
          type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
          placeholder="Description (optional)"
          className="w-full px-4 py-2.5 bg-[var(--slr-card)] border border-[rgba(255,255,255,0.07)] rounded-xl text-[var(--slr-ink)] placeholder-[rgba(255,255,255,0.2)] text-sm focus:outline-none focus:border-[var(--slr-gold)]/50 focus:ring-1 focus:ring-[var(--slr-gold)]/30 transition-all"
        />
        {error && <p className="text-xs text-[var(--slr-exclude)] animate-pop">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button
            type="submit" disabled={!name.trim() || create.isPending}
            className="px-5 py-2.5 bg-[var(--slr-gold)] text-[var(--slr-bg)] text-sm font-bold rounded-xl hover:bg-[var(--slr-gold-hover)] active:scale-95 disabled:opacity-40 transition-all"
          >
            {create.isPending ? "Creating…" : "Create →"}
          </button>
          <button type="button" onClick={reset} className="px-4 py-2.5 text-sm text-[var(--slr-muted)] hover:text-[var(--slr-ink)] transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
