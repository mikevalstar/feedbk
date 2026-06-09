import { serve } from "@hono/node-server";
import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { randomUUID } from "node:crypto";
import { db, runMigrations } from "./db.js";
import { comments, type NewCommentRow } from "./schema.js";
import { createCommentSchema, updateCommentSchema } from "./validation.js";

const PORT = Number(process.env.PORT ?? 4000);

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allowHeaders: ["*"],
  }),
);

app.get("/health", (c) => c.json({ ok: true }));

app.get("/api/projects/:projectKey/comments", async (c) => {
  const projectKey = c.req.param("projectKey");
  const pagePath = c.req.query("pagePath");
  const includeAllPages = c.req.query("includeAllPages") === "true";

  if (!includeAllPages && !pagePath) {
    return c.json({ error: "pagePath query parameter is required (or pass includeAllPages=true)" }, 400);
  }

  const where = includeAllPages
    ? eq(comments.projectKey, projectKey)
    : and(eq(comments.projectKey, projectKey), eq(comments.pagePath, pagePath!));

  const rows = await db.select().from(comments).where(where).orderBy(asc(comments.createdAt));
  return c.json({ comments: rows });
});

app.post("/api/projects/:projectKey/comments", async (c) => {
  const projectKey = c.req.param("projectKey");

  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = createCommentSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, 400);
  }

  const input = parsed.data;
  const now = new Date().toISOString();
  const row: NewCommentRow = {
    id: `cmt_${randomUUID().replaceAll("-", "").slice(0, 12)}`,
    projectKey,
    pagePath: input.pagePath,
    url: input.url,
    type: input.type,
    body: input.body,
    authorName: input.authorName,
    authorEmail: input.authorEmail,
    status: input.status ?? "open",

    componentName: input.componentName ?? null,
    componentTag: input.componentTag ?? null,
    componentMetadata: input.componentMetadata ?? null,
    domPath: input.domPath ?? null,
    textSnippet: input.textSnippet ?? null,

    viewportWidth: input.viewportWidth ?? null,
    viewportHeight: input.viewportHeight ?? null,
    scrollX: input.scrollX ?? null,
    scrollY: input.scrollY ?? null,
    clientX: input.clientX ?? null,
    clientY: input.clientY ?? null,
    pageX: input.pageX ?? null,
    pageY: input.pageY ?? null,
    normalizedX: input.normalizedX ?? null,
    normalizedY: input.normalizedY ?? null,

    createdAt: now,
    updatedAt: now,
  };

  const [created] = await db.insert(comments).values(row).returning();
  return c.json(created, 201);
});

app.patch("/api/projects/:projectKey/comments/:commentId", async (c) => {
  const projectKey = c.req.param("projectKey");
  const commentId = c.req.param("commentId");

  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = updateCommentSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, 400);
  }

  const [updated] = await db
    .update(comments)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(and(eq(comments.projectKey, projectKey), eq(comments.id, commentId)))
    .returning();

  if (!updated) {
    return c.json({ error: "Comment not found" }, 404);
  }
  return c.json(updated);
});

app.delete("/api/projects/:projectKey/comments/:commentId", async (c) => {
  const projectKey = c.req.param("projectKey");
  const commentId = c.req.param("commentId");

  const [deleted] = await db
    .delete(comments)
    .where(and(eq(comments.projectKey, projectKey), eq(comments.id, commentId)))
    .returning();

  if (!deleted) {
    return c.json({ error: "Comment not found" }, 404);
  }
  return c.json({ ok: true });
});

await runMigrations();

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[backend] design-feedback API listening on http://localhost:${info.port}`);
});
