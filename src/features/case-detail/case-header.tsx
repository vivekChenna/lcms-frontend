import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ConfidentialBadge, EscalatedBadge } from "@/components/common/badges";
import type { CaseDto, Profile } from "@/lib/api/types";
import { AcceptRejectActions } from "./actions/accept-reject";
import { AssignDialog } from "./actions/assign";
import { CloseCaseDialog } from "./actions/close";
import { EditCaseDialog } from "./actions/edit-case";
import { EscalateDialog } from "./actions/escalate";
import { PriorityDialog } from "./actions/priority";
import { TargetDatesDialog } from "./actions/target-dates";
import { actionsFor, closeButton } from "./use-case-actions";

type Props = { caseItem: CaseDto; me: Profile };

/** Reference number, title, badges, breadcrumb back to the repository, and every workflow
 * action `me` is allowed to take right now. */
export function CaseHeader({ caseItem, me }: Props) {
  const actions = actionsFor(me, caseItem);
  const close = closeButton(me, caseItem);
  const [assignOpen, setAssignOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="mb-5">
      <Link
        to="/cases"
        className="-my-1 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:min-h-0"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to cases
      </Link>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="break-words text-xl font-semibold tracking-tight md:text-2xl">
              {caseItem.referenceNumber}
            </h1>
            {caseItem.isConfidential && <ConfidentialBadge />}
            {caseItem.isEscalated && <EscalatedBadge />}
          </div>
          <p className="mt-1 break-words text-muted-foreground">{caseItem.title}</p>
        </div>

        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {actions.includes("accept") && <AcceptRejectActions caseId={caseItem.id} />}
          {actions.includes("assign") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 lg:h-9"
              onClick={() => setAssignOpen(true)}
            >
              {caseItem.assignedLegalRepId ? "Reassign" : "Assign"}
            </Button>
          )}
          {actions.includes("escalate") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 lg:h-9"
              onClick={() => setEscalateOpen(true)}
            >
              {caseItem.isEscalated ? "Clear escalation" : "Escalate"}
            </Button>
          )}
          {actions.includes("priority") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 lg:h-9"
              onClick={() => setPriorityOpen(true)}
            >
              Change priority
            </Button>
          )}
          {actions.includes("dates") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 lg:h-9"
              onClick={() => setDatesOpen(true)}
            >
              Change dates
            </Button>
          )}
          {actions.includes("edit") && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 lg:h-9"
              onClick={() => setEditOpen(true)}
            >
              Edit
            </Button>
          )}
          {close.visible && (
            <span title={close.reason} className="inline-flex">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 lg:h-9"
                disabled={!close.enabled}
                onClick={() => setCloseOpen(true)}
              >
                Close case
              </Button>
            </span>
          )}
        </div>
      </div>

      {actions.includes("assign") && (
        <AssignDialog
          caseId={caseItem.id}
          currentRepId={caseItem.assignedLegalRepId}
          open={assignOpen}
          onOpenChange={setAssignOpen}
        />
      )}
      {actions.includes("escalate") && (
        <EscalateDialog
          caseId={caseItem.id}
          isEscalated={caseItem.isEscalated}
          open={escalateOpen}
          onOpenChange={setEscalateOpen}
        />
      )}
      {close.enabled && (
        <CloseCaseDialog caseId={caseItem.id} open={closeOpen} onOpenChange={setCloseOpen} />
      )}
      {actions.includes("dates") && datesOpen && (
        <TargetDatesDialog caseItem={caseItem} open onOpenChange={setDatesOpen} />
      )}
      {actions.includes("priority") && (
        <PriorityDialog
          caseId={caseItem.id}
          current={caseItem.priority}
          open={priorityOpen}
          onOpenChange={setPriorityOpen}
        />
      )}
      {actions.includes("edit") && (
        <EditCaseDialog caseItem={caseItem} open={editOpen} onOpenChange={setEditOpen} />
      )}
    </div>
  );
}
