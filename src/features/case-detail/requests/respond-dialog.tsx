import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import type { InfoRequestDto } from "@/lib/api/types";
import { useRespondInfoRequest } from "./use-info-requests";

type Props = { request: InfoRequestDto; open: boolean; onOpenChange: (open: boolean) => void };

export function RespondDialog({ request, open, onOpenChange }: Props) {
  const respond = useRespondInfoRequest(request.caseId);
  const [responseText, setResponseText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const invalid = responseText.trim().length === 0;

  const confirm = () => {
    setTouched(true);
    if (invalid) return;
    respond.mutate(
      { requestId: request.id, responseText: responseText.trim(), files },
      {
        onSuccess: () => {
          setResponseText("");
          setFiles([]);
          setTouched(false);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={respond.isPending}
      title="Respond"
      description={request.subject}
      footer={
        <Button
          type="button"
          className="h-11 lg:h-9"
          disabled={respond.isPending}
          onClick={confirm}
        >
          Send response
        </Button>
      }
    >
      <p className="mb-3 whitespace-pre-wrap text-sm text-muted-foreground">
        {request.requirementDescription}
      </p>

      <Label htmlFor="respond-text">Your response</Label>
      <Textarea
        id="respond-text"
        className="mt-1"
        rows={4}
        value={responseText}
        onChange={(e) => setResponseText(e.target.value)}
      />
      {touched && invalid && (
        <p role="alert" className="mt-1 text-sm text-danger">
          A response is required.
        </p>
      )}

      <div className="mt-4">
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          aria-label="Attach files"
          onChange={(e) => {
            if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Attach files
        </Button>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between text-sm">
                <span className="min-w-0 truncate">{f.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {respond.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {respond.error.message}
        </p>
      )}
    </ResponsiveDialog>
  );
}
