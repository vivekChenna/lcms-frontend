import { Paperclip, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { fileHint } from "./attachment-rules";

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
};

export function Attachments({ files, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    onChange([...files, ...Array.from(incoming)]);
  };

  const remove = (index: number) => onChange(files.filter((_, i) => i !== index));

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Add attachments"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center text-sm text-muted-foreground hover:bg-muted/50"
      >
        <Paperclip className="size-5" aria-hidden />
        <span>Drag files here, or click to choose (pdf, doc, xls, images, txt — up to 25 MB)</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        aria-label="Choose files"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, i) => {
            const hint = fileHint(file);
            return (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate">{file.name}</p>
                  {hint && <p className="text-xs text-danger">{hint}</p>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 lg:size-9"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => remove(i)}
                >
                  <X />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
