import {
  Badge,
  Button,
  Checkbox,
  Dropdown,
  Field,
  FluentProvider,
  Input,
  Option,
  Spinner,
  Textarea,
  Tooltip,
  webLightTheme,
} from "@fluentui/react-components";
import {
  Alert24Regular,
  ArrowDownload24Regular,
  ArrowRight24Regular,
  Building24Regular,
  Calendar24Regular,
  Checkmark24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  ClipboardTaskListLtr24Regular,
  DataBarVertical24Regular,
  DocumentAdd24Regular,
  DocumentBulletList24Regular,
  DocumentSearch24Regular,
  Filter24Regular,
  Gavel24Regular,
  Grid24Regular,
  Navigation24Regular,
  People24Regular,
  Person24Regular,
  Search24Regular,
  Settings24Regular,
  ShieldTask24Regular,
  SignOut24Regular,
} from "@fluentui/react-icons";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast, Toaster } from "sonner";
import { cases, roleLabels, type CaseStatus, type LegalCase } from "@/lib/lcms-data";
import { hasRemoteApi, type UserRole } from "@/lib/lcms-api";
import { useLcms } from "@/lib/lcms-context";

type PageKey = "dashboard" | "cases" | "new-request" | "case-detail" | "reports" | "audit" | "rules" | "notifications" | "users" | "master-data";

const nav = [
  { label: "Dashboard", to: "/", icon: Grid24Regular, roles: ["admin", "legal_manager", "legal_rep", "requester", "viewer"] },
  { label: "Case Repository", to: "/cases", icon: DocumentSearch24Regular, roles: ["admin", "legal_manager", "legal_rep", "requester", "viewer"] },
  { label: "New Request", to: "/new-request", icon: DocumentAdd24Regular, roles: ["admin", "legal_manager", "legal_rep", "requester"] },
  { label: "Reports", to: "/reports", icon: DataBarVertical24Regular, roles: ["admin", "legal_manager", "viewer"] },
  { label: "Audit", to: "/audit", icon: ShieldTask24Regular, roles: ["admin", "legal_manager"] },
  { label: "Rules & SLAs", to: "/rules", icon: ClipboardTaskListLtr24Regular, roles: ["admin", "legal_manager", "legal_rep", "requester", "viewer"] },
  { label: "Notifications", to: "/notifications", icon: Alert24Regular, roles: ["admin", "legal_manager", "legal_rep", "requester", "viewer"] },
  { label: "Users", to: "/users", icon: People24Regular, roles: ["admin", "legal_manager"] },
  { label: "Master Data", to: "/master-data", icon: Settings24Regular, roles: ["admin"] },
] as const;

const pageTitles: Record<PageKey, [string, string]> = {
  dashboard: ["Legal operations overview", "Monitor case volume, ownership, and deadlines across the group."],
  cases: ["Case repository", "Search, filter, and review every matter available to your role."],
  "new-request": ["Submit a legal request", "Provide the information Legal needs to assess and route your matter."],
  "case-detail": ["Eastern Region fleet supply agreement", "LC-2026-184"],
  reports: ["Reports", "Review legal demand, SLA compliance, ageing, and team workload."],
  audit: ["Audit log", "Review system activity and workflow decisions across all cases."],
  rules: ["Rules & SLAs", "Review routing rules, service targets, and case classifications."],
  notifications: ["Notifications", "Track assignments, responses, rejections, and SLA alerts."],
  users: ["User administration", "Manage access, roles, and active accounts."],
  "master-data": ["Master data", "Maintain the controlled lists used throughout LCMS."],
};

export function LcmsApp({ page }: { page: PageKey }) {
  const { role, setRole, user, setSignedIn, sidebarCollapsed, setSidebarCollapsed } = useLcms();
  const [mobileNav, setMobileNav] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [title, subtitle] = pageTitles[page];
  const collapsed = sidebarCollapsed && !mobileNav;
  return (
    <FluentProvider theme={webLightTheme}>
      <div className={`min-h-[100dvh] bg-background text-foreground lg:grid ${collapsed ? "lg:grid-cols-[72px_minmax(0,1fr)]" : "lg:grid-cols-[248px_minmax(0,1fr)]"}`}>
        <aside className={`${mobileNav ? "fixed inset-y-0 left-0 z-30 flex" : "hidden"} w-[248px] flex-col bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:flex lg:h-[100dvh] ${sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[248px]"}`}>
          <div className="flex h-[72px] items-center gap-3 border-b border-sidebar-border px-5">
            {collapsed ? (
              <div className="group relative mx-auto grid size-9 shrink-0 place-items-center">
                <div className="grid size-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground transition-opacity group-hover:opacity-0"><Gavel24Regular /></div>
                <Tooltip content="Open sidebar" relationship="label" positioning="after">
                  <button type="button" aria-label="Open sidebar" onClick={() => setSidebarCollapsed(false)} className="absolute inset-0 grid place-items-center rounded-md bg-sidebar-hover text-sidebar-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    <ChevronRight24Regular />
                  </button>
                </Tooltip>
              </div>
            ) : (
              <>
                <div className="grid size-9 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><Gavel24Regular /></div>
                <div className="min-w-0 flex-1"><strong className="font-display text-lg font-semibold">Algihaz Legal</strong><p className="text-xs text-sidebar-muted">Case management</p></div>
                <Tooltip content="Collapse sidebar" relationship="label">
                  <Button appearance="subtle" icon={<ChevronLeft24Regular />} aria-label="Collapse sidebar" onClick={() => setSidebarCollapsed(true)} className="hidden shrink-0 lg:inline-flex" />
                </Tooltip>
              </>
            )}
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
            {nav.filter((item) => item.roles.includes(role)).map((item) => {
              const Icon = item.icon;
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const link = <Link key={item.to} to={item.to} onClick={() => setMobileNav(false)} className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${collapsed ? "justify-center px-0" : ""} ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"}`}><Icon />{!collapsed && <span>{item.label}</span>}{!collapsed && item.label === "Notifications" && <span className="ml-auto rounded-full bg-notification px-1.5 py-0.5 font-mono text-[10px] text-notification-foreground">4</span>}</Link>;
              return collapsed ? <Tooltip key={item.to} content={item.label} relationship="label" positioning="after">{link}</Tooltip> : link;
            })}
          </nav>
          <div className="border-t border-sidebar-border p-3">
            <div className={`flex items-center gap-3 rounded-md p-2 ${collapsed ? "flex-col" : ""}`}>
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-sidebar-avatar text-sm font-semibold">{user.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>
              {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-sidebar-muted">{user.designation}</p></div>}
              <Tooltip content="Sign out" relationship="label"><Button appearance="subtle" icon={<SignOut24Regular />} aria-label="Sign out" onClick={() => setSignedIn(false)} /></Tooltip>
            </div>
          </div>
        </aside>
        {mobileNav && <button className="fixed inset-0 z-20 bg-overlay lg:hidden" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
        <main className="min-w-0">
          <header className="sticky top-0 z-10 flex h-[72px] items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-7">
            <Button appearance="subtle" icon={<Navigation24Regular />} aria-label="Open navigation" className="lg:hidden" onClick={() => setMobileNav(true)} />
            <div className="min-w-0 flex-1"><h1 className="truncate font-display text-2xl font-semibold">{title}</h1><p className="hidden truncate text-sm text-muted-foreground sm:block">{subtitle}</p></div>
            {!hasRemoteApi() && <Badge appearance="tint" color="informative">Demo data</Badge>}
            <Dropdown aria-label="Preview role" value={roleLabels[role]} selectedOptions={[role]} onOptionSelect={(_, data) => setRole(data.optionValue as UserRole)} className="hidden w-44 md:block">
              {Object.entries(roleLabels).map(([value, label]) => <Option key={value} value={value}>{label}</Option>)}
            </Dropdown>
            <Tooltip content="Notifications" relationship="label"><Link to="/notifications" className="relative grid size-9 place-items-center rounded-md hover:bg-muted"><Alert24Regular /><span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-notification" /></Link></Tooltip>
          </header>
          <div className="mx-auto max-w-[1500px] p-4 md:p-7">
            {page === "dashboard" && <Dashboard role={role} />}
            {page === "cases" && <Repository />}
            {page === "new-request" && <NewRequest role={role} />}
            {page === "case-detail" && <CaseDetail role={role} />}
            {page === "reports" && <Reports />}
            {page === "audit" && <Audit />}
            {page === "rules" && <Rules role={role} />}
            {page === "notifications" && <Notifications />}
            {page === "users" && <Users role={role} currentUser={user.name} />}
            {page === "master-data" && <MasterData />}
          </div>
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </FluentProvider>
  );
}

function Dashboard({ role }: { role: UserRole }) {
  const navigate = useNavigate();
  const metrics = [["Total cases", "124"], ["Open", "37"], ["Awaiting acceptance", "6"], ["Waiting on input", "9"], ["Overdue", "5"], ["Closed this month", "18"]];
  return <div className="space-y-6">
    <section className="grid grid-cols-2 border border-border bg-card md:grid-cols-3 xl:grid-cols-6">
      {metrics.map(([label, value], index) => <button key={label} onClick={() => navigate({ to: "/cases", search: { status: label } })} className={`min-h-24 p-4 text-left transition-colors hover:bg-muted ${index ? "border-l border-border" : ""} ${index > 1 ? "border-t md:border-t-0" : ""}`}><p className="font-mono text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></button>)}
    </section>
    <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
      <Panel title="Caseload by status" action="Open repository">
        <div className="space-y-5 py-3">{[["In Progress", 56, 17], ["Waiting on Input", 38, 9], ["Assigned", 26, 6], ["Submitted", 18, 5], ["Closed", 68, 18]].map(([label, width, count]) => <button key={label} onClick={() => navigate({ to: "/cases", search: { status: label } })} className="grid w-full grid-cols-[120px_1fr_32px] items-center gap-3 text-left text-sm"><span>{label}</span><span className="h-3 bg-chart-track"><span className="block h-full bg-chart" style={{ width: `${width}%` }} /></span><span className="font-mono text-muted-foreground">{count}</span></button>)}</div>
      </Panel>
      <Panel title={role === "legal_manager" ? "Unassigned queue" : role === "legal_rep" ? "My assigned cases" : "Priority attention"}>
        <div className="divide-y divide-border">{cases.slice(0, 4).map((item) => <Link key={item.id} to="/cases/$caseId" params={{ caseId: item.id }} className="flex items-center gap-3 py-3 hover:text-primary"><PriorityMark priority={item.priority} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.id} · {item.target}</p></div><ArrowRight24Regular /></Link>)}</div>
      </Panel>
    </div>
    <CaseTable rows={cases.slice(0, 5)} title="Recent cases" />
  </div>;
}

function Repository() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const filtered = useMemo(() => cases.filter((item) => (status === "All statuses" || item.status === status) && `${item.id} ${item.title} ${item.department}`.toLowerCase().includes(query.toLowerCase())), [query, status]);
  return <div className="space-y-5">
    <div className="flex flex-col gap-3 md:flex-row">
      <Input contentBefore={<Search24Regular />} placeholder="Search case number, title, department" value={query} onChange={(_, data) => setQuery(data.value)} className="min-w-0 flex-1" />
      <Dropdown value={status} selectedOptions={[status]} onOptionSelect={(_, data) => setStatus(data.optionText ?? "All statuses")}><Option>All statuses</Option>{["Submitted", "Assigned", "In Progress", "Waiting on Input", "Closed"].map((value) => <Option key={value}>{value}</Option>)}</Dropdown>
      <Button appearance="secondary" icon={<Filter24Regular />}>More filters</Button>
      <Button appearance="secondary" icon={<ArrowDownload24Regular />} onClick={() => toast.success("Case report exported")}>Export CSV</Button>
    </div>
    {filtered.length ? <CaseTable rows={filtered} title={`${filtered.length} cases`} /> : <EmptyState title="No matching cases" body="Change your search or filters to see more results." />}
  </div>;
}

const requestSchema = z.object({ title: z.string().min(3, "Enter a clear request title."), category: z.string().uuid("Select a category."), type: z.string().uuid("Select a request type."), description: z.string().min(20, "Add at least 20 characters."), declaration: z.literal(true, { errorMap: () => ({ message: "Confirm that the information is accurate." }) }) });
type RequestValues = z.infer<typeof requestSchema>;

function NewRequest({ role }: { role: UserRole }) {
  const [step, setStep] = useState(1);
  const form = useForm<RequestValues>({ resolver: zodResolver(requestSchema), mode: "onBlur", defaultValues: { title: "", category: role === "requester" ? "11111111-1111-4111-8111-111111111111" : "", type: "", description: "", declaration: false } });
  const description = form.watch("description") || "";
  const submit = form.handleSubmit(() => { setStep(3); toast.success("Request submitted and routed to Legal"); }, () => setStep(1));
  return <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6">
    <div className="grid grid-cols-3 border border-border bg-card">{["Request details", "Organisation", "Review"].map((label, index) => <div key={label} className={`flex items-center gap-2 p-4 text-sm ${index + 1 <= step ? "text-primary" : "text-muted-foreground"} ${index ? "border-l border-border" : ""}`}><span className={`grid size-6 place-items-center rounded-full font-mono text-xs ${index + 1 <= step ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{index + 1 < step ? <Checkmark24Regular /> : index + 1}</span><span className="hidden sm:inline">{label}</span></div>)}</div>
    {step === 1 && <Panel title="Describe your request"><div className="grid gap-5 md:grid-cols-2">
      <Field label="Request title" validationMessage={form.formState.errors.title?.message}><Input {...form.register("title")} /></Field>
      <Field label="Category" hint={role === "requester" ? "Internal is fixed for requesters." : undefined} validationMessage={form.formState.errors.category?.message}><Dropdown disabled={role === "requester"} defaultValue={role === "requester" ? "Internal" : "Select category"} onOptionSelect={(_, d) => form.setValue("category", d.optionValue ?? "", { shouldValidate: true })}><Option value="11111111-1111-4111-8111-111111111111">Internal</Option><Option value="22222222-2222-4222-8222-222222222222">Corporate</Option></Dropdown></Field>
      <Field label="Request type" validationMessage={form.formState.errors.type?.message}><Dropdown placeholder="Select type" onOptionSelect={(_, d) => form.setValue("type", d.optionValue ?? "", { shouldValidate: true })}><Option value="33333333-3333-4333-8333-333333333333">Contract review</Option><Option value="44444444-4444-4444-8444-444444444444">Legal advice</Option></Dropdown></Field>
      <div className="md:col-span-2"><Field label="Description" hint={`${description.length}/20 minimum characters`} validationMessage={form.formState.errors.description?.message}><Textarea rows={7} {...form.register("description")} /></Field></div>
    </div></Panel>}
    {step === 2 && <Panel title="Organisation details"><div className="grid gap-5 md:grid-cols-2"><Field label="Entity" hint={role === "requester" ? "From your profile" : undefined}><Input value="Algihaz Holding" readOnly={role === "requester"} /></Field><Field label="Business unit"><Input value="Corporate Services" readOnly={role === "requester"} /></Field><Field label="Department"><Input value="Procurement" readOnly={role === "requester"} /></Field><Field label="Requested completion date"><Input type="date" /></Field></div></Panel>}
    {step === 3 && <Panel title="Review and declare"><div className="space-y-5"><div className="grid gap-4 bg-muted p-4 text-sm md:grid-cols-2"><Summary label="Request" value={form.getValues("title") || "Not provided"} /><Summary label="Organisation" value="Algihaz Holding / Procurement" /><Summary label="Category" value="Internal / Contract review" /><Summary label="Description" value={form.getValues("description") || "Not provided"} /></div><Field validationMessage={form.formState.errors.declaration?.message}><Checkbox label="I confirm this information is accurate and complete." checked={form.watch("declaration")} onChange={(_, d) => form.setValue("declaration", Boolean(d.checked), { shouldValidate: true })} /></Field></div></Panel>}
    <div className="flex justify-between"><Button appearance="secondary" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))}>Back</Button>{step < 3 ? <Button appearance="primary" onClick={() => setStep((value) => Math.min(3, value + 1))}>Continue</Button> : <Button appearance="primary" type="submit">Submit request</Button>}</div>
  </form>;
}

function CaseDetail({ role }: { role: UserRole }) {
  const [tab, setTab] = useState("Overview");
  const [accepted, setAccepted] = useState(false);
  const item = cases[0];
  const tabs = ["Overview", "Documents", "Information Requests", "Communications", "Audit Trail"];
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-2"><StatusBadge status={accepted ? "In Progress" : item.status} /><PriorityBadge priority={item.priority} /><Badge appearance="tint" color="danger">SLA at risk</Badge>{item.escalated && <Badge appearance="tint" color="warning">Escalated: commercial exposure</Badge>}<div className="ml-auto flex gap-2">{role === "legal_rep" && !accepted && <><Button appearance="secondary" onClick={() => toast.error("A rejection reason of at least 3 characters is required.")}>Reject</Button><Button appearance="primary" onClick={() => { setAccepted(true); toast.success("Case accepted"); }}>Accept case</Button></>}{role === "legal_manager" && <Button appearance="primary" onClick={() => toast.success("Assignment panel opened")}>Reassign</Button>}</div></div>
    <Lifecycle active={accepted ? "In Progress" : item.status} />
    <div className="flex gap-1 overflow-x-auto border-b border-border">{tabs.map((name) => <button key={name} onClick={() => setTab(name)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${tab === name ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{name}</button>)}</div>
    {tab === "Overview" && <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]"><Panel title="Case summary"><div className="grid gap-x-8 gap-y-5 md:grid-cols-2"><Summary label="Requester" value="Maha Al-Rashid, Procurement Manager" /><Summary label="Assignee" value={`${item.assignee}, ${item.designation}`} /><Summary label="Entity" value={item.entity} /><Summary label="Department" value={item.department} /><Summary label="Category and type" value={`${item.category} / ${item.type}`} /><Summary label="Target date" value={item.target} /></div><p className="mt-6 text-sm leading-6 text-muted-foreground">Review the proposed fleet supply agreement, with focus on liability allocation, service credits, and early termination rights before commercial signature.</p></Panel><Panel title="Activity"><Timeline /></Panel></div>}
    {tab === "Documents" && <Panel title="Documents" action={role === "viewer" ? undefined : "Upload document"}><DataRows rows={[["Fleet Supply Agreement v3.pdf", "Maha Al-Rashid, Procurement Manager", "26 Sep 2026, 10:42"], ["Commercial evaluation.xlsx", "Ahmed Al-Amri, Sourcing Specialist", "25 Sep 2026, 16:18"]]} /></Panel>}
    {tab === "Information Requests" && <Panel title="Information request rounds" action={role === "legal_rep" ? "Raise request" : undefined}><div className="space-y-4"><RequestRound round="Round 2 - Open" title="Confirm insurance limits" body="Please confirm the agreed third-party liability limit and provide the current certificate." /><RequestRound round="Round 1 - Answered" title="Provide commercial evaluation" body="Response received with the signed evaluation sheet and supplier clarifications." /></div></Panel>}
    {tab === "Communications" && <div className="grid gap-5 xl:grid-cols-2"><Panel title="Requester-visible comments"><DataRows rows={[["Please review the revised liability cap.", "Maha Al-Rashid, Procurement Manager", "26 Sep 2026, 11:05"]]} /></Panel>{role !== "requester" && <Panel title="Internal legal notes"><div className="border-l-4 border-internal bg-internal p-4 text-sm"><strong>Faisal Al-Qahtani, Senior Legal Counsel</strong><p className="mt-2 text-muted-foreground">Supplier position requires manager review before redline is returned.</p></div></Panel>}</div>}
    {tab === "Audit Trail" && <Panel title="Audit trail"><Timeline audit /></Panel>}
  </div>;
}

function Reports() { return <div className="space-y-6"><div className="flex justify-end"><Button appearance="secondary" icon={<ArrowDownload24Regular />} onClick={() => toast.success("Report exported")}>Export CSV</Button></div><div className="grid gap-5 md:grid-cols-2"><ReportPanel title="SLA compliance" value="87.4%" items={["Contract review 91%", "Legal advice 88%", "Claims 72%"]} /><ReportPanel title="Case ageing" value="14 days" items={["0-7 days: 18", "8-30 days: 13", "Over 30 days: 6"]} /><ReportPanel title="Volume by entity" value="124 cases" items={["Algihaz Holding 52", "Algihaz Contracting 43", "Saudi Gulf 29"]} /><ReportPanel title="Representative workload" value="37 open" items={["Faisal Al-Qahtani 14", "Reem Al-Dossary 12", "Lina Al-Zahrani 11"]} /></div></div>; }
function Audit() { return <Panel title="System activity" action="Export CSV"><DataRows rows={[["Case LC-2026-184 reassigned", "Noura Al-Salem, General Counsel", "27 Sep 2026, 09:14"], ["Information request reopened", "Faisal Al-Qahtani, Senior Legal Counsel", "27 Sep 2026, 08:50"], ["Routing rule updated", "Omar Al-Harbi, Systems Administrator", "26 Sep 2026, 17:22"], ["Case LC-2026-171 closed", "Lina Al-Zahrani, Legal Specialist", "26 Sep 2026, 15:06"]]} /></Panel>; }
function Rules({ role }: { role: UserRole }) { return <div className="space-y-5">{role !== "admin" && <div className="flex items-center gap-3 border border-info-border bg-info p-4 text-sm text-info-foreground"><ShieldTask24Regular />Read-only. Contact an administrator to change rules or SLA targets.</div>}<div className="grid gap-5 lg:grid-cols-2"><Panel title="Routing rules" action={role === "admin" ? "Add rule" : undefined}><DataRows rows={[["Contract review", "Procurement", "Commercial Legal Team"], ["Employment", "People & Culture", "Employment Counsel"], ["Claims", "Projects", "Disputes Team"]]} /></Panel><Panel title="SLA targets" action={role === "admin" ? "Edit targets" : undefined}><DataRows rows={[["Contract review", "48 hours", "High priority: 24 hours"], ["Legal advice", "72 hours", "Standard queue"], ["Claims", "24 hours", "Critical: 8 hours"]]} /></Panel></div></div>; }
function Notifications() { const [read, setRead] = useState<string[]>([]); return <Panel title="Recent notifications" action="Mark all read"><div className="divide-y divide-border">{[["n1", "SLA risk on LC-2026-184", "Target date is within 48 hours."], ["n2", "Case rejected by representative", "LC-2026-179 returned to the unassigned queue."], ["n3", "Information received", "Maha Al-Rashid responded to request round 1."], ["n4", "New assignment", "LC-2026-181 is awaiting your acceptance."]].map(([id, title, body]) => <button key={id} onClick={() => setRead((value) => [...value, id])} className={`flex w-full gap-4 p-4 text-left hover:bg-muted ${read.includes(id) ? "opacity-60" : ""}`}><div className="mt-1 grid size-9 place-items-center rounded-md bg-info text-info-foreground"><Alert24Regular /></div><div><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{body}</p><p className="mt-2 font-mono text-xs text-muted-foreground">27 Sep 2026, 09:20</p></div></button>)}</div></Panel>; }
function Users({ role, currentUser }: { role: UserRole; currentUser: string }) { const [inactive, setInactive] = useState<string[]>([]); const rows = [[currentUser, roleLabels[role], "Current user"], ["Hessa Al-Ghamdi", "Requester", "Procurement Specialist"], ["Faisal Al-Qahtani", "Legal Representative", "Senior Legal Counsel"], ["Noura Al-Salem", "Legal Manager", "General Counsel"]].filter(([name], index) => index === 0 || name !== currentUser); return <Panel title="Users" action={role === "admin" ? "Create user" : undefined}><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead><tr className="bg-muted text-left text-xs text-muted-foreground"><th className="p-3">Name</th><th>Role</th><th>Designation</th><th>Status</th><th className="text-right">Action</th></tr></thead><tbody>{rows.map(([name, userRole, designation]) => <tr key={name} className="border-b border-border"><td className="p-3 font-medium">{name}</td><td>{userRole}</td><td>{designation}</td><td><Badge appearance="tint" color={inactive.includes(name) ? "danger" : "success"}>{inactive.includes(name) ? "Inactive" : "Active"}</Badge></td><td className="text-right">{role === "admin" && name !== currentUser && <Button appearance="subtle" onClick={() => setInactive((value) => value.includes(name) ? value.filter((entry) => entry !== name) : [...value, name])}>{inactive.includes(name) ? "Reactivate" : "Deactivate"}</Button>}</td></tr>)}</tbody></table></div></Panel>; }
function MasterData() { return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{["Departments", "Categories & Types", "Entities", "Business Units", "Closure Outcomes", "Routing Rules"].map((title) => <Panel key={title} title={title} action="Manage"><div className="flex items-center gap-3 py-3"><Building24Regular className="text-primary" /><div><p className="font-mono text-2xl font-semibold">{title.length + 3}</p><p className="text-xs text-muted-foreground">active records</p></div></div></Panel>)}</div>; }

function Panel({ title, action, children }: { title: string; action?: string; children: ReactNode }) { return <section className="border border-border bg-card"><div className="flex min-h-14 items-center justify-between border-b border-border px-4"><h2 className="font-display text-lg font-semibold">{title}</h2>{action && <Button appearance="subtle" size="small" onClick={() => toast.success(`${action} selected`)}>{action}</Button>}</div><div className="p-4">{children}</div></section>; }
function CaseTable({ rows, title }: { rows: LegalCase[]; title: string }) { return <Panel title={title}><div className="overflow-x-auto"><table className="w-full min-w-[940px] text-sm"><thead><tr className="bg-muted text-left text-xs text-muted-foreground"><th className="p-3">Case</th><th>Status</th><th>Priority</th><th>Entity / department</th><th>Assignee</th><th>Target</th><th>SLA</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id} className={`border-b border-border transition-colors hover:bg-muted/60 ${item.sla === "Overdue" ? "bg-overdue" : ""}`}><td className="p-3"><Link to="/cases/$caseId" params={{ caseId: item.id }} className="font-medium text-primary hover:underline">{item.id}</Link><p className="mt-1 max-w-xs truncate">{item.title}</p></td><td><StatusBadge status={item.status} /></td><td><PriorityBadge priority={item.priority} /></td><td>{item.entity}<p className="text-xs text-muted-foreground">{item.department}</p></td><td>{item.assignee}<p className="text-xs text-muted-foreground">{item.designation}</p></td><td className="font-mono text-xs">{item.target}</td><td><Badge appearance="tint" color={item.sla === "Overdue" ? "danger" : item.sla === "At risk" ? "warning" : "success"}>{item.sla}</Badge></td></tr>)}</tbody></table></div></Panel>; }
function StatusBadge({ status }: { status: CaseStatus }) { const color = status === "Closed" ? "success" : status === "Waiting on Input" ? "warning" : status === "Submitted" ? "informative" : "brand"; return <Badge appearance="tint" color={color}>{status}</Badge>; }
function PriorityBadge({ priority }: { priority: LegalCase["priority"] }) { return <Badge appearance="outline" color={priority === "Critical" ? "danger" : priority === "High" ? "warning" : "informative"}>{priority}</Badge>; }
function PriorityMark({ priority }: { priority: LegalCase["priority"] }) { return <span className={`h-8 w-1 rounded-full ${priority === "Critical" ? "bg-danger" : priority === "High" ? "bg-warning" : "bg-primary"}`} />; }
function Summary({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>; }
function Lifecycle({ active }: { active: CaseStatus }) { const steps: CaseStatus[] = ["Submitted", "Assigned", "In Progress", "Waiting on Input", "Closed"]; const current = steps.indexOf(active); return <div className="overflow-x-auto border border-border bg-card p-5"><div className="flex min-w-[680px] items-center">{steps.map((step, index) => <div key={step} className="flex flex-1 items-center last:flex-none"><div className="flex flex-col items-center gap-2"><span className={`grid size-8 place-items-center rounded-full border-2 font-mono text-xs ${index <= current ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>{index < current ? <Checkmark24Regular /> : index + 1}</span><span className={`text-xs font-medium ${index === current ? "text-primary" : "text-muted-foreground"}`}>{step}</span></div>{index < steps.length - 1 && <span className={`mb-6 h-0.5 flex-1 ${index < current ? "bg-primary" : "bg-border"}`} />}</div>)}</div></div>; }
function Timeline({ audit = false }: { audit?: boolean }) { const events = audit ? [["Case reassigned to Faisal Al-Qahtani", "Noura Al-Salem, General Counsel", "27 Sep, 09:14"], ["Priority changed to High", "Noura Al-Salem, General Counsel", "26 Sep, 15:32"], ["Request submitted", "Maha Al-Rashid, Procurement Manager", "25 Sep, 11:08"]] : [["Case escalated", "Faisal Al-Qahtani, Senior Legal Counsel", "Today, 09:14"], ["Document uploaded", "Maha Al-Rashid, Procurement Manager", "Yesterday, 16:22"], ["Case accepted", "Faisal Al-Qahtani, Senior Legal Counsel", "25 Sep, 13:40"]]; return <div className="space-y-0">{events.map(([title, actor, time]) => <div key={title} className="relative border-l border-border pb-5 pl-5 last:pb-0"><span className="absolute -left-1 top-1 size-2 rounded-full bg-primary" /><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-muted-foreground">{actor}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{time}</p></div>)}</div>; }
function DataRows({ rows }: { rows: string[][] }) { return <div className="divide-y divide-border">{rows.map((row) => <div key={row.join("-")} className="grid gap-1 py-3 text-sm md:grid-cols-[1.2fr_1fr_1fr]">{row.map((cell, index) => <span key={cell} className={index ? "text-muted-foreground" : "font-medium"}>{cell}</span>)}</div>)}</div>; }
function RequestRound({ round, title, body }: { round: string; title: string; body: string }) { return <div className="border-l-4 border-primary bg-muted p-4"><p className="font-mono text-xs text-primary">{round}</p><h3 className="mt-2 font-medium">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{body}</p></div>; }
function ReportPanel({ title, value, items }: { title: string; value: string; items: string[] }) { return <Panel title={title}><p className="font-mono text-3xl font-semibold text-primary">{value}</p><div className="mt-5 space-y-3">{items.map((item, index) => <div key={item} className="grid grid-cols-[1fr_90px] items-center gap-3 text-sm"><span>{item}</span><span className="h-2 bg-chart-track"><span className="block h-full bg-chart" style={{ width: `${75 - index * 16}%` }} /></span></div>)}</div></Panel>; }
function EmptyState({ title, body }: { title: string; body: string }) { return <div className="grid min-h-80 place-items-center border border-dashed border-border bg-card text-center"><div><DocumentBulletList24Regular className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-3 font-display text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{body}</p></div></div>; }
export function LoadingPage() { return <div className="grid min-h-[100dvh] place-items-center bg-background"><Spinner label="Loading legal workspace" /></div>; }