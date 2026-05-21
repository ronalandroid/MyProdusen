# Android Real Device Test — MyProdusen

Status date: 2026-05-22
Release candidate commit: d987fa7
Status: PENDING — not run in this session.

## Scope

Run on real Android Chrome over HTTPS (). Headless browser tests cannot prove camera, GPS sensor, device permission prompts, or selfie capture behavior.

## Preconditions

- Latest  redeployed on Coolify.
- Employee test account active and mapped to an active Employee row.
- Employee has active shift and active work location.
-  mounted and writable.
-  configured.

## Checklist

- [ ] Employee login succeeds.
- [ ] Camera permission prompt appears and can be granted.
- [ ] Location permission prompt appears and can be granted.
- [ ] Front-camera selfie preview is mirrored.
- [ ] GPS latitude/longitude collected.
- [ ] GPS accuracy shown clearly.
- [ ] Check-in succeeds inside allowed geofence.
- [ ] Check-out succeeds after check-in.
- [ ] Backend DB record exists for check-in and check-out.
- [ ] Selfie file stored under .
- [ ] Protected selfie endpoint opens for owner/Superadmin.
- [ ] Unauthorized user cannot access another employee selfie.
- [ ] Audit log exists for check-in/check-out and protected selfie access where applicable.
- [ ] Outside geofence or poor GPS accuracy shows clear Indonesian rejection/pending message.

## Evidence To Record

- Device model and Android version.
- Browser version.
- Test account role.
- Attendance ID.
- Audit log IDs.
- Upload file path prefix only, never full private filename in public docs.
- Pass/fail result and tester name.

## Current GO/NO-GO Impact

- Android real-device attendance flow is required for final production signoff.
- Until this checklist passes, status remains , not full .
