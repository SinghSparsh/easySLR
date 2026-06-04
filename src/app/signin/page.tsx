import { redirect } from "next/navigation";
import { auth, signIn } from "~/server/auth";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");

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
          <h1 className="font-serif text-3xl font-bold mb-2">Welcome back.</h1>
          <p className="text-[var(--slr-muted)] text-sm">Sign in to your research workspace.</p>
        </div>

        <div className="bg-[var(--slr-surface)] border border-[rgba(255,255,255,0.07)] rounded-2xl p-6">
          <form action={async () => { "use server"; await signIn("github"); }}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-[var(--slr-gold)] text-[var(--slr-bg)] rounded-xl text-sm font-bold hover:bg-[var(--slr-gold-hover)] active:scale-[0.98] transition-all shadow-lg shadow-[var(--slr-gold)]/15"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
          </form>
          <p className="text-center text-xs text-[rgba(255,255,255,0.2)] mt-4">
            No separate account needed.
          </p>
        </div>
      </div>
    </div>
  );
}
