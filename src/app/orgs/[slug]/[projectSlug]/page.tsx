import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "~/server/auth";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { headers } from "next/headers";
import { ArticleWorkspace } from "~/components/ArticleWorkspace";

export default async function ProjectPage({
  params,
}: { params: Promise<{ slug: string; projectSlug: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { slug, projectSlug } = await params;
  const ctx    = await createTRPCContext({ headers: await headers() });
  const caller = createCaller(ctx);
  const { project, org } = await caller.project.getBySlug({ orgSlug: slug, projectSlug });

  return (
    <div className="h-screen bg-[var(--slr-bg)] flex flex-col overflow-hidden">
      {/* Nav */}
      <header className="flex items-center justify-between px-4 md:px-8 py-3.5 border-b border-[rgba(255,255,255,0.06)] shrink-0 gap-2">
        <div className="flex items-center gap-2 text-sm min-w-0">
          <div className="w-6 h-6 rounded-md bg-[var(--slr-gold)] flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h9M2 12h6" stroke="var(--slr-bg)" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <Link href={`/orgs/${slug}`} className="text-[rgba(255,255,255,0.35)] hover:text-[var(--slr-ink)] transition-colors hidden sm:block truncate">
            {org.name}
          </Link>
          <span className="text-[rgba(255,255,255,0.15)] hidden sm:block">/</span>
          <span className="text-[var(--slr-ink)] font-medium truncate">{project.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/${project.id}`}
            className="flex items-center gap-1.5 text-xs text-[var(--slr-muted)] hover:text-[var(--slr-ink)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] px-3 py-1.5 rounded-lg transition-all"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M8 12l4 4 4-4M12 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export CSV
          </a>
          <Link
            href={`/orgs/${slug}/${projectSlug}/import`}
            className="flex items-center gap-1.5 text-xs bg-[var(--slr-gold)] text-[var(--slr-bg)] px-3.5 py-1.5 rounded-lg hover:bg-[var(--slr-gold-hover)] transition-all font-bold"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M16 8l-4-4-4 4M12 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Import
          </Link>
        </div>
      </header>

      <ArticleWorkspace
        projectId={project.id}
        orgSlug={slug}
        projectSlug={projectSlug}
        articleCount={project._count.articles}
        userId={session.user.id}
      />
    </div>
  );
}
