import type { ReactNode } from "react";
import { PriorityBadge, SlaBadge, StatusBadge } from "@/components/common/badges";
import type { CaseDto } from "@/lib/api/types";
import { formatDate, formatDateTime, formatMoney, humanAge } from "@/lib/format";
import { nameOf, useClosureOutcomes } from "@/lib/queries/lookups";

function Field({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-medium">{title}</h2>
      <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

export function OverviewTab({ caseItem: c }: { caseItem: CaseDto }) {
  const outcomes = useClosureOutcomes();

  return (
    <div className="space-y-4">
      <Section title="Status">
        <Field label="Status" value={<StatusBadge status={c.status} />} />
        <Field label="Priority" value={<PriorityBadge priority={c.priority} />} />
        <Field label="SLA" value={<SlaBadge state={c.slaState} />} />
        <Field label="Age" value={humanAge(c.caseAgeHours)} />
        <Field label="Acknowledgement due" value={formatDateTime(c.ackDueAt)} />
        <Field label="Resolution due" value={formatDateTime(c.resolutionDueAt)} />
        <Field label="Waiting on" value={c.waitingOnReason} />
        <Field label="Escalation reason" value={c.isEscalated ? c.escalationReason : null} />
      </Section>

      <Section title="Description">
        <div className="sm:col-span-2">
          <p className="whitespace-pre-wrap break-words">{c.description}</p>
        </div>
      </Section>

      <Section title="Classification">
        <Field label="Category" value={c.categoryName} />
        <Field label="Case type" value={c.caseTypeName} />
        <Field label="Department" value={c.departmentName} />
        <Field label="Entity" value={c.entityName} />
        <Field label="Business unit" value={c.businessUnitName} />
      </Section>

      <Section title="People">
        <Field
          label="Requester"
          value={[c.requesterName, c.requesterDesignation].filter(Boolean).join(" — ") || null}
        />
        <Field
          label="Assignee"
          value={
            c.assignedLegalRepName
              ? [c.assignedLegalRepName, c.assignedLegalRepRole].filter(Boolean).join(" — ")
              : null
          }
        />
      </Section>

      {c.status === "Closed" && (
        <Section title="Closure">
          <Field label="Outcome" value={nameOf(outcomes.data, c.closureOutcomeId)} />
          <Field label="Closed at" value={formatDateTime(c.closedAt)} />
          <div className="sm:col-span-2">
            <Field label="Summary" value={c.closureSummary} />
          </div>
        </Section>
      )}

      <Section title="Intake details">
        <Field label="Contact name" value={c.contactName} />
        <Field label="Contact email" value={c.contactEmail} />
        <Field label="Contact phone" value={c.contactPhone} />
        <Field label="Counterparty" value={c.counterparty} />
        <Field
          label="Estimated value"
          value={c.estimatedValue !== null ? formatMoney(c.estimatedValue) : null}
        />
        <Field label="Incident date" value={c.incidentDate ? formatDate(c.incidentDate) : null} />
        <Field
          label="Business deadline"
          value={c.businessDeadline ? formatDate(c.businessDeadline) : null}
        />
        <div className="sm:col-span-2">
          <Field label="Desired outcome" value={c.desiredOutcome} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Third-party details" value={c.thirdPartyDetails} />
        </div>
      </Section>
    </div>
  );
}
