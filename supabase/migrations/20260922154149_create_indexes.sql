
-- Geospatial: GiST on exact and approximate case locations, restricted
-- to active (non-terminal) cases so the index stays small as history
-- accumulates. PRD 18.4.
create index rescue_cases_location_active_gist_idx
  on rescue_cases using gist (location)
  where status not in ('closed', 'resolved', 'duplicate', 'false_report', 'spam', 'unsafe_or_prohibited_content', 'cancelled_by_reporter', 'closed_by_moderator');

create index rescue_cases_approximate_location_gist_idx
  on rescue_cases using gist (approximate_location);

-- Volunteer alert zone matching runs against notification_preferences
-- joined to profiles' last-known area, not a stored point in the MVP
-- (no continuous location tracking - PRD non-goal). A saved alert
-- point may be added post-MVP; this index is ready for it.
create index rescue_case_locations_gist_idx
  on rescue_case_locations using gist (location);

-- Partial index on open cases - the hot path for the nearby feed.
create index rescue_cases_open_idx
  on rescue_cases (status, urgency, reported_at desc)
  where status in ('open', 'response_committed', 'responder_en_route', 'animal_located', 'rescue_in_progress', 'transporting');

create index rescue_cases_status_created_idx
  on rescue_cases (status, created_at desc);

create index rescue_cases_creator_idx on rescue_cases (creator_id);
create index rescue_cases_coordinator_idx on rescue_cases (coordinator_id);
create index rescue_cases_organization_idx on rescue_cases (organization_id);

create index case_responses_case_idx on case_responses (case_id);
create index case_responses_responder_idx on case_responses (responder_id);
create index case_status_history_case_idx on case_status_history (case_id, created_at desc);
create index case_comments_case_idx on case_comments (case_id, created_at desc);
create index comment_replies_comment_idx on comment_replies (comment_id, created_at desc);
create index case_updates_case_idx on case_updates (case_id, created_at desc);
create index rescue_media_case_idx on rescue_media (case_id);
create index content_reports_status_idx on content_reports (status, created_at desc);
create index moderation_actions_target_idx on moderation_actions (target_type, target_id);
create index audit_logs_target_idx on audit_logs (target_type, target_id);
create index contributions_user_idx on contributions (user_id);
