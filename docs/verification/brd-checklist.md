# BRD rule checklist

Each rule below was exercised against the running system, not inferred from code. The result column
says what was observed; anything not observed is listed under "Not verified" instead of passed.

- **Checked on:** 2026-10-08, backend `0e4bfc8`, frontend `cb10515` (the API probes ran against that
  backend; later frontend commits do not change any rule here).
- **Environment:** throwaway database `lcms_e2e`, freshly migrated and seeded, backend on `:4000`.
- **How:** `brd-probe.cjs` signs in as each seeded role, creates its own cases and runs every rule as
  real HTTP requests; `status-edit-probe.cjs` repeats the status-edit rule for every role. Both print the
  observed responses. Re-run with `node docs/verification/brd-probe.cjs` while the backend is running on a
  disposable database (they create cases).

## Results

| # | Rule | Result | What was observed |
|---|------|--------|-------------------|
| 1 | Only five statuses exist | Pass | Statuses present in the data: Submitted, Assigned, In Progress, Waiting on Input, Closed. "Escalated" is a flag, not a status (rule 4). |
| 2 | Status changes only through workflow actions | Pass | `PATCH /cases/:id` with `{status:"Closed"}`: a legal manager gets 403; the submitter on a still-Submitted case gets 200 but the status stays Submitted (the field is ignored, only the title changed); once the case is In Progress the submitter and an admin get 409, the assigned rep 403. No role changed the status. |
| 3 | Reassigning resets acceptance | Pass | Assign to rep 1, rep 1 accepts (In Progress), manager reassigns to rep 2: status returns to Assigned and `assignmentAcceptedAt` is null. |
| 4 | Escalation is independent of status | Pass | An In Progress case escalated shows `isEscalated: true` and is still In Progress; clearing the escalation leaves it In Progress. |
| 5 | Closure is blocked while an information request is open | Pass | Raising a request moves the case to Waiting on Input; closing it then returns 409 "Cannot transition case from 'Waiting on Input' to 'Closed'". After the requester responds, closing returns 200 and the case is Closed. |
| 6 | Internal notes are hidden from requesters | Pass | The requester's comment list shows the public reply and not the internal note; the manager sees both. Also covered end to end by `e2e/visibility.spec.ts` (comments tab and audit tab). |
| 7 | Unauthorised actions are rejected | Pass | Each returned 403: requester assigning a case, requester listing users, requester reading the audit log, viewer creating a case, viewer posting a comment, manager creating a user, a rep who is not assigned closing a case. A missing route (404) does not count as a pass in the probe. |
| 8 | Requester's entity and business unit are pre-filled and read-only | Pass | API: a requester who sends a different entity id still gets the case stored under their profile entity (AGC). UI: the new-request form shows "AGC · Head Office" as plain text with no input. |
| 9 | Confidential cases follow the confidentiality rules | Pass | A confidential case is a 404 for the viewer (direct URL) and absent from their list, and a 200 for the manager. Also covered by `e2e/visibility.spec.ts` (submitter, manager and assigned rep see it; viewer sees neither the case nor a change in dashboard totals). |
| 10 | Every action is audited with actor name and role | Pass | One probe case went through submit, assign, accept, raise request, wait, answer, resume, escalate, clear escalation and close: 12 audit entries, each with an actor name and role. The audit page shows them (`e2e/reports-audit.spec.ts`). |
| 11 | SLA badges are correct for breached, at-risk and met | Partly observed | Live data contains `on_track` (16), `met` (3) and `breached` (1), and every closed case is met or breached. **`at_risk` does not occur in the live data**; its rule (less than 20% of the window left) is covered only by the backend unit test `test/unit/modules/cases/sla.test.ts`. |

## Not verified here

- **At-risk badge on a live case.** Needs a case close to its deadline; the seed has none and time cannot
  be moved on this setup. The label and colour mapping are covered by frontend unit tests and the
  computation by the backend unit test above.
- **Every per-role action button in the browser.** Navigation per role is covered end to end
  (`e2e/auth.spec.ts` checks exactly which menu items each of the six roles sees), and action visibility by
  unit tests (for example the dashboard's Accept and Reject appear only on Assigned rows, and the users
  page hides every mutation control from a manager). The API rejections in rule 7 are the real enforcement.
- **Production-like deployment** (separate domains, HTTPS, cookie settings). See `docs/runbook.md`.

## UI requirements checked against the BRD document (2026-10-09)

Checked after reading the BRD PDF directly (the first pass above was written from the design specs).

| ID | Requirement | Result |
|----|-------------|--------|
| UI-07, DR-03 | Every dashboard tile and every chart bar is clickable and filters the case list | Pass. The status bar's segments and its legend entries link to the case list filtered by status; tiles already did. Verified in a browser: clicking "Submitted" narrows 8 cases to the 2 Submitted ones. |
| UI-08 | The same tiles and status chart appear above the case repository and act as filters | Pass. Shown above the list on the Cases page; they navigate that same page with the filter applied. |
| UI-18, PR-07 | Rules & SLAs readable by all roles, editable only by administrators, with an explicit read-only indication | Pass. Every role gets a "Rules & SLAs" page (SLA targets per case type, then routing rules) with the notice "This page is read-only. Only administrators can change rules and SLA targets." Admins see no notice and keep the edit controls. Viewers and requesters cannot look up representatives' names, so the "Assigned to" column is hidden for them. |

## Known gaps against the BRD (not fixed)

- **AC-03, SE-02:** access rules are enforced by the API server, not by database row-level security. No Postgres policies exist.
- **UI-11:** no lifecycle progress tracker on the case record was found.
- **UI-14:** attachments download, but no in-browser preview was found.
- **UI-12:** a person's designation is not shown next to every name.
- **AU-15 to AU-17:** the Baladi, Najiz and Oracle (Article 80) integration reviews are not done.
