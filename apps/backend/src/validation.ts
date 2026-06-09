import { z } from "zod";
import { COMMENT_STATUSES, COMMENT_TYPES } from "./schema.js";

const nullableNumber = z.number().finite().nullish();
const nullableString = z.string().max(10_000).nullish();

export const createCommentSchema = z.object({
  pagePath: z.string().min(1).startsWith("/"),
  url: z.string().min(1),
  type: z.enum(COMMENT_TYPES),
  body: z.string().trim().min(1).max(10_000),
  authorName: z.string().trim().min(1).max(200),
  authorEmail: z.string().trim().min(3).max(320),
  status: z.enum(COMMENT_STATUSES).optional(),

  componentName: nullableString,
  componentTag: nullableString,
  componentMetadata: nullableString,
  domPath: nullableString,
  textSnippet: nullableString,

  viewportWidth: nullableNumber,
  viewportHeight: nullableNumber,
  scrollX: nullableNumber,
  scrollY: nullableNumber,
  clientX: nullableNumber,
  clientY: nullableNumber,
  pageX: nullableNumber,
  pageY: nullableNumber,
  normalizedX: nullableNumber,
  normalizedY: nullableNumber,
});

export const updateCommentSchema = z
  .object({
    body: z.string().trim().min(1).max(10_000).optional(),
    status: z.enum(COMMENT_STATUSES).optional(),
  })
  .refine((value) => value.body !== undefined || value.status !== undefined, {
    message: "Provide at least one of: body, status",
  });

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
