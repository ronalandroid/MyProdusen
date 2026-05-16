# Database Notes — MyProdusen

## Attendance Realtime Selfie Fields

Attendance stores realtime camera selfie proof. Manual upload/gallery picker is not allowed in the attendance flow.

Existing legacy fields remain for compatibility:

```txt
Attendance.checkInSelfie
Attendance.checkOutSelfie
```

New safe migration fields:

```txt
Attendance.check_in_selfie_url
Attendance.check_out_selfie_url
Attendance.check_in_selfie_uploaded_at
Attendance.check_out_selfie_uploaded_at
```

Migration file:

```txt
drizzle/migrations/0007_realtime_attendance_selfie.sql
```

Rules:

- Do not reset production database.
- Do not drop old selfie fields automatically.
- Store generated server-side filenames only.
- Selfie files are served through authenticated API route `/api/attendance/selfie/[filename]`.
