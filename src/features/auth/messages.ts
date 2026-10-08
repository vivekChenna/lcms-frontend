import { ApiError } from "@/lib/api/errors";

/** What to tell a person when a public account request fails. */
export function authErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.status === 429 ? "Too many attempts, try again shortly" : err.message;
  }
  return "Could not reach the server. Check your connection and try again.";
}
