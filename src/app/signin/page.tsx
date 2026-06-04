import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { GitHubSignInButton } from "~/components/GitHubSignInButton";

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
          <GitHubSignInButton />
          <p className="text-center text-xs text-[rgba(255,255,255,0.2)] mt-4">
            No separate account needed.
          </p>
        </div>
      </div>
    </div>
  );
}
