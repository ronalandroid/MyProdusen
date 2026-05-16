# Final Checklist — MyProdusen

## Required Before Production

- [ ] Configure `DATABASE_URL` in Coolify.
- [ ] Configure `JWT_SECRET` with 32+ random characters.
- [ ] Configure `NEXT_PUBLIC_APP_URL` and `APP_URL` with production domain.
- [ ] Configure `SUPERADMIN_EMAIL=<SUPERADMIN_EMAIL>` in Coolify only.
- [ ] Configure `SUPERADMIN_USERNAME=superadmin`.
- [ ] Configure `SUPERADMIN_PASSWORD=<STRONG_SUPERADMIN_PASSWORD>` in Coolify only, then rotate or remove bootstrap env after first login.
- [ ] Configure `RESEND_API_KEY` from Resend.
- [ ] Configure `RESEND_FROM_EMAIL` with verified Resend sender/domain.
- [ ] Run `npm run bootstrap:superadmin` after database migration.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.

## Superadmin

- [ ] Login works for configured `SUPERADMIN_EMAIL`.
- [ ] Superadmin can see dashboard.
- [ ] Superadmin can view users from `/api/users`.
- [ ] Superadmin can change user role through `/api/users/:id/role`.
- [ ] Superadmin can activate/deactivate registered users.

## Email

- [ ] Registration email sends through Resend.
- [ ] Forgot password email sends reset link.
- [ ] Reset password confirmation email sends.
- [ ] Role changed email sends.
- [ ] Account approved email sends.

## Coolify

- [ ] Build command: `npm run build`.
- [ ] Start command: `npm run start`.
- [ ] Persistent upload volume configured for `UPLOAD_DIR`.
- [ ] PostgreSQL backup schedule configured.
