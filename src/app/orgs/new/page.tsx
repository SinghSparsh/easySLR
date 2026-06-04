"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function NewOrgPage() {
  const router = useRouter();
  const [name, setName]   = useState("");
  const [error, setError] = useState("");

  const create = api.org.create.useMutation({
    onSuccess: (org) => router.push(`/orgs/${org.slug}`),
    onError:   (e)   => setError(e.message),
  });

  return (
    <div className="min-h-screen bg-[var(--slr-bg)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm animate-scale">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[var(--slr-gold)] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h9M2 12h6" stroke="var(--slr-bg)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-lg font-semibold">EasySLR</span>
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Create your organization.</h1>
          <p className="text-[var(--slr-muted)] text-sm">Your organization holds all your review projects and team members.</p>
        </div>

        <div className="bg-[var(--slr-surface)] border border-[rgba(255,255,255,0.07)] rounded-2xl p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              setError("");
              create.mutate({ name: name.trim() });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-[var(--slr-muted)] uppercase tracking-widest mb-2">
                Organization name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Oxford Medical School"
                autoFocus
                className="w-full px-4 py-3 bg-[var(--slr-card)] border border-[rgba(255,255,255,0.07)] rounded-xl text-[var(--slr-ink)] placeholder-[rgba(255,255,255,0.2)] text-sm focus:outline-none focus:border-[var(--slr-gold)]/50 focus:ring-1 focus:ring-[var(--slr-gold)]/30 transition-all"
              />
              {error && <p className="mt-2 text-xs text-[var(--slr-exclude)] animate-pop">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={!name.trim() || create.isPending}
              className="w-full py-3 bg-[var(--slr-gold)] text-[var(--slr-bg)] text-sm font-bold rounded-xl hover:bg-[var(--slr-gold-hover)] active:scale-[0.98] disabled:opacity-40 transition-all shadow-lg shadow-[var(--slr-gold)]/15"
            >
              {create.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[var(--slr-bg)]/30 border-t-[var(--slr-bg)] rounded-full animate-spin" />
                  Creating…
                </span>
              ) : "Create organization →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
