import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "~/server/auth";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { headers } from "next/headers";
import { NewProjectForm } from "~/components/NewProjectForm";
import { SignOutButton } from "~/components/SignOutButton";

export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { slug } = await params;
  const ctx      = await createTRPCContext({ headers: await headers() });
  const caller   = createCaller(ctx);

  const org      = await caller.org.getBySlug({ slug });
  const projects = await caller.project.list({ organizationId: org.id });

  return (
    <div className="min-h-screen bg-[var(--slr-bg)]">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--slr-gold)] flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h9M2 12h6" stroke="var(--slr-bg)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-[var(--slr-ink)]">{org.name}</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-xs text-[rgba(255,255,255,0.3)]">{session.user.name}</span>
          <SignOutButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <div className="mb-10 animate-down">
          <p className="text-xs font-semibold text-[var(--slr-gold)] uppercase tracking-widest mb-2">Organization</p>
          <h1 className="font-serif text-4xl font-bold text-[var(--slr-ink)]">{org.name}</h1>
        </div>

        {projects.length === 0 ? (
          <div className="border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-2xl py-20 text-center animate-fade">
            <p className="font-serif text-2xl text-[rgba(255,255,255,0.2)] mb-2">No projects yet.</p>
            <p className="text-sm text-[var(--slr-muted)] mb-6">
              Create your first review project to start screening articles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {projects.map((project, i) => (
              <Link
                key={project.id}
                href={`/orgs/${slug}/${project.slug}`}
                style={{ animationDelay: `${i * 60}ms` }}
                className="group bg-[var(--slr-surface)] border border-[rgba(255,255,255,0.07)] rounded-2xl p-6 hover:border-[var(--slr-gold)]/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[var(--slr-gold)]/5 transition-all duration-200 animate-up"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[var(--slr-gold)]/10 border border-[var(--slr-gold)]/20 flex items-center justify-center">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-[var(--slr-gold)]">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-xs text-[var(--slr-muted)] bg-[var(--slr-card)] px-2.5 py-1 rounded-full">
                    {project._count.articles} articles
                  </span>
                </div>
                <h3 className="font-semibold text-[var(--slr-ink)] group-hover:text-[var(--slr-gold)] transition-colors mb-1">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-xs text-[var(--slr-muted)] line-clamp-2">{project.description}</p>
                )}
                <p className="mt-4 text-xs text-[var(--slr-gold)] opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 duration-200">
                  Open project →
                </p>
              </Link>
            ))}
          </div>
        )}

        <NewProjectForm organizationId={org.id} orgSlug={slug} />
      </div>
    </div>
  );
}
