import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { formatDateTime } from "@/lib/format";
import { downloadDocument, useDocumentVersions } from "./use-documents";

type Props = {
  documentId: string;
  filename: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Every version of a document (including the current one), each independently downloadable. */
export function VersionsDialog({ documentId, filename, open, onOpenChange }: Props) {
  const { data, isPending } = useDocumentVersions(documentId, open);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Document versions">
      {isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
      {data && (
        <ul className="space-y-3">
          {data.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">Version {v.version}</p>
                <p className="text-sm text-muted-foreground">
                  {v.uploadedByName ?? "—"} — {formatDateTime(v.createdAt)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void downloadDocument(v.id, v.filename || filename)}
              >
                <Download />
                Download
              </Button>
            </li>
          ))}
        </ul>
      )}
    </ResponsiveDialog>
  );
}
