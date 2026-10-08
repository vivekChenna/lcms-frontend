// Walks the BRD rules against the live API (run it against a THROWAWAY database: it creates cases).
const BASE = "http://localhost:4000";
const ORIGIN = "http://localhost:5173";
const PW = "Password123!";
const EMAIL = {
  requester: "vivek@gmail.com",
  manager: "viveklegalmanager@gmail.com",
  rep1: "viveklegalrep@gmail.com",
  rep2: "viveklegalrep2@gmail.com",
  admin: "vivekadmin@gmail.com",
  viewer: "vivekviewer@gmail.com",
};
const jars = {};
const results = [];
const record = (rule, ok, detail) => {
  results.push({ rule, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${rule}\n      ${detail}`);
};

async function api(role, method, path, body, extraHeaders = {}) {
  const headers = { Origin: ORIGIN, ...extraHeaders };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const jar = jars[role];
  if (jar)
    headers.Cookie = Object.entries(jar)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const set = res.headers.getSetCookie?.() ?? [];
  if (set.length) {
    jars[role] ??= {};
    for (const c of set) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      jars[role][pair.slice(0, i)] = pair.slice(i + 1);
    }
  }
  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json };
}
const login = async (role) => {
  const r = await api(role, "POST", "/auth/login", { email: EMAIL[role], password: PW });
  if (r.status !== 200) throw new Error(`login ${role} -> ${r.status} ${JSON.stringify(r.json)}`);
  return r.json.user ?? r.json;
};
const errOf = (r) =>
  `${r.status} ${typeof r.json === "object" ? (r.json?.error?.message ?? r.json?.error?.code ?? "") : ""}`;
const items = (j) => (Array.isArray(j) ? j : (j?.items ?? []));

(async () => {
  const me = {};
  for (const role of Object.keys(EMAIL)) me[role] = await login(role);

  // lookups
  const cats = items((await api("manager", "GET", "/case-categories")).json);
  const internal = cats.find((c) => c.name === "Internal") ?? cats[0];
  const types = items((await api("manager", "GET", `/case-types?categoryId=${internal.id}`)).json);
  const deps = items((await api("manager", "GET", "/departments")).json);
  const outcomes = items((await api("manager", "GET", "/closure-outcomes")).json);
  const reps = items(
    (await api("manager", "GET", "/users?role=legal_rep&isActive=true&pageSize=100")).json,
  );
  const rep1 = reps.find((r) => r.email === EMAIL.rep1);
  const rep2 = reps.find((r) => r.email === EMAIL.rep2);

  const newCase = async (title, extra = {}) => {
    const r = await api("requester", "POST", "/cases", {
      title,
      description: `${title} - a long enough description for validation.`,
      declarationConfirmed: true,
      categoryId: internal.id,
      caseTypeId: types[0].id,
      departmentId: deps[0].id,
      ...extra,
    });
    if (r.status !== 201 && r.status !== 200) throw new Error("create case failed " + errOf(r));
    return r.json;
  };
  const getCase = async (role, id) => (await api(role, "GET", `/cases/${id}`)).json;

  // 1. five statuses only
  const list = await api("manager", "GET", "/cases?pageSize=100");
  const statuses = [...new Set(items(list.json).map((c) => c.status))];
  const ALLOWED = ["Submitted", "Assigned", "In Progress", "Waiting on Input", "Closed"];
  record(
    "Only five statuses exist",
    statuses.every((s) => ALLOWED.includes(s)),
    `statuses in use: ${statuses.join(", ")}`,
  );

  // 2. status can't be set directly
  const c1 = await newCase("BRD probe status guard");
  const patch = await api("manager", "PATCH", `/cases/${c1.id}`, { status: "Closed" });
  const after = await getCase("manager", c1.id);
  record(
    "Status changes only through workflow actions",
    after.status === "Submitted",
    `PATCH {status:"Closed"} -> ${errOf(patch)}; status afterwards: ${after.status}`,
  );

  // 3. reassign resets acceptance
  const a1 = await api("manager", "PATCH", `/cases/${c1.id}/assign`, { targetLegalRepId: rep1.id });
  const acc = await api("rep1", "PATCH", `/cases/${c1.id}/accept`, {});
  const afterAccept = await getCase("manager", c1.id);
  const re = await api("manager", "PATCH", `/cases/${c1.id}/assign`, { targetLegalRepId: rep2.id });
  const afterReassign = await getCase("manager", c1.id);
  const acceptKeys = Object.keys(afterReassign).filter((k) => /accept/i.test(k));
  record(
    "Reassigning resets acceptance",
    a1.status < 300 &&
      acc.status < 300 &&
      afterAccept.status === "In Progress" &&
      afterReassign.status === "Assigned" &&
      afterReassign.assignedLegalRepName === me.rep2.fullName,
    `assign ${a1.status}, accept ${acc.status} -> ${afterAccept.status}; reassign ${re.status} -> ${afterReassign.status} to ${afterReassign.assignedLegalRepName}${acceptKeys.length ? "; " + acceptKeys.map((k) => `${k}=${afterReassign[k]}`).join(", ") : ""}`,
  );

  // 4. escalation independent of status (rep2 accepts, then escalate; status stays In Progress)
  await api("rep2", "PATCH", `/cases/${c1.id}/accept`, {});
  const before = await getCase("manager", c1.id);
  const esc = await api("rep2", "PATCH", `/cases/${c1.id}/escalate`, {
    isEscalated: true,
    reason: "BRD probe escalation",
  });
  const escAfter = await getCase("manager", c1.id);
  const deesc = await api("rep2", "PATCH", `/cases/${c1.id}/escalate`, { isEscalated: false });
  const deAfter = await getCase("manager", c1.id);
  record(
    "Escalation is independent of status",
    esc.status < 300 &&
      escAfter.isEscalated === true &&
      escAfter.status === before.status &&
      deAfter.isEscalated === false &&
      deAfter.status === before.status,
    `status ${before.status} -> escalated: ${escAfter.isEscalated}, status ${escAfter.status} -> de-escalated: ${deAfter.isEscalated}, status ${deAfter.status}`,
  );

  // 5. closure blocked by an open information request
  const ir = await api("rep2", "POST", `/cases/${c1.id}/information-requests`, {
    subject: "Need a document",
    requirementDescription: "Please send the signed copy.",
    responderId: me.requester.id,
  });
  const closeBody = {
    confirm: true,
    closureSummary: "BRD probe closure",
    closureOutcomeId: outcomes[0].id,
  };
  const blocked = await api("rep2", "PATCH", `/cases/${c1.id}/close`, closeBody);
  const stillOpen = await getCase("manager", c1.id);
  const resp = await api("requester", "POST", `/information-requests/${ir.json?.id}/respond`, {
    responseText: "Here it is.",
  });
  const closed = await api("rep2", "PATCH", `/cases/${c1.id}/close`, closeBody);
  const closedCase = await getCase("manager", c1.id);
  record(
    "Closure is blocked while an information request is open",
    ir.status < 300 &&
      blocked.status >= 400 &&
      stillOpen.status !== "Closed" &&
      closed.status < 300 &&
      closedCase.status === "Closed",
    `raise IR ${ir.status}; close with it open -> ${errOf(blocked)} (status ${stillOpen.status}); respond ${resp.status}; close after response -> ${closed.status} (status ${closedCase.status})`,
  );

  // 6. internal notes hidden from requesters
  const c2 = await newCase("BRD probe internal note");
  await api("manager", "PATCH", `/cases/${c2.id}/assign`, { targetLegalRepId: rep1.id });
  await api("rep1", "PATCH", `/cases/${c2.id}/accept`, {});
  const note = await api("rep1", "POST", `/cases/${c2.id}/comments`, {
    body: "SECRET-INTERNAL-NOTE",
    isInternal: true,
  });
  await api("rep1", "POST", `/cases/${c2.id}/comments`, {
    body: "PUBLIC-REPLY",
    isInternal: false,
  });
  const reqComments = JSON.stringify(
    (await api("requester", "GET", `/cases/${c2.id}/comments`)).json,
  );
  const mgrComments = JSON.stringify(
    (await api("manager", "GET", `/cases/${c2.id}/comments`)).json,
  );
  record(
    "Internal notes are hidden from requesters",
    note.status < 300 &&
      !reqComments.includes("SECRET-INTERNAL-NOTE") &&
      reqComments.includes("PUBLIC-REPLY") &&
      mgrComments.includes("SECRET-INTERNAL-NOTE"),
    `requester sees public reply: ${reqComments.includes("PUBLIC-REPLY")}, sees internal note: ${reqComments.includes("SECRET-INTERNAL-NOTE")}; manager sees internal note: ${mgrComments.includes("SECRET-INTERNAL-NOTE")}`,
  );

  // 7. unauthorised actions rejected
  const denials = [
    [
      "requester assigns a case",
      await api("requester", "PATCH", `/cases/${c2.id}/assign`, { targetLegalRepId: rep2.id }),
    ],
    ["requester lists users", await api("requester", "GET", "/users")],
    ["requester reads the audit log", await api("requester", "GET", "/audit")],
    [
      "viewer creates a case",
      await api("viewer", "POST", "/cases", {
        title: "x",
        description: "y".repeat(25),
        declarationConfirmed: true,
        categoryId: internal.id,
        caseTypeId: types[0].id,
        departmentId: deps[0].id,
      }),
    ],
    [
      "viewer posts a comment",
      await api("viewer", "POST", `/cases/${c2.id}/comments`, { body: "hi" }),
    ],
    [
      "manager creates a user",
      await api("manager", "POST", "/users", {
        fullName: "x",
        email: "x@example.com",
        password: "Password123!",
        role: "viewer",
      }),
    ],
    [
      "legal rep (not assigned) closes a case",
      await api("rep2", "PATCH", `/cases/${c2.id}/close`, closeBody),
    ],
  ];
  record(
    "Unauthorised actions are rejected",
    denials.every(([, r]) => r.status === 401 || r.status === 403),
    denials.map(([n, r]) => `${n}: ${errOf(r)}`).join(" | "),
  );

  // 8. requester entity/business unit pre-filled and non-editable
  const otherEntity = items((await api("manager", "GET", "/entities")).json).find(
    (e) => e.id !== me.requester.entityId,
  );
  const c3 = await newCase(
    "BRD probe entity prefill",
    otherEntity ? { entityId: otherEntity.id } : {},
  );
  const c3Full = await getCase("manager", c3.id);
  record(
    "Requester's entity is taken from their profile, not the request",
    c3Full.entityId === me.requester.entityId,
    `profile entity ${me.requester.entityName} (${me.requester.entityId}); case stored ${c3Full.entityName} (${c3Full.entityId}) after sending ${otherEntity ? "a different entity id" : "no entity"}`,
  );

  // 9. confidential cases hidden from viewer
  const c4 = await newCase("BRD probe confidential", { isConfidential: true });
  const viewerGet = await api("viewer", "GET", `/cases/${c4.id}`);
  const viewerList = JSON.stringify((await api("viewer", "GET", "/cases?pageSize=100")).json);
  const mgrGet = await api("manager", "GET", `/cases/${c4.id}`);
  record(
    "Confidential cases are hidden from the viewer",
    viewerGet.status === 404 && !viewerList.includes(c4.id) && mgrGet.status === 200,
    `viewer direct GET -> ${viewerGet.status}; in viewer list: ${viewerList.includes(c4.id)}; manager GET -> ${mgrGet.status}`,
  );

  // 10. audit entries carry actor name and role
  const audit = await api("manager", "GET", `/cases/${c1.id}/audit?page=1&pageSize=50`);
  const rows = items(audit.json);
  const actions = [...new Set(rows.map((r) => r.action))];
  record(
    "Every audit entry names the actor and role",
    rows.length > 0 && rows.every((r) => r.actorName && r.actorRole),
    `${rows.length} entries on the probe case; actions: ${actions.join(", ")}`,
  );

  // 11. SLA states present across the data
  const all = items((await api("manager", "GET", "/cases?pageSize=100")).json);
  const sla = {};
  for (const c of all) sla[c.slaState] = (sla[c.slaState] ?? 0) + 1;
  const closedMet = all
    .filter((c) => c.status === "Closed")
    .every((c) => c.slaState === "met" || c.slaState === "breached");
  record(
    "SLA states are reported (on_track, at_risk, breached, met)",
    Object.keys(sla).length >= 3 && closedMet,
    `distribution: ${JSON.stringify(sla)}; every closed case is met or breached: ${closedMet}`,
  );

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} rules passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error("PROBE ERROR:", e.message);
  process.exit(2);
});
