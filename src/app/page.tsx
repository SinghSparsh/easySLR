import { redirect } from "next/navigation";
import { auth, signIn } from "~/server/auth";
import { db } from "~/server/db";

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Import",
    body: "Upload your PubMed Excel export. We validate every row — blank titles, duplicate PMIDs, invalid years — and show you a preview before anything is saved.",
  },
  {
    n: "02",
    title: "Screen",
    body: "Open any article. Mark it Include, Exclude, or Maybe. Add notes. Your decisions save automatically as you work through your list.",
  },
  {
    n: "03",
    title: "Export",
    body: "Download a clean CSV of your screened articles with all decisions and reviewer notes attached. Ready for your next stage.",
  },
];

const STATS = [
  { value: "PubMed", label: "Native format support" },
  { value: "3",      label: "Screening decisions" },
  { value: "Auto",   label: "Duplicate detection" },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    const m = await db.organizationMember.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
      orderBy: { joinedAt: "asc" },
    });
    redirect(m ? `/orgs/${m.organization.slug}` : "/orgs/new");
  }

  return (
    <div className="min-h-screen bg-[var(--slr-bg)] text-[var(--slr-ink)] flex flex-col">

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--slr-gold)] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h9M2 12h6" stroke="var(--slr-bg)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-semibold text-[var(--slr-ink)] tracking-tight">EasySLR</span>
        </div>
        <form action={async () => { "use server"; await signIn("github"); }}>
          <button type="submit" className="text-sm text-[var(--slr-muted)] hover:text-[var(--slr-ink)] transition-colors">
            Sign in →
          </button>
        </form>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--slr-gold)]/25 bg-[var(--slr-gold)]/8 text-[var(--slr-gold)] text-xs font-semibold tracking-widest uppercase mb-10 animate-down">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--slr-gold)]" />
          For Systematic Reviewers
        </div>

        {/* Headline */}
        <h1 className="font-serif text-6xl sm:text-7xl font-bold leading-[1.05] tracking-tight mb-5 animate-up">
          Sharper reviews.<br />
          <span className="text-[var(--slr-gold)]">Better evidence.</span>
        </h1>

        <p className="text-[var(--slr-muted)] text-lg leading-relaxed max-w-lg mb-10 animate-up d-120">
          Import PubMed exports, screen articles with Include&nbsp;/&nbsp;Exclude&nbsp;/&nbsp;Maybe,
          collaborate with your team, and export a clean shortlist — all in one place.
        </p>

        {/* CTA */}
        <form action={async () => { "use server"; await signIn("github"); }} className="animate-up d-180">
          <button
            type="submit"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[var(--slr-gold)] text-[var(--slr-bg)] rounded-full text-base font-bold hover:bg-[var(--slr-gold-hover)] active:scale-[0.97] transition-all shadow-xl shadow-[var(--slr-gold)]/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Get started with GitHub
          </button>
        </form>

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <div className="mt-20 w-full max-w-2xl animate-up d-240">
          <div className="h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.08)] to-transparent mb-10" />
          <div className="grid grid-cols-3 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-serif text-4xl font-bold text-[var(--slr-ink)] mb-1">{s.value}</p>
                <p className="text-xs text-[var(--slr-muted)] uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── How it works ──────────────────────────────────────────── */}
        <div className="mt-24 w-full max-w-3xl text-left animate-up d-300">
          <p className="text-xs text-[var(--slr-gold)] font-semibold tracking-widest uppercase mb-8 text-center">
            How it works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.n}
                className="bg-[var(--slr-surface)] border border-[rgba(255,255,255,0.07)] rounded-2xl p-6 hover:border-[var(--slr-gold)]/25 transition-colors"
              >
                <p className="font-serif text-4xl font-bold text-[var(--slr-gold)]/30 mb-3">{step.n}</p>
                <p className="font-semibold text-[var(--slr-ink)] mb-2">{step.title}</p>
                <p className="text-sm text-[var(--slr-muted)] leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="text-center py-8 text-xs text-[rgba(255,255,255,0.2)]">
        © 2025 EasySLR · Built for systematic reviewers
      </footer>
    </div>
  );
}
