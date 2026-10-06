# Algihaz Legal Case Management System

## Design direction
- Greenfield internal enterprise application using a calm blue visual system.
- Fluent UI foundation for accessible, dense operational screens.
- Design dials: variance 3, motion 2, density 8. The interface prioritizes speed, trust, and scannability over decorative motion.
- Serif headings paired with a clean sans-serif UI face, as requested.

## Build scope
- Create the full application shell with responsive left navigation, page header, notifications, user identity, and role switcher for previewing permissions.
- Add distinct screens for Login, Dashboard, Case Repository, New Request, Case Detail, Reports, Audit, Rules & SLAs, Notifications, Users, and Master Data.
- Implement role-based visibility for exactly `admin`, `legal_manager`, `legal_rep`, `requester`, and `viewer`.
- Build realistic working interactions: repository filtering, dashboard chart filters, intake steps and validation, case tabs, accept/reject, escalation, information-request history, closure confirmation, exports, and admin soft-deactivation flows.
- Add loading, empty, and error presentations for data-driven areas.

## REST integration
- Add a typed API client using `VITE_API_BASE_URL`, bearer tokens, one-time refresh on 401, logout handling, paginated response support, and structured field-error mapping.
- Keep a local demonstration dataset when no API URL is configured so the full interface remains reviewable without inventing a backend.
- Use React Hook Form with colocated Zod schemas for login, intake, rejection, reopening, closing, and administrative forms.

## Rules enforced
- Status changes only through lifecycle actions, never a generic status editor.
- Reassignment resets acceptance, escalation stays independent, and closure is blocked by open information requests.
- Requester-visible communication remains separate from internal legal notes.
- Unauthorized actions are hidden, not merely disabled.
- No Lovable Cloud or database changes.

## Verification
- Check every route for unique page metadata.
- Verify the central flows on desktop and mobile: role navigation, case filtering, request submission, case actions, and admin restrictions.
- Confirm the latest project health report is clean and inspect key screens visually.
