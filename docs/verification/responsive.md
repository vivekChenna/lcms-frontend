# Responsive and visual verification

- **Checked on:** 2026-10-08, against the throwaway database `lcms_e2e` (freshly seeded) and the frontend
  at the commit that adds this file.
- **Not signed off as complete.** The automated matrix is green, but several checks the plan asks for have
  not been done (see "Not verified"). Treat those as open until someone runs them.

## What is checked automatically

`e2e/responsive.spec.ts` signs in as each of the five roles and opens every page that role can reach (plus
one case detail page). For each page it asserts:

1. A `main` region renders, nothing is still loading, and no error screen is showing.
2. **No horizontal page scroll** (`scrollWidth <= innerWidth`).
3. **Navigation pattern for the width:** below 768px the sidebar is hidden and the hamburger is visible; from
   768px to 1023px the sidebar is an icon rail (80px or less) and the hamburger is visible; from 1024px the
   sidebar is visible and there is no hamburger.
4. **No record tables on phones** (below 768px); lists become cards. A chart's small data table is allowed
   (see rulings).
5. **The page heading** sits inside the viewport.
6. **44px touch targets below 768px** for every visible button, link, tab, select, input, menu item,
   checkbox and switch (dense links inside paragraphs excepted; a small switch or checkbox passes only if an
   invisible overlay makes its tap area 44px).

Viewports: 320x640, 360x740, 375x667, 390x844, 414x896, 768x1024, 820x1180, 1024x768, 1280x800, 1440x900,
1920x1080 and phone landscape 844x390 on desktop Chromium; the Pixel 7 profile at its native size.
Screenshots at 375, 820 and 1440 go to `e2e/screenshots/` (git-ignored).

## Results

| Run | Result |
|-----|--------|
| Desktop Chromium, 12 viewports, 5 roles, all rules above | 5 of 5 passed |
| Pixel 7, 5 roles, all rules above | 5 of 5 passed |
| Two earlier full-suite runs on freshly rebuilt databases (28 tests each: 18 functional, 10 responsive) | 28 of 28 passed both times. These ran with the first, weaker version of the spec (rules 1 and 2 only). |

## Reviewed by eye (screenshots)

Dashboard (manager, light and dark, desktop and phone); users (light desktop, dark phone); cases (light and
dark desktop); audit (light desktop); new request step 2 as a requester; the sidebar mid-collapse and
collapsed; the phone navigation drawer mid-slide.

## Defects found and fixed

| Found by | Defect | Fix |
|----------|--------|-----|
| Screenshot, cases at 1440px | The cases table was wider than its container; the SLA badge and created date were clipped. | One line per cell with ellipsis, tighter cell padding, Category hidden below 2xl, narrower name columns. |
| Screenshot, users and audit | Users table had 8 columns plus four text buttons per row; "Details" looked like plain text. | Name and email in one cell, organisation merged, one "Actions for <name>" menu, outlined buttons. |
| Touch-target scan at 390px | Small buttons (32 to 36px): Export CSV, Mark all as read, All/Unread, New user, row menus, audit Details. | `Button` sizes are 44px below `lg` and keep their desktop sizes from `lg`. |
| Same scan | Dashboard Assign 40px; legal rep Accept/Reject 40px; case detail actions 40px; Master data controls 32 to 40px. | Raised to 44px below `lg`. |
| Same scan | Reports and Master data tab bars 28px; Master data name input 40px. | Tab triggers and `Input` are 44px below `lg`. |
| Same scan | Switches 20px (confidential toggle, Deactivate toggles). | Invisible overlay gives a 44px tap area. |
| Same scan | Case reference links in audit cards 20px; rep names in dashboard cards 24px; "Back to cases" 20px. | Extra tap padding that does not change the layout. |
| Strengthened spec | A data table rendered on the reports page on phones. | Ruling below. |

## Rulings

- **Navigation at 768 to 1023px is an icon rail**, not "sidebar hidden below 1024" as the plan text says.
  This was the shell design chosen earlier; the hamburger still opens the full sheet there. The spec asserts
  the rail.
- **Chart data tables stay as tables on phones.** Each report chart has a small table as its text
  alternative; it fits the width and is marked `data-chart-table`. Record lists (cases, users, audit,
  notifications, rules) are cards below 768px.
- **Small switches and checkboxes are acceptable** because their tap area is extended to 44px.

## Not verified

- **Real devices.** No physical phone or tablet was used, so iOS Safari and Android Chrome behaviour
  (100dvh, input zoom, safe areas, home indicator, on-screen keyboard covering sticky footers) is untested.
  The safe-area padding is pinned only by class assertions in `app-shell.test.tsx`.
- **WebKit/Safari engine.** Playwright's WebKit needs system libraries that this Windows machine lacks.
- **Dialogs and drawers at phone width.** The matrix loads pages; it does not open dialogs, menus or
  popovers, so the touch-target and fit rules are not applied inside them. `ResponsiveDialog` is covered by
  unit tests only.
- **Case detail tabs and action dialogs, new-request steps 2 and 3, master data tabs other than the first,
  and the login page** are not in the matrix. Step 2 was viewed once at 1280px.
- **Dark mode** is not run through the matrix; it was reviewed in screenshots of the dashboard, cases and
  users pages only.
- **Loading, empty and error states** were not swept page by page in the browser; they are covered by unit
  tests.
- **Charts at 320px** were checked for overflow only, not for legibility.
