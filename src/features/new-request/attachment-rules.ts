const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg", "txt"];
const MAX_BYTES = 25 * 1024 * 1024;

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/** Client-side hint only; the backend is authoritative on both checks. */
export function fileHint(file: File): string | undefined {
  if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) {
    return `${file.name}: file type not allowed`;
  }
  if (file.size > MAX_BYTES) {
    return `${file.name}: larger than 25 MB`;
  }
  return undefined;
}
