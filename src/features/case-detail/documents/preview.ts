export type PreviewKind = "pdf" | "image" | "text";

const KINDS: Record<string, PreviewKind> = {
  pdf: "pdf",
  png: "image",
  jpg: "image",
  jpeg: "image",
  txt: "text",
};

/** How a file can be shown in the browser, or null when it can only be downloaded (Word, Excel). */
export function previewKind(filename: string): PreviewKind | null {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return KINDS[extension] ?? null;
}
