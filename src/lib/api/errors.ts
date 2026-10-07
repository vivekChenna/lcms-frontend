export type ApiErrorBody = {
  error: { code: string; message: string; details?: Record<string, string> };
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isForbidden() {
    return this.status === 403;
  }
}

export function fieldErrors(err: unknown): Record<string, string> {
  return err instanceof ApiError && err.details ? err.details : {};
}

// fetch() rejects with a TypeError whose message depends on the browser (Chrome, Firefox, Safari).
const NETWORK_MESSAGE = /Failed to fetch|NetworkError|Load failed/i;

/** True for a fetch-level failure (offline, DNS, server unreachable) - never a 4xx/5xx, which
 * always resolves to an ApiError instead. */
export function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError && NETWORK_MESSAGE.test(err.message);
}
