# React Doctor false positives

Documented suppressions verified against each rule's canonical validation prompt.

## react-doctor/no-adjust-state-on-prop-change

The four `error`-severity hits are false positives. The rule's own validation
prompt states it should NOT fire when the effect kicks off async work (fetch,
geolocation, media teardown) whose later callback sets state — only synchronous
prop-derived setters are real. All four sites set state to start async work:

- `app/dashboard/employees/[id]/page.tsx:43` — mount/id effect launches async `checkRole()` + `fetchEmployee()`.
- `src/components/attendance/RealtimeSelfieCamera.tsx:141` — imperative media-stream teardown (`stopCamera`) on `disabled` prop, an external side effect, not duplicated state.
- `src/components/dashboard/EmployeeBeranda.tsx:308` — `setIsGettingGps(true)` starts async `navigator.geolocation.getCurrentPosition`.
- `src/components/dashboard/LeaderBeranda.tsx:259` — same async geolocation start.
