import { useRef, useState } from "react";
import { ListSkeleton } from "@/components/common/skeletons";
import {
  Download,
  FileText,
  History,
  MoreHorizontal,
  Trash2,
  Upload as UploadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResponsiveTable, type Column } from "@/components/common/responsive-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import type { DocumentDto, Profile } from "@/lib/api/types";
import { formatDateTime, formatSize } from "@/lib/format";
import {
  downloadDocument,
  useDeleteDocument,
  useDocuments,
  useUploadNewVersion,
} from "./use-documents";
import { UploadDialog } from "./upload-dialog";
import { VersionsDialog } from "./versions-dialog";

type RowActionsProps = {
  doc: DocumentDto;
  me: Profile;
  caseId: string;
  onVersions: (doc: DocumentDto) => void;
  onDelete: (doc: DocumentDto) => void;
  /** False when the case is closed, or is another representative's: the server would refuse. */
  canWrite: boolean;
};

function RowActions({ doc, me, caseId, onVersions, onDelete, canWrite }: RowActionsProps) {
  const uploadVersion = useUploadNewVersion(caseId);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-1">
      {/* outside the menu: the menu content unmounts on close, which would drop the file picker */}
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        aria-label="New version file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) uploadVersion.mutate({ documentId: doc.id, file });
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void downloadDocument(doc.id, doc.filename)}
      >
        <Download />
        Download
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 lg:size-9"
            aria-label={`More actions for ${doc.filename}`}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => onVersions(doc)}>
            <History aria-hidden /> Versions
          </DropdownMenuItem>
          {canWrite && (
            <DropdownMenuItem
              disabled={uploadVersion.isPending}
              onSelect={() => inputRef.current?.click()}
            >
              <UploadIcon aria-hidden /> New version
            </DropdownMenuItem>
          )}
          {canWrite && doc.uploaderId === me.id && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-danger focus:text-danger"
                onSelect={() => onDelete(doc)}
              >
                <Trash2 aria-hidden /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function DocumentsTab({
  caseId,
  me,
  canWrite = true,
}: {
  caseId: string;
  me: Profile;
  /** Whether this person may add to the case (see canWriteToCase); hides Upload, New version, Delete. */
  canWrite?: boolean;
}) {
  const { data, isPending, isError, error, refetch } = useDocuments(caseId);
  const deleteDoc = useDeleteDocument(caseId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [versionsFor, setVersionsFor] = useState<DocumentDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentDto | null>(null);

  if (isPending) {
    return (
      <div role="status" aria-label="Loading documents">
        <ListSkeleton columns={4} rows={3} />
      </div>
    );
  }
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  // Four columns so the table fits without sideways scrolling: the name carries its category and
  // version, and the uploader carries the date.
  const columns: Column<DocumentDto>[] = [
    {
      key: "filename",
      header: "Document",
      className: "min-w-56 whitespace-normal",
      cell: (d) => (
        <div className="min-w-0">
          <p className="break-words font-medium">{d.filename}</p>
          <p className="text-xs text-muted-foreground">
            {d.category} · version {d.version}
          </p>
        </div>
      ),
    },
    {
      key: "uploadedBy",
      header: "Uploaded by",
      cell: (d) => (
        <div>
          <p>{d.uploadedByName ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(d.createdAt)}</p>
        </div>
      ),
    },
    { key: "size", header: "Size", cell: (d) => formatSize(d.sizeBytes) },
    {
      key: "actions",
      header: "",
      cell: (d) => (
        <RowActions
          doc={d}
          me={me}
          caseId={caseId}
          onVersions={setVersionsFor}
          onDelete={setDeleteTarget}
          canWrite={canWrite}
        />
      ),
    },
  ];

  return (
    <div>
      {!canWrite && data && data.length > 0 && (
        <p role="note" className="mb-3 text-sm text-muted-foreground">
          You can view and download these files, but you don't have permission to add to them.
        </p>
      )}
      {canWrite && (
        <div className="mb-3 flex justify-end">
          <Button type="button" size="sm" onClick={() => setUploadOpen(true)}>
            <UploadIcon />
            Upload
          </Button>
        </div>
      )}

      {data && data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description={
            canWrite
              ? "Upload evidence, correspondence or other case files."
              : "You don't have permission to upload files to this case."
          }
        />
      ) : (
        <ResponsiveTable
          columns={columns}
          rows={data ?? []}
          rowKey={(d) => d.id}
          renderCard={(d) => (
            <div className="space-y-2">
              <p className="break-words font-medium">{d.filename}</p>
              <p className="text-sm text-muted-foreground">
                {d.category} — v{d.version} — {formatSize(d.sizeBytes)}
              </p>
              <p className="text-sm text-muted-foreground">
                {d.uploadedByName ?? "—"} — {formatDateTime(d.createdAt)}
              </p>
              <RowActions
                doc={d}
                me={me}
                caseId={caseId}
                onVersions={setVersionsFor}
                onDelete={setDeleteTarget}
                canWrite={canWrite}
              />
            </div>
          )}
        />
      )}

      <UploadDialog caseId={caseId} open={uploadOpen} onOpenChange={setUploadOpen} />
      {versionsFor && (
        <VersionsDialog
          documentId={versionsFor.id}
          filename={versionsFor.filename}
          open={!!versionsFor}
          onOpenChange={(open) => !open && setVersionsFor(null)}
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this document?"
        description={`"${deleteTarget?.filename ?? ""}" will be removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        pending={deleteDoc.isPending}
        onConfirm={() => {
          if (deleteTarget)
            deleteDoc.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </div>
  );
}
