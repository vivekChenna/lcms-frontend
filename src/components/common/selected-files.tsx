import { FileText, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { formatSize } from "@/lib/format";

/**
 * Files chosen for upload but not sent yet: a thumbnail for images, an icon otherwise, with name,
 * size and a remove button, so people can check what they are about to send.
 */
export function SelectedFiles({
  files,
  errors,
  disabled,
  onRemove,
}: {
  files: File[];
  /** Why a file cannot be sent, by position; shown under its name. */
  errors?: (string | undefined)[];
  /** True while sending: files can no longer be removed. */
  disabled?: boolean;
  onRemove: (index: number) => void;
}) {
  const previews = useMemo(
    () => files.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : null)),
    [files],
  );
  useEffect(() => () => previews.forEach((url) => url && URL.revokeObjectURL(url)), [previews]);

  if (files.length === 0) return null;

  return (
    <ul aria-label="Files to send" className="mt-3 space-y-2">
      {files.map((f, i) => (
        <li
          key={`${f.name}-${i}`}
          className="flex items-center gap-3 rounded-lg border bg-muted/40 p-2"
        >
          {previews[i] ? (
            <img src={previews[i]} alt="" className="size-10 shrink-0 rounded-md object-cover" />
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
              <FileText className="size-5" aria-hidden />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{f.name}</span>
            {errors?.[i] ? (
              <span role="alert" className="block text-xs text-danger">
                {errors[i]}
              </span>
            ) : (
              <span className="block text-xs text-muted-foreground">{formatSize(f.size)}</span>
            )}
          </span>
          <button
            type="button"
            aria-label={`Remove ${f.name}`}
            disabled={disabled}
            className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onRemove(i)}
          >
            <X className="size-4" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
