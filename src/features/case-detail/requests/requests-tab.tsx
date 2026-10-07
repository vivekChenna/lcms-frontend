import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import type { CaseDto, InfoRequestDto, Profile } from "@/lib/api/types";
import { formatDate, formatDateTime } from "@/lib/format";
import { can } from "@/lib/permissions";
import { RaiseDialog } from "./raise-dialog";
import { RespondDialog } from "./respond-dialog";
import { useInfoRequests, useReopenInfoRequest } from "./use-info-requests";

const STATUS_LABEL: Record<InfoRequestDto["status"], string> = {
  open: "Open",
  answered: "Answered",
  superseded: "Superseded",
};

function ReopenDialog({
  request,
  open,
  onOpenChange,
}: {
  request: InfoRequestDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reopen = useReopenInfoRequest(request.caseId);
  const [comment, setComment] = useState("");
  const [touched, setTouched] = useState(false);
  const invalid = comment.trim().length === 0;

  const confirm = () => {
    setTouched(true);
    if (invalid) return;
    reopen.mutate(
      { requestId: request.id, comment: comment.trim() },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={reopen.isPending}
      title="Reopen this request"
      footer={
        <Button type="button" className="h-11 lg:h-9" disabled={reopen.isPending} onClick={confirm}>
          Reopen
        </Button>
      }
    >
      <Label htmlFor="reopen-comment">Why does this need to reopen?</Label>
      <Textarea
        id="reopen-comment"
        className="mt-1"
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {touched && invalid && (
        <p role="alert" className="mt-1 text-sm text-danger">
          A comment is required.
        </p>
      )}
      {reopen.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {reopen.error.message}
        </p>
      )}
    </ResponsiveDialog>
  );
}

function RequestCard({
  request,
  me,
  onRespond,
  onReopen,
}: {
  request: InfoRequestDto;
  me: Profile;
  onRespond: () => void;
  onReopen: () => void;
}) {
  const canRespond = me.id === request.responderId && request.status === "open";
  const canReopen = me.id === request.raisedById && request.status === "answered";

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{request.subject}</p>
          <p className="text-sm text-muted-foreground">
            Raised by {request.raisedByName ?? "—"} ({request.raisedByRole ?? "—"}) —{" "}
            {formatDateTime(request.createdAt)}
          </p>
        </div>
        <Badge variant="outline">{STATUS_LABEL[request.status]}</Badge>
      </div>

      <p className="mt-3 whitespace-pre-wrap">{request.requirementDescription}</p>
      {request.dueDate && (
        <p className="mt-1 text-sm text-muted-foreground">Due {formatDate(request.dueDate)}</p>
      )}

      {request.responseText && (
        <div className="mt-3 rounded-md bg-muted p-3">
          <p className="text-xs text-muted-foreground">
            Response from {request.responderName ?? "—"}
          </p>
          <p className="mt-1 whitespace-pre-wrap">{request.responseText}</p>
        </div>
      )}

      {(canRespond || canReopen) && (
        <div className="mt-3 flex gap-2">
          {canRespond && (
            <Button type="button" size="sm" onClick={onRespond}>
              Respond
            </Button>
          )}
          {canReopen && (
            <Button type="button" variant="outline" size="sm" onClick={onReopen}>
              Reopen
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function RequestsTab({ caseItem, me }: { caseItem: CaseDto; me: Profile }) {
  const { data, isPending, isError, error, refetch } = useInfoRequests(caseItem.id);
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [respondTarget, setRespondTarget] = useState<InfoRequestDto | null>(null);
  const [reopenTarget, setReopenTarget] = useState<InfoRequestDto | null>(null);

  const canRaise =
    can.raiseInfoRequest(me.role) &&
    caseItem.assignedLegalRepId === me.id &&
    (caseItem.status === "In Progress" || caseItem.status === "Waiting on Input");

  if (isPending) return null;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div>
      {canRaise && (
        <div className="mb-3 flex justify-end">
          <Button type="button" size="sm" onClick={() => setRaiseOpen(true)}>
            Raise request
          </Button>
        </div>
      )}

      {data.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No information requests"
          description="Requests for more information from the requester appear here."
        />
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              me={me}
              onRespond={() => setRespondTarget(r)}
              onReopen={() => setReopenTarget(r)}
            />
          ))}
        </div>
      )}

      <RaiseDialog caseItem={caseItem} open={raiseOpen} onOpenChange={setRaiseOpen} />
      {respondTarget && (
        <RespondDialog
          request={respondTarget}
          open={!!respondTarget}
          onOpenChange={(open) => !open && setRespondTarget(null)}
        />
      )}
      {reopenTarget && (
        <ReopenDialog
          request={reopenTarget}
          open={!!reopenTarget}
          onOpenChange={(open) => !open && setReopenTarget(null)}
        />
      )}
    </div>
  );
}
