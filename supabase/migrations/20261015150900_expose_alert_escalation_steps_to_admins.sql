-- PRD 24 "configurable incident types, alert radii, and notification
-- rules". alert_escalation_steps (Part 11) already is the live,
-- editing-changes-behaviour-with-no-code-change radius/timing ladder;
-- it was service-role only. incident_type itself stays a fixed enum -
-- it is woven through case creation, validation, matching, and both
-- localization catalogs, and turning it into a runtime-editable table
-- would be a far larger schema change than this PRD line asks for;
-- that limitation is disclosed in docs/PLAN.md rather than built around.
grant select, insert, update, delete on alert_escalation_steps to authenticated;

create policy alert_escalation_steps_select on alert_escalation_steps
  for select to authenticated using (is_moderator_or_admin());
create policy alert_escalation_steps_admin_write on alert_escalation_steps
  for all to authenticated
  using (current_profile_role() = 'administrator')
  with check (current_profile_role() = 'administrator');
