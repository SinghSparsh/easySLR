import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { requireProjectAccess } from "~/server/auth/access";

export const reviewRouter = createTRPCRouter({
  upsert: protectedProcedure
    .input(
      z.object({
        articleId: z.string(),
        projectId: z.string(),
        decision: z.enum(["PENDING", "INCLUDE", "EXCLUDE", "MAYBE"]),
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireProjectAccess(ctx.session.user.id, input.projectId);

      // Verify article belongs to project
      const article = await ctx.db.article.findUnique({
        where: { id: input.articleId },
        select: { projectId: true },
      });
      if (!article || article.projectId !== input.projectId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.review.upsert({
        where: {
          articleId_userId: {
            articleId: input.articleId,
            userId: ctx.session.user.id,
          },
        },
        update: { decision: input.decision, notes: input.notes },
        create: {
          articleId: input.articleId,
          userId: ctx.session.user.id,
          decision: input.decision,
          notes: input.notes,
        },
      });
    }),
});
