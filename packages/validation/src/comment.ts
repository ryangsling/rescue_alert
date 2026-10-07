import { z } from "zod";

/** Shared by case_comments and comment_replies - both are plain text with the same length bound. */
const commentBodySchema = z
  .string()
  .trim()
  .min(1, "Write something before posting")
  .max(2000);

export const createCommentSchema = z.object({
  caseId: z.uuid(),
  body: commentBodySchema,
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const createReplySchema = z.object({
  commentId: z.uuid(),
  body: commentBodySchema,
});

export type CreateReplyInput = z.infer<typeof createReplySchema>;

/** COMM-002, COMM-003: an official update, visually distinct from a comment. Pinning is coordinator-only at the UI layer; RLS does not special-case it. */
export const createCaseUpdateSchema = z.object({
  caseId: z.uuid(),
  body: z.string().trim().min(1, "Write the update before posting").max(4000),
  isPinned: z.boolean().default(false),
});

export type CreateCaseUpdateInput = z.infer<typeof createCaseUpdateSchema>;
