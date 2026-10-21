import { useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import type { DocumentDto } from "@/lib/api/types";
import { UploadDialog } from "../documents/upload-dialog";
import { useDeleteDocument } from "../documents/use-documents";
import { useClosureOutcomes } from "@/lib/queries/lookups";
import { useCloseCase } from "../use-case-actions";

const MAX_CLOSURE_DOCUMENTS = 5;

type Props = {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Close a case: requires an outcome, a summary, at least one document uploaded right here (any
 * tag, up to 5) and an explicit confirmation checkbox, and then asks once more ("Are you sure?")
 * before anything is sent. This is deliberately self-contained: nothing already on the case's
 * Documents tab is shown or counted here, only what the closer uploads during this close.
 */
export function CloseCaseDialog({ caseId, open, onOpenChange }: Props) {
  const { data: outcomes, isLoading } = useClosureOutcomes();
  const close = useCloseCase(caseId);
  const deleteDoc = useDeleteDocument(caseId);
  const [outcomeId, setOutcomeId] = useState("");
  const [summary, setSummary] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [sure, setSure] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentDto | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<DocumentDto[]>([]);

  const atLimit = uploadedDocs.length >= MAX_CLOSURE_DOCUMENTS;
  const canSubmit =
    !!outcomeId && summary.trim().length > 0 && uploadedDocs.length > 0 && confirmed;

  const confirm = () => {
    if (!canSubmit) return;
    setSure(false);
    close.mutate(
      { confirm: true, closureSummary: summary.trim(), closureOutcomeId: outcomeId },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={close.isPending}
      title="Close this case"
      description="This cannot be undone. Any open information request must be resolved first."
      footer={
        <Button
          type="button"
          className="h-11 lg:h-9"
          disabled={!canSubmit}
          loading={close.isPending}
          loadingText="Closing…"
          onClick={() => setSure(true)}
        >
          Close case
        </Button>
      }
    >
      <Label htmlFor="close-outcome">Outcome</Label>
      <Select value={outcomeId} onValueChange={setOutcomeId} disabled={isLoading}>
        <SelectTrigger id="close-outcome" className="mt-1 h-11 lg:h-9">
          <SelectValue placeholder={isLoading ? "Loading…" : "Select an outcome"} />
        </SelectTrigger>
        <SelectContent>
          {outcomes?.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Label htmlFor="close-summary" className="mt-4 block">
        Summary
      </Label>
      <Textarea
        id="close-summary"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={4}
        className="mt-1"
      />

      <p className="mt-4 text-sm font-medium">Closure documents</p>
      <p className="text-sm text-muted-foreground">
        At least one is required, such as a settlement agreement or a closing memo (up to{" "}
        {MAX_CLOSURE_DOCUMENTS}).
      </p>
      {uploadedDocs.length > 0 && (
        <ul className="mt-2 divide-y rounded-md border">
          {uploadedDocs.map((d) => (
            <li key={d.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{d.filename}</span>
              <Badge variant="outline" className="shrink-0">
                {d.category}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-danger hover:text-danger"
                aria-label={`Delete ${d.filename}`}
                onClick={() => setDeleteTarget(d)}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 h-11 lg:h-8"
        disabled={atLimit}
        onClick={() => setUploadOpen(true)}
      >
        <Upload aria-hidden />
        Upload closure document
      </Button>
      {atLimit && (
        <p className="mt-1 text-xs text-muted-foreground">
          {MAX_CLOSURE_DOCUMENTS} documents uploaded, the most allowed here.
        </p>
      )}

      <div className="mt-4 flex items-start gap-2">
        <Checkbox
          id="close-confirm"
          checked={confirmed}
          onCheckedChange={(v) => setConfirmed(v === true)}
        />
        <Label htmlFor="close-confirm" className="font-normal leading-snug">
          I confirm I want to close this case.
        </Label>
      </div>

      {close.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {close.error.message}
        </p>
      )}

      <UploadDialog
        caseId={caseId}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultCategory="Closure Document"
        maxFiles={MAX_CLOSURE_DOCUMENTS - uploadedDocs.length}
        onUploaded={(docs) => setUploadedDocs((prev) => [...prev, ...docs])}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this document?"
        description={`"${deleteTarget?.filename ?? ""}" will be removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        pending={deleteDoc.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          const target = deleteTarget;
          deleteDoc.mutate(target.id, {
            onSuccess: () => {
              setUploadedDocs((prev) => prev.filter((d) => d.id !== target.id));
              setDeleteTarget(null);
            },
          });
        }}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
      <AlertDialog open={sure} onOpenChange={setSure}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this case for good?</AlertDialogTitle>
            <AlertDialogDescription>
              Once closed, nothing on this case can be changed and it cannot be reopened.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}>Yes, close the case</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ResponsiveDialog>
  );
}
