import { useState } from "react";
import { FileText, Upload } from "lucide-react";
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
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { UploadDialog } from "../documents/upload-dialog";
import { useDocuments } from "../documents/use-documents";
import { useClosureOutcomes } from "@/lib/queries/lookups";
import { useCloseCase } from "../use-case-actions";

type Props = {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Close a case: requires an outcome, a summary, at least one closure document and an explicit
 * confirmation checkbox, and then asks once more ("Are you sure?") before anything is sent.
 * A 409 (e.g. an open information request) shows the backend's message inline and leaves the
 * dialog open, rather than closing it as if the request had succeeded.
 */
export function CloseCaseDialog({ caseId, open, onOpenChange }: Props) {
  const { data: outcomes, isLoading } = useClosureOutcomes();
  const close = useCloseCase(caseId);
  const [outcomeId, setOutcomeId] = useState("");
  const [summary, setSummary] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [sure, setSure] = useState(false);
  const documents = useDocuments(caseId);
  const closureDocuments = (documents.data ?? []).filter((d) => d.category === "Closure Document");

  const canSubmit =
    !!outcomeId && summary.trim().length > 0 && closureDocuments.length > 0 && confirmed;

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
        At least one is required, such as a settlement agreement or a closing memo.
      </p>
      {closureDocuments.length > 0 && (
        <ul className="mt-2 space-y-1">
          {closureDocuments.map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-sm">
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 truncate">{d.filename}</span>
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 h-11 lg:h-8"
        onClick={() => setUploadOpen(true)}
      >
        <Upload aria-hidden />
        Upload closure document
      </Button>

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
