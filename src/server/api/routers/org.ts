import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { requireOrgAccess } from "~/server/auth/access";
import { TRPCError } from "@trpc/server";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const orgRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(80) }))
    .mutation(async ({ ctx, input }) => {
      const baseSlug = slugify(input.name);
      const existing = await ctx.db.organization.findUnique({ where: { slug: baseSlug } });
      const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

      const org = await ctx.db.organization.create({
        data: {
          name: input.name.trim(),
          slug,
          members: { create: { userId: ctx.session.user.id, role: "OWNER" } },
        },
      });
      return org;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.organization.findMany({
      where: { members: { some: { userId: ctx.session.user.id } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.organization.findUnique({
        where: { slug: input.slug },
        include: { members: { include: { user: true } } },
      });
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      await requireOrgAccess(ctx.session.user.id, org.id);
      return org;
    }),
});
