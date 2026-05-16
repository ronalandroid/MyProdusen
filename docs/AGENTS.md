# Agents Notes — MyProdusen

## Current Implementation Focus

MyProdusen uses Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, Docker, and Coolify.

## Attendance Selfie Rule

Attendance selfie proof must be captured directly from realtime device camera.

Do not add:

- `input type="file"`
- gallery picker
- manual upload fallback
- `accept="image/*"` attendance picker

Required flow:

1. Open device camera with `navigator.mediaDevices.getUserMedia()`.
2. Show live video preview.
3. Capture frame through canvas.
4. Submit selfie as `FormData` blob.
5. Backend validates and stores generated filename.
6. Selfie proof is served only through authorized API route.

## Security

Never log or commit secrets. Keep production credentials only in Coolify environment variables.
