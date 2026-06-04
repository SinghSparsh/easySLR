import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { orgRouter } from "~/server/api/routers/org";
import { projectRouter } from "~/server/api/routers/project";
import { articleRouter } from "~/server/api/routers/article";
import { reviewRouter } from "~/server/api/routers/review";

export const appRouter = createTRPCRouter({
  org: orgRouter,
  project: projectRouter,
  article: articleRouter,
  review: reviewRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
