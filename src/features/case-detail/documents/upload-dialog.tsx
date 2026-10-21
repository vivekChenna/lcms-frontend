import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { SelectedFiles } from "@/components/common/selected-files";
import { ApiError } from "@/lib/api/errors";
import type { DocumentDto } from "@/lib/api/types";
import { DOCUMENT_CATEGORIES, useUploadDocument } from "./use-documents";

type Category = (typeof DOCUMENT_CATEGORIES)[number];
type Staged = { id: string; file: File; error?: string };

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg", "txt"];

export function fileHint(file: File): string | undefined {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return `.${extension ?? "?"} files are not allowed`;
  }
  if (file.size > MAX_BYTES) return "File is larger than the 25 MB limit";
  return undefined;
}

type Props = {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The category the picker starts on (the close dialog starts it on "Closure Document"). */
  defaultCategory?: Category;
  /** Caps how many files may be staged in this dialog at once (the close dialog passes however
   * many of its own 5-document limit are left); picking past it is refused with a toast. Unset
   * means no limit. */
  maxFiles?: number;
  /** Called once per file that finishes uploading, with the documents the server created. */
  onUploaded?: (docs: DocumentDto[]) => void;
};

/**
 * Choose or drop files, check them in the list, then press Upload. Nothing is sent before that.
 * Files upload one by one; the ones that go through leave the list, a rejected one stays with its
 * reason so it can be removed or retried without redoing the rest.
 */
export function UploadDialog({
  caseId,
  open,
  onOpenChange,
  defaultCategory = "Other",
  maxFiles,
  onUploaded,
}: Props) {
  const upload = useUploadDocument(caseId);
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [staged, setStaged] = useState<Staged[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList | File[]) => {
    const picked = Array.from(fileList);
    if (maxFiles !== undefined && staged.length + picked.length > maxFiles) {
      toast.error(`You can upload at most ${maxFiles} documents at a time.`);
      return;
    }
    setStaged((prev) => [
      ...prev,
      ...picked.map((file) => {
        const error = fileHint(file);
        return { id: crypto.randomUUID(), file, ...(error ? { error } : {}) };
      }),
    ]);
  };

  // a file already rejected by the server is offered again too: the person may have fixed the cause
  const sendable = staged.filter((s) => !fileHint(s.file));

  const close = () => {
    setStaged([]);
    onOpenChange(false);
  };

  const submit = async () => {
    setUploading(true);
    const uploaded: DocumentDto[] = [];
    for (const item of sendable) {
      try {
        const doc = await upload.mutateAsync({ file: item.file, category });
        uploaded.push(doc);
        setStaged((prev) => prev.filter((s) => s.id !== item.id));
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Upload failed";
        setStaged((prev) => prev.map((s) => (s.id === item.id ? { ...s, error: message } : s)));
      }
    }
    setUploading(false);
    if (uploaded.length > 0) {
      toast.success(
        uploaded.length === 1 ? "Document uploaded" : `${uploaded.length} documents uploaded`,
      );
      onUploaded?.(uploaded);
    }
    // everything went through: nothing left to look at
    if (uploaded.length === staged.length) close();
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={close}
      pending={uploading}
      title="Upload documents"
      footer={
        <>
          <Button type="button" variant="outline" disabled={uploading} onClick={close}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={uploading || sendable.length === 0}
            onClick={() => void submit()}
          >
            {uploading && <Loader2 className="animate-spin" aria-hidden />}
            {uploading
              ? "Uploading…"
              : sendable.length > 1
                ? `Upload ${sendable.length} files`
                : "Upload"}
          </Button>
        </>
      }
    >
      <Label htmlFor="upload-category">Category</Label>
      <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
        <SelectTrigger id="upload-category" className="mt-1 h-11 lg:h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DOCUMENT_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div
        className="mt-4 flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
        }}
      >
        <Upload className="size-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Drag files here, or choose files (PDF, Word, Excel, image or text, up to 25 MB).
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          aria-label="Choose files"
          onChange={(e) => {
            // copy before resetting the input: clearing it empties its file list
            const picked = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (picked.length > 0) addFiles(picked);
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Choose files
        </Button>
      </div>

      <SelectedFiles
        files={staged.map((s) => s.file)}
        errors={staged.map((s) => s.error)}
        disabled={uploading}
        onRemove={(i) => setStaged((prev) => prev.filter((_, idx) => idx !== i))}
      />
    </ResponsiveDialog>
  );
}
