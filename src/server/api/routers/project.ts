import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { requireOrgAccess, requireProjectAccess } from "~/server/auth/access";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(80),
        description: z.string().max(300).optional(),
        organizationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireOrgAccess(ctx.session.user.id, input.organizationId);

      const baseSlug = slugify(input.name);
      const existing = await ctx.db.project.findUnique({
        where: {
          organizationId_slug: { organizationId: input.organizationId, slug: baseSlug },
        },
      });
      const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

      return ctx.db.project.create({
        data: {
          name: input.name.trim(),
          slug,
          description: input.description?.trim(),
          organizationId: input.organizationId,
          members: { create: { userId: ctx.session.user.id, role: "OWNER" } },
        },
      });
    }),

  list: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireOrgAccess(ctx.session.user.id, input.organizationId);
      return ctx.db.project.findMany({
        where: { organizationId: input.organizationId },
        include: { _count: { select: { articles: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  getBySlug: protectedProcedure
    .input(z.object({ orgSlug: z.string(), projectSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUnique({
        where: { slug: input.orgSlug },
      });
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });

      const project = await ctx.db.project.findUnique({
        where: { organizationId_slug: { organizationId: org.id, slug: input.projectSlug } },
        include: { _count: { select: { articles: true } } },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      await requireProjectAccess(ctx.session.user.id, project.id);
      return { project, org };
    }),
});
