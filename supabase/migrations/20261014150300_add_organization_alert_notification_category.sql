-- Part 14 (ORG-004): a tenth notification category for organizations
-- opted into a case's urgency/incident type. Added as its own
-- statement/migration - a new enum value cannot be used in the same
-- transaction that creates it on some Postgres versions, so the
-- function that consumes it (see the next migration) is kept
-- separate on purpose.
alter type notification_category add value if not exists 'organization_alert';
