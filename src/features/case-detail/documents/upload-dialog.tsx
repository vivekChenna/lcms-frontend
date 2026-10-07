import { useRef, useState } from "react";
import { Upload } from "lucide-react";
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
import { ApiError } from "@/lib/api/errors";
import { DOCUMENT_CATEGORIES, useUploadDocument } from "./use-documents";

type Category = (typeof DOCUMENT_CATEGORIES)[number];
type FileState = {
  id: string;
  file: File;
  status: "queued" | "uploading" | "done" | "failed";
  error?: string;
};

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

type Props = { caseId: string; open: boolean; onOpenChange: (open: boolean) => void };

/** Upload one or more documents via a picker or drag-and-drop. Each file uploads independently,
 * so one rejected file never blocks the others; a failed file can be retried on its own. */
export function UploadDialog({ caseId, open, onOpenChange }: Props) {
  const upload = useUploadDocument(caseId);
  const [category, setCategory] = useState<Category>("Other");
  const [items, setItems] = useState<FileState[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const runOne = async (id: string, file: File, cat: Category) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "uploading" } : it)));
    try {
      await upload.mutateAsync({ file, category: cat });
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "done" } : it)));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Upload failed";
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: "failed", error: message } : it)),
      );
    }
  };

  const addFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const next: FileState[] = files.map((file) => {
      const hint = fileHint(file);
      return {
        id: crypto.randomUUID(),
        file,
        status: hint ? "failed" : "queued",
        ...(hint ? { error: hint } : {}),
      };
    });
    setItems((prev) => [...prev, ...next]);
    for (const it of next) {
      if (it.status === "queued") void runOne(it.id, it.file, category);
    }
  };

  const retry = (id: string) => {
    const it = items.find((x) => x.id === id);
    if (it) void runOne(id, it.file, category);
  };

  const close = () => {
    setItems([]);
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={close} title="Upload documents">
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
            if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Choose files
        </Button>
      </div>

      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">{it.file.name}</span>
              {it.status === "done" && <span className="text-success-foreground">Done</span>}
              {it.status === "uploading" && (
                <span className="text-muted-foreground">Uploading…</span>
              )}
              {it.status === "queued" && <span className="text-muted-foreground">Queued</span>}
              {it.status === "failed" && (
                <span className="flex items-center gap-2">
                  <span role="alert" className="text-danger">
                    {it.error}
                  </span>
                  <Button type="button" size="sm" variant="outline" onClick={() => retry(it.id)}>
                    Retry
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </ResponsiveDialog>
  );
}
