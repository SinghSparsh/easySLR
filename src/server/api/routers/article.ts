import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { requireProjectAccess } from "~/server/auth/access";

const DecisionEnum = z.enum(["PENDING", "INCLUDE", "EXCLUDE", "MAYBE"]);

export const articleRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        search: z.string().optional(),
        decision: z.enum(["ALL", "PENDING", "INCLUDE", "EXCLUDE", "MAYBE"]).default("ALL"),
        sortBy: z.enum(["title", "firstAuthor", "journal", "publicationYear", "importedAt"]).default("importedAt"),
        sortDir: z.enum(["asc", "desc"]).default("desc"),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      await requireProjectAccess(ctx.session.user.id, input.projectId);

      const where: Record<string, unknown> = { projectId: input.projectId };

      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { authors: { contains: input.search, mode: "insensitive" } },
          { journal: { contains: input.search, mode: "insensitive" } },
          { firstAuthor: { contains: input.search, mode: "insensitive" } },
        ];
      }

      if (input.decision !== "ALL") {
        where.reviews = {
          some: {
            userId: ctx.session.user.id,
            decision: input.decision,
          },
        };
      }

      const [articles, total, totalAll, counts] = await Promise.all([
        ctx.db.article.findMany({
          where,
          include: {
            reviews: {
              where: { userId: ctx.session.user.id },
              select: { decision: true, notes: true, updatedAt: true },
            },
          },
          orderBy: { [input.sortBy]: input.sortDir },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.db.article.count({ where }),
        // Always unfiltered — used for tab counts so they never go negative
        ctx.db.article.count({ where: { projectId: input.projectId } }),
        ctx.db.review.groupBy({
          by: ["decision"],
          where: {
            article: { projectId: input.projectId },
            userId: ctx.session.user.id,
          },
          _count: { decision: true },
        }),
      ]);

      const enriched = articles.map((a) => ({
        ...a,
        myReview: a.reviews[0] ?? null,
      }));

      const nonPending = counts.reduce(
        (sum, c) => (c.decision !== "PENDING" ? sum + c._count.decision : sum),
        0,
      );

      const decisionCounts = {
        ALL: totalAll,
        PENDING: Math.max(0, totalAll - nonPending),
        INCLUDE: counts.find((c) => c.decision === "INCLUDE")?._count.decision ?? 0,
        EXCLUDE: counts.find((c) => c.decision === "EXCLUDE")?._count.decision ?? 0,
        MAYBE: counts.find((c) => c.decision === "MAYBE")?._count.decision ?? 0,
      };

      return { articles: enriched, total, decisionCounts };
    }),

  import: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        rows: z.array(
          z.object({
            pmid: z.string().optional(),
            title: z.string(),
            authors: z.string().optional(),
            citation: z.string().optional(),
            firstAuthor: z.string().optional(),
            journal: z.string().optional(),
            publicationYear: z.number().int().optional(),
            createDate: z.string().optional(),
            pmcid: z.string().optional(),
            nimsId: z.string().optional(),
            doi: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireProjectAccess(ctx.session.user.id, input.projectId);

      // Fetch existing pmids and dois for this project to check duplicates
      const [existingPmids, existingDois] = await Promise.all([
        ctx.db.article.findMany({
          where: { projectId: input.projectId, pmid: { not: null } },
          select: { pmid: true },
        }),
        ctx.db.article.findMany({
          where: { projectId: input.projectId, doi: { not: null } },
          select: { doi: true },
        }),
      ]);

      const existingPmidSet = new Set(existingPmids.map((a) => a.pmid!));
      const existingDoiSet = new Set(existingDois.map((a) => a.doi!));

      const validRows = input.rows.filter((row) => {
        if (row.pmid && existingPmidSet.has(row.pmid)) return false;
        if (row.doi && existingDoiSet.has(row.doi)) return false;
        return true;
      });

      const skipped = input.rows.length - validRows.length;

      if (validRows.length === 0) {
        return { imported: 0, skipped };
      }

      await ctx.db.article.createMany({
        data: validRows.map((row) => ({ ...row, projectId: input.projectId })),
        skipDuplicates: true,
      });

      return { imported: validRows.length, skipped };
    }),

  bulkUpdateDecision: protectedProcedure
    .input(
      z.object({
        articleIds: z.array(z.string()),
        decision: DecisionEnum,
        projectId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireProjectAccess(ctx.session.user.id, input.projectId);

      // Verify all articles belong to this project
      const count = await ctx.db.article.count({
        where: { id: { in: input.articleIds }, projectId: input.projectId },
      });
      if (count !== input.articleIds.length) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await Promise.all(
        input.articleIds.map((articleId) =>
          ctx.db.review.upsert({
            where: { articleId_userId: { articleId, userId: ctx.session.user.id } },
            update: { decision: input.decision },
            create: { articleId, userId: ctx.session.user.id, decision: input.decision },
          }),
        ),
      );

      return { updated: input.articleIds.length };
    }),
});
