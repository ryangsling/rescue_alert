import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@rescue-alert/types";
import type {
  CreateCommentInput,
  CreateReplyInput,
  CreateCaseUpdateInput,
} from "@rescue-alert/validation";

type Client = SupabaseClient<Database>;

export async function createComment(
  client: Client,
  authorId: string,
  input: CreateCommentInput,
) {
  return client
    .from("case_comments")
    .insert({ case_id: input.caseId, author_id: authorId, body: input.body })
    .select()
    .single();
}

export async function createReply(
  client: Client,
  authorId: string,
  input: CreateReplyInput,
) {
  return client
    .from("comment_replies")
    .insert({
      comment_id: input.commentId,
      author_id: authorId,
      body: input.body,
    })
    .select()
    .single();
}

/** COMM-002, COMM-003. See case_updates_insert's RLS for who may post one (creator, coordinator, org member, or moderator). */
export async function createCaseUpdate(
  client: Client,
  authorId: string,
  input: CreateCaseUpdateInput,
) {
  return client
    .from("case_updates")
    .insert({
      case_id: input.caseId,
      author_id: authorId,
      body: input.body,
      is_pinned: input.isPinned,
    })
    .select()
    .single();
}

/** Comments with their replies nested, oldest first at both levels. */
export async function listCaseComments(client: Client, caseId: string) {
  return client
    .from("case_comments")
    .select("*, comment_replies(*)")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true })
    .order("created_at", { referencedTable: "comment_replies", ascending: true });
}

export async function listCaseUpdates(client: Client, caseId: string) {
  return client
    .from("case_updates")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });
}

/** Edits set edited_at; "deletion" sets is_hidden rather than removing the row, so moderation evidence survives. */
export async function editComment(
  client: Client,
  commentId: string,
  body: string,
) {
  return client
    .from("case_comments")
    .update({ body, edited_at: new Date().toISOString() })
    .eq("id", commentId)
    .select()
    .single();
}

export async function hideComment(client: Client, commentId: string) {
  return client
    .from("case_comments")
    .update({ is_hidden: true })
    .eq("id", commentId)
    .select()
    .single();
}

export async function editReply(
  client: Client,
  replyId: string,
  body: string,
) {
  return client
    .from("comment_replies")
    .update({ body, edited_at: new Date().toISOString() })
    .eq("id", replyId)
    .select()
    .single();
}

export async function hideReply(client: Client, replyId: string) {
  return client
    .from("comment_replies")
    .update({ is_hidden: true })
    .eq("id", replyId)
    .select()
    .single();
}
