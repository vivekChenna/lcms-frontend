# Frontend runbook

Operating the LCMS web client: environment, build and deploy, tests, and troubleshooting.
Standing up the whole stack (Postgres, MinIO, MailHog, backend) is covered in the backend repo's
`docs/integration-runbook.md` — start there on a clean machine.

## Environment

One variable, read at build time (Vite inlines it into the bundle):

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:4000` | Origin of the backend API, no trailing slash |
| `VITE_NOTIFICATION_SOUND` | off | Set to `true` to play a chime on new notifications and show the sound switch on the Profile page. Any other value, or none, leaves it off |

Changing it requires a rebuild (`npm run build`); the dev server needs a restart.

## Build and deploy

```sh
npm ci
VITE_API_BASE_URL=https://api.example.com npm run build
```

The output is `dist/index.html` plus hashed assets: a static single-page app, no server runtime.
Preview it locally with `npm run preview`.

Hosting requirements, in particular for DronaHQ:

- Serve `dist/` as-is. Deep links such as `/cases/<id>` must fall back to `index.html`
  (history-API routing); without that, refreshing a non-root page returns 404.
- The app's origin must be listed in the backend's `CORS_ORIGINS`, exactly (scheme, host, port).
- Authentication uses HttpOnly cookies sent with `credentials: 'include'`. If the app and the API are
  on **different sites**, the backend needs `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true`
  (HTTPS on both), or the browser drops the cookies and every request looks signed out.
  Same-site deployments (for example `app.example.com` and `api.example.com`) can keep `lax`
  with `COOKIE_DOMAIN=.example.com`.
- Not yet verified on DronaHQ itself: confirm the three points above on a real deployment.

## Tests

| Command | Scope |
| --- | --- |
| `npm run lint` | ESLint (8 known `react-refresh` warnings are accepted) |
| `npx tsc --noEmit` | Typecheck |
| `npm test` | Vitest unit and component suite |
| `npm run build` | Production build |
| `npm run e2e` | Playwright end-to-end suite |

### End-to-end suite

Needs the backend on `http://localhost:4000` running against a **freshly seeded throwaway database**
(never your dev database; the specs create cases and users). Setup commands are in the backend runbook,
section "End-to-end suite". Playwright starts a Vite server on 5173, or reuses one already running there.

```sh
npm run e2e                                          # everything
npm run e2e -- visibility.spec.ts --project=chromium # one spec
```

| Spec | Covers |
| --- | --- |
| `auth.spec.ts` | Sign-in and the navigation each role sees |
| `workflow.spec.ts` | Submit, assign, accept, information request, comments, escalate, close |
| `visibility.spec.ts` | Confidential cases and internal notes hidden from other roles |
| `admin.spec.ts` | Users, master data, deactivation signs the user out |
| `reports-audit.spec.ts` | CSV export, audit log, date-range validation |
| `responsive.spec.ts` | Every role's pages at 12 viewports (320 to 1920 wide, plus phone landscape) and on a Pixel 7 |

Artifacts: HTML report in `playwright-report/`, failure traces in `test-results/`,
screenshots in `e2e/screenshots/` (all git-ignored). Open the report with `npx playwright show-report`.

Known limits: the suite runs on Chromium only. Playwright's WebKit build needs system libraries
(`jxl.dll`, `libwebpdemux.dll`) that were missing on the development machine, so Safari is untested.
The backend allows 5 logins per minute per account; the suite's `loginAs` helper waits and retries when throttled.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| "This page didn't load" or "Can't reach the server" | Backend not running, wrong `VITE_API_BASE_URL`, or the page's origin is missing from the backend's `CORS_ORIGINS` (Vite moves to 5174 if 5173 is taken). |
| Signed out after every refresh in a deployed build | Cookies dropped: check `COOKIE_SAMESITE`, `COOKIE_SECURE` and `CORS_ORIGINS` as above. |
| Deep link returns 404 in production | Host lacks the fallback to `index.html`. |
| e2e specs fail "Too many attempts" | Login rate limit; wait a minute. Do not run two suites against one backend. |
| Flaky unit tests, high CPU | Orphaned headless Chrome from a crashed e2e run: end all `chrome.exe` processes. |
