import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";

export async function requireProjectAccess(userId: string, projectId: string) {
  const member = await db.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    include: { project: { include: { organization: true } } },
  });
  if (!member) throw new TRPCError({ code: "FORBIDDEN" });
  return member;
}

export async function requireOrgAccess(userId: string, organizationId: string) {
  const member = await db.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (!member) throw new TRPCError({ code: "FORBIDDEN" });
  return member;
}
