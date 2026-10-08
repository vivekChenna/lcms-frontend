# LCMS roadmap

- [x] Establish blue design system and shared shell
- [x] Add typed REST client and demo data
- [x] Build role-aware dashboard and repository
- [x] Build guided request form and case detail workflows
- [x] Add reports, audit, rules, notifications, users, and master data
- [x] Light, dark and system themes; animated sidebar, drawer and page changes
- [x] End-to-end suite (Playwright) against the real stack: 28 tests, green three times on freshly rebuilt databases
- [x] BRD rules walked against the running API (`docs/verification/brd-checklist.md`)
- [ ] Verify desktop and mobile flows: automated matrix is green, real devices and dialogs are not yet checked (see "Not verified" in `docs/verification/responsive.md`)
- [ ] Deploy (static build behind the target host; backend CORS/cookie settings). Steps and the cross-site cookie requirements are in `docs/runbook.md`; not yet tried on DronaHQ.

## Deferred

- Real phone and tablet pass (iOS Safari, Android Chrome), including the on-screen keyboard and safe areas.
- WebKit in the e2e suite (needs Linux CI or macOS; this Windows machine lacks the libraries).
- Responsive and touch-target checks inside dialogs, drawers and menus, and for case detail tabs, new-request steps 2 and 3, other Master data tabs and the login page.
- A live case in the at-risk SLA state (covered by a backend unit test only).
- An independent whole-project code review before release.
- Reports and audit date filters accept only complete dates; typing a date is not possible with the picker.
- A page navigation that aborts an in-flight token refresh can sign the user out (backend reuse detection); see `docs/decisions.md`.
