-- Kept isolated per project convention: a new enum value cannot be
-- used in the same transaction/migration that adds it.
alter type moderation_action_type add value if not exists 'lift_restriction';
