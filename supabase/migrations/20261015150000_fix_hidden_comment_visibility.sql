-- Real bug: case_comments.is_hidden and comment_replies.is_hidden have
-- existed since Part 1 and case_comments_update/comment_replies_update
-- already let a moderator set is_hidden = true, but the SELECT
-- policies never checked the flag - "hiding" a comment did nothing,
-- every reader still saw it. Surfaced now building Part 15's
-- hide-content action (MOD-003).
drop policy case_comments_select on case_comments;
create policy case_comments_select on case_comments
  for select to authenticated using (
    is_case_visible(case_id) and (not is_hidden or author_id = auth.uid() or is_moderator_or_admin())
  );

drop policy comment_replies_select on comment_replies;
create policy comment_replies_select on comment_replies
  for select to authenticated using (
    exists (select 1 from case_comments c where c.id = comment_id and is_case_visible(c.case_id))
    and (not is_hidden or author_id = auth.uid() or is_moderator_or_admin())
  );
