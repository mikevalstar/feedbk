import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const COMMENT_TYPES = ["component", "page-position", "page-general"] as const;
export const COMMENT_STATUSES = ["open", "resolved"] as const;

export type CommentType = (typeof COMMENT_TYPES)[number];
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

// Phase 1 has no screenshot fields by design; add them here later if needed.
export const comments = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey(),
    projectKey: text("project_key").notNull(),
    pagePath: text("page_path").notNull(),
    url: text("url").notNull(),
    type: text("type", { enum: COMMENT_TYPES }).notNull(),
    body: text("body").notNull(),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email").notNull(),

    componentName: text("component_name"),
    componentTag: text("component_tag"),
    componentMetadata: text("component_metadata"),
    domPath: text("dom_path"),
    textSnippet: text("text_snippet"),

    viewportWidth: integer("viewport_width"),
    viewportHeight: integer("viewport_height"),
    scrollX: real("scroll_x"),
    scrollY: real("scroll_y"),
    clientX: real("client_x"),
    clientY: real("client_y"),
    pageX: real("page_x"),
    pageY: real("page_y"),
    normalizedX: real("normalized_x"),
    normalizedY: real("normalized_y"),

    status: text("status", { enum: COMMENT_STATUSES }).notNull().default("open"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("idx_comments_project_page").on(table.projectKey, table.pagePath)],
);

export type CommentRow = typeof comments.$inferSelect;
export type NewCommentRow = typeof comments.$inferInsert;
