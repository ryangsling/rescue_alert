-- CASE-005. exif_stripped defaulted to false with no constraint -
-- a client bug could silently insert a row claiming unstripped
-- media, and nothing would catch it. The actual stripping can only
-- happen client-side (this is SQL, not image processing), but this
-- constraint makes it structurally impossible to insert a
-- rescue_media row without explicitly asserting it happened, turning
-- a silent privacy bug into a hard insert failure instead.
alter table rescue_media
  add constraint rescue_media_exif_stripped_required check (exif_stripped = true);
