import { useRef, useState } from "react";
import { Download, FileText, History, Trash2, Upload as UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveTable, type Column } from "@/components/common/responsive-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import type { DocumentDto, Profile } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import {
  downloadDocument,
  useDeleteDocument,
  useDocuments,
  useUploadNewVersion,
} from "./use-documents";
import { UploadDialog } from "./upload-dialog";
import { VersionsDialog } from "./versions-dialog";

function NewVersionButton({ caseId, documentId }: { caseId: string; documentId: string }) {
  const uploadVersion = useUploadNewVersion(caseId);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        aria-label="New version file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) uploadVersion.mutate({ documentId, file });
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={uploadVersion.isPending}
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon />
        New version
      </Button>
    </>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type RowActionsProps = {
  doc: DocumentDto;
  me: Profile;
  caseId: string;
  onVersions: (doc: DocumentDto) => void;
  onDelete: (doc: DocumentDto) => void;
};

function RowActions({ doc, me, caseId, onVersions, onDelete }: RowActionsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => void downloadDocument(doc.id, doc.filename)}
      >
        <Download />
        Download
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => onVersions(doc)}>
        <History />
        Versions
      </Button>
      <NewVersionButton caseId={caseId} documentId={doc.id} />
      {doc.uploaderId === me.id && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-danger"
          onClick={() => onDelete(doc)}
        >
          <Trash2 />
          Delete
        </Button>
      )}
    </div>
  );
}

export function DocumentsTab({ caseId, me }: { caseId: string; me: Profile }) {
  const { data, isPending, isError, error, refetch } = useDocuments(caseId);
  const deleteDoc = useDeleteDocument(caseId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [versionsFor, setVersionsFor] = useState<DocumentDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentDto | null>(null);

  if (isPending) return null;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const columns: Column<DocumentDto>[] = [
    {
      key: "filename",
      header: "Filename",
      cell: (d) => <span className="break-words">{d.filename}</span>,
    },
    { key: "category", header: "Category", cell: (d) => d.category },
    { key: "version", header: "Version", cell: (d) => d.version },
    { key: "uploadedBy", header: "Uploaded by", cell: (d) => d.uploadedByName ?? "—" },
    { key: "date", header: "Date", cell: (d) => formatDateTime(d.createdAt) },
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
        />
      ),
    },
  ];

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button type="button" size="sm" onClick={() => setUploadOpen(true)}>
          <UploadIcon />
          Upload
        </Button>
      </div>

      {data && data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload evidence, correspondence or other case files."
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
