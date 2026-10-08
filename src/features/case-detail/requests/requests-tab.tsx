import { useState } from "react";
import { Download, FileText, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import type { CaseDto, DocumentDto, InfoRequestDto, Profile } from "@/lib/api/types";
import { formatDate, formatDateTime, formatSize } from "@/lib/format";
import { roleLabel } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { downloadDocument, useDocuments } from "../documents/use-documents";
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

/** Files uploaded against this request (usually with the response), each with a download. */
function RequestAttachments({ files }: { files: DocumentDto[] }) {
  if (files.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        Attachments ({files.length})
      </p>
      <ul className="space-y-2">
        {files.map((d) => (
          <li key={d.id} className="flex items-center gap-3 rounded-lg border bg-card p-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
              <FileText className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{d.filename}</span>
              <span className="block text-xs text-muted-foreground">
                {formatSize(d.sizeBytes)} · {d.uploadedByName ?? "—"} ·{" "}
                {formatDateTime(d.createdAt)}
              </span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Download ${d.filename}`}
              onClick={() => void downloadDocument(d.id, d.filename)}
            >
              <Download aria-hidden />
              Download
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RequestCard({
  request,
  attachments,
  me,
  onRespond,
  onReopen,
}: {
  request: InfoRequestDto;
  attachments: DocumentDto[];
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
            Raised by {request.raisedByName ?? "—"} (
            {request.raisedByRole ? roleLabel(request.raisedByRole) : "—"}) —{" "}
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
      <RequestAttachments files={attachments} />

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
  const documents = useDocuments(caseItem.id);
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
          description={
            me.role === "requester"
              ? "When legal needs more information from you, the request appears here."
              : "Requests for more information from the requester appear here."
          }
        />
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              attachments={(documents.data ?? []).filter((d) => d.informationRequestId === r.id)}
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
