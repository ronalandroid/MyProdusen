# Final Checklist

## Product Ready
- [ ] PRD accepted by owner.
- [ ] MVP scope frozen.
- [ ] Phase 2 features clearly separated.

## Docs Ready
- [ ] `docs/prd.md` current.
- [ ] `docs/CURRENT_STATE.md` current.
- [ ] `docs/IMPLEMENTATION_PLAN.md` current.
- [ ] `docs/API_GAP_MATRIX.md` current.
- [ ] `docs/DEPLOYMENT.md` current.
- [ ] `docs/SECURITY.md` current.

## Security Ready
- [ ] Strong `JWT_SECRET` configured.
- [ ] Backend RBAC and row-level scoping tested.
- [ ] Dashboard protected.
- [ ] Upload validation implemented.
- [ ] Audit logs written for critical actions.

## Database Ready
- [ ] Prisma migrations committed.
- [ ] Production reset commands disabled/documented as forbidden.
- [ ] Seed strategy safe.
- [ ] Backup/restore tested.

## UI Ready
- [ ] Login uses real API.
- [ ] Dashboard uses real data.
- [ ] Mobile responsive pages verified.
- [ ] WCAG-friendly contrast/focus states verified.

## Attendance Ready
- [ ] Work locations complete.
- [ ] GPS geofence backend validation tested.
- [ ] Selfie upload durable.
- [ ] Check-in/check-out edge cases tested.

## KPI + Reports Ready
- [ ] KPI service/routes complete.
- [ ] KPI scoring tested.
- [ ] Reports/export endpoints complete.
- [ ] Dashboard aggregation tested.

## Deployment Ready
- [ ] Docker image builds.
- [ ] Coolify env vars configured.
- [ ] Persistent uploads volume mounted.
- [ ] Healthcheck passes.
- [ ] Production build passes.

## Demo Ready
- [ ] Demo users safe.
- [ ] Demo data realistic.
- [ ] Critical user flows rehearsed.
