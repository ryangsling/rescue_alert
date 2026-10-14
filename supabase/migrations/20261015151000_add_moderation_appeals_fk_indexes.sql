create index moderation_appeals_appellant_id_idx on moderation_appeals (appellant_id);
create index moderation_appeals_reviewed_by_idx on moderation_appeals (reviewed_by) where reviewed_by is not null;
