-- Set the official "Produsen Dimsum Medan | TBM GRUP" work location to the
-- surveyed office coordinate and a 150 m accept radius (mirrors
-- scripts/seed-work-location.mjs). Attendance within 150 m is accepted
-- directly; beyond it routes to admin geo-review.
--
-- UPDATE-only, matched by the canonical id OR name: this can only correct the
-- existing seeded location in place, so it can never create a duplicate work
-- location. If the row is absent (the office was set up under a different
-- name), this is a no-op and the coordinate should be set via the admin
-- console (Dashboard -> Locations) instead. Idempotent: re-applying sets the
-- same values.
UPDATE "WorkLocation"
SET latitude = 3.6009345479119634,
    longitude = 98.69649918030287,
    radius = 150,
    "isActive" = true,
    "updatedAt" = now()
WHERE id = 'loc_produsen_dimsum_medan_tbm_grup'
   OR name = 'Produsen Dimsum Medan | TBM GRUP';
