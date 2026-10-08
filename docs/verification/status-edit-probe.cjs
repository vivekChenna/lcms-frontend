const BASE = "http://localhost:4000",
  ORIGIN = "http://localhost:5173",
  PW = "Password123!";
const EMAIL = {
  requester: "vivek@gmail.com",
  manager: "viveklegalmanager@gmail.com",
  rep1: "viveklegalrep@gmail.com",
  admin: "vivekadmin@gmail.com",
};
const jars = {};
async function api(role, method, path, body) {
  const headers = { Origin: ORIGIN };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (jars[role])
    headers.Cookie = Object.entries(jars[role])
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [p] = c.split(";");
    const i = p.indexOf("=");
    (jars[role] ??= {})[p.slice(0, i)] = p.slice(i + 1);
  }
  const t = await res.text();
  let j = null;
  try {
    j = t ? JSON.parse(t) : null;
  } catch {
    j = t;
  }
  return { status: res.status, json: j };
}
const items = (j) => (Array.isArray(j) ? j : (j?.items ?? []));
(async () => {
  for (const r of Object.keys(EMAIL)) {
    const l = await api(r, "POST", "/auth/login", { email: EMAIL[r], password: PW });
    if (l.status !== 200) throw new Error("login " + r);
  }
  const cats = items((await api("manager", "GET", "/case-categories")).json),
    internal = cats.find((c) => c.name === "Internal") ?? cats[0];
  const types = items((await api("manager", "GET", `/case-types?categoryId=${internal.id}`)).json),
    deps = items((await api("manager", "GET", "/departments")).json);
  const reps = items(
      (await api("manager", "GET", "/users?role=legal_rep&isActive=true&pageSize=100")).json,
    ),
    rep1 = reps.find((r) => r.email === EMAIL.rep1);
  const c = (
    await api("requester", "POST", "/cases", {
      title: "status edit probe",
      description: "status edit probe with enough description text.",
      declarationConfirmed: true,
      categoryId: internal.id,
      caseTypeId: types[0].id,
      departmentId: deps[0].id,
    })
  ).json;
  await api("manager", "PATCH", `/cases/${c.id}/assign`, { targetLegalRepId: rep1.id });
  await api("rep1", "PATCH", `/cases/${c.id}/accept`, {});
  {
    // the one state where editing is allowed: a case that is still Submitted
    const s = (
      await api("requester", "POST", "/cases", {
        title: "submitted edit probe",
        description: "submitted edit probe with enough description text.",
        declarationConfirmed: true,
        categoryId: internal.id,
        caseTypeId: types[0].id,
        departmentId: deps[0].id,
      })
    ).json;
    const r = await api("requester", "PATCH", `/cases/${s.id}`, {
      status: "Closed",
      title: "edited while submitted",
    });
    const after = (await api("manager", "GET", `/cases/${s.id}`)).json;
    console.log(
      `SUBMITTED  requester PATCH {status:"Closed", title}: HTTP ${r.status} ${r.status >= 400 ? (r.json?.error?.message ?? "") : ""} | status now ${after.status} | title now "${after.title}"`,
    );
  }
  for (const role of ["requester", "rep1", "admin", "manager"]) {
    const before = (await api("manager", "GET", `/cases/${c.id}`)).json;
    const r = await api(role, "PATCH", `/cases/${c.id}`, {
      status: "Closed",
      title: `edited by ${role}`,
    });
    const after = (await api("manager", "GET", `/cases/${c.id}`)).json;
    console.log(
      `${role.padEnd(10)} PATCH {status:"Closed", title}: HTTP ${r.status} ${r.status >= 400 ? (r.json?.error?.message ?? "") : ""} | status ${before.status} -> ${after.status} | title now "${after.title}"`,
    );
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
