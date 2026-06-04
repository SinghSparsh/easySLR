import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { requireProjectAccess } from "~/server/auth/access";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const { projectId } = await params;
  await requireProjectAccess(session.user.id, projectId);

  const articles = await db.article.findMany({
    where: { projectId },
    include: {
      reviews: {
        where: { userId: session.user.id },
        select: { decision: true, notes: true },
      },
    },
    orderBy: { importedAt: "asc" },
  });

  const header = [
    "PMID",
    "Title",
    "Authors",
    "First Author",
    "Journal",
    "Publication Year",
    "DOI",
    "PMCID",
    "Decision",
    "Notes",
  ];

  const rows = articles.map((a) => {
    const review = a.reviews[0];
    return [
      a.pmid ?? "",
      `"${(a.title ?? "").replace(/"/g, '""')}"`,
      `"${(a.authors ?? "").replace(/"/g, '""')}"`,
      a.firstAuthor ?? "",
      `"${(a.journal ?? "").replace(/"/g, '""')}"`,
      a.publicationYear ?? "",
      a.doi ?? "",
      a.pmcid ?? "",
      review?.decision ?? "PENDING",
      `"${(review?.notes ?? "").replace(/"/g, '""')}"`,
    ].join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="articles-${projectId}.csv"`,
    },
  });
}
