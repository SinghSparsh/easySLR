import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "~/server/auth";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { headers } from "next/headers";
import { ImportWizard } from "~/components/ImportWizard";

export default async function ImportPage({
  params,
}: { params: Promise<{ slug: string; projectSlug: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { slug, projectSlug } = await params;
  const ctx    = await createTRPCContext({ headers: await headers() });
  const caller = createCaller(ctx);
  const { project, org } = await caller.project.getBySlug({ orgSlug: slug, projectSlug });

  return (
    <div className="min-h-screen bg-[var(--slr-bg)]">
      <header className="flex items-center gap-2 px-8 py-4 border-b border-[rgba(255,255,255,0.06)] text-sm">
        <div className="w-6 h-6 rounded-md bg-[var(--slr-gold)] flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h9M2 12h6" stroke="var(--slr-bg)" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </div>
        <Link href={`/orgs/${slug}`} className="text-[rgba(255,255,255,0.35)] hover:text-[var(--slr-ink)] transition-colors">{org.name}</Link>
        <span className="text-[rgba(255,255,255,0.15)]">/</span>
        <Link href={`/orgs/${slug}/${projectSlug}`} className="text-[rgba(255,255,255,0.35)] hover:text-[var(--slr-ink)] transition-colors">{project.name}</Link>
        <span className="text-[rgba(255,255,255,0.15)]">/</span>
        <span className="text-[var(--slr-ink)] font-medium">Import</span>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="mb-10 animate-down">
          <p className="text-xs font-semibold text-[var(--slr-gold)] uppercase tracking-widest mb-2">Import Articles</p>
          <h1 className="font-serif text-4xl font-bold text-[var(--slr-ink)] mb-3">Upload your PubMed export.</h1>
          <p className="text-[var(--slr-muted)] text-sm max-w-lg">
            We validate every row before importing — blank titles, duplicate PMIDs, invalid years,
            and whitespace issues are all caught and shown to you first.
          </p>
        </div>
        <ImportWizard projectId={project.id} backHref={`/orgs/${slug}/${projectSlug}`} />
      </div>
    </div>
  );
}
