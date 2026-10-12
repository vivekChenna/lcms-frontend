import { useEffect, useState } from "react";
import { Download, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api/client";
import { downloadDocument } from "./use-documents";
import { previewKind } from "./preview";

type Props = { id: string; filename: string; open: boolean; onOpenChange: (open: boolean) => void };

type State =
  { status: "loading" } | { status: "ready"; url: string } | { status: "error"; message: string };

/**
 * Shows a document in the page instead of downloading it. The file is fetched with the signed-in
 * session (a plain link would not carry it), turned into a temporary local URL, and shown as a PDF,
 * an image or plain text. The URL is released when the dialog closes.
 */
function PreviewDialog({ id, filename, open, onOpenChange }: Props) {
  const kind = previewKind(filename);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!open) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    setState({ status: "loading" });
    void (async () => {
      try {
        const res = await apiFetch(`/documents/${id}/download?disposition=inline`);
        if (!res.ok) {
          throw new Error(
            res.status === 404 || res.status === 403
              ? "You cannot open this file."
              : "The file could not be loaded.",
          );
        }
        objectUrl = URL.createObjectURL(await res.blob());
        if (!cancelled) setState({ status: "ready", url: objectUrl });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "The file could not be loaded.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] w-[95vw] max-w-5xl flex-col gap-3">
        <DialogHeader className="pr-8">
          <DialogTitle className="truncate">{filename}</DialogTitle>
          <DialogDescription className="sr-only">Preview of {filename}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-muted/30">
          {state.status === "loading" && (
            <div
              role="status"
              className="grid h-full place-items-center text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading preview…
              </span>
            </div>
          )}
          {state.status === "error" && (
            <p role="alert" className="grid h-full place-items-center p-4 text-sm text-danger">
              {state.message}
            </p>
          )}
          {state.status === "ready" && kind === "image" && (
            <img src={state.url} alt={filename} className="size-full object-contain" />
          )}
          {state.status === "ready" && kind !== "image" && (
            <iframe
              title={`Preview of ${filename}`}
              src={state.url}
              className="size-full bg-white"
            />
          )}
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void downloadDocument(id, filename)}
          >
            <Download aria-hidden />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** A "Preview" button that opens the file in the page; renders nothing for files that cannot be previewed. */
export function PreviewButton({ id, filename }: { id: string; filename: string }) {
  const [open, setOpen] = useState(false);
  if (!previewKind(filename)) return null;
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`Preview ${filename}`}
        onClick={() => setOpen(true)}
      >
        <Eye aria-hidden />
        Preview
      </Button>
      {open && <PreviewDialog id={id} filename={filename} open onOpenChange={setOpen} />}
    </>
  );
}
