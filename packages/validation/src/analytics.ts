import { z } from "zod";

/**
 * PRD section 23. A closed set, not free text, so a client can never
 * log an arbitrary event name - matches the database's own
 * `analytics_event_name` enum exactly.
 */
export const analyticsEventNameSchema = z.enum([
  "registration_completed",
  "onboarding_completed",
  "notification_permission_result",
  "report_draft_created",
  "report_submitted",
  "report_upload_failed",
  "nearby_alert_generated",
  "notification_opened",
  "response_committed",
  "responder_withdrew",
  "animal_located",
  "case_status_changed",
  "case_closed",
  "outcome_recorded",
  "content_reported",
  "moderation_action_completed",
]);
export type AnalyticsEventName = z.infer<typeof analyticsEventNameSchema>;

export const recordAnalyticsEventSchema = z.object({
  eventName: analyticsEventNameSchema,
  properties: z.record(z.string(), z.unknown()).optional(),
});
export type RecordAnalyticsEventInput = z.infer<
  typeof recordAnalyticsEventSchema
>;
