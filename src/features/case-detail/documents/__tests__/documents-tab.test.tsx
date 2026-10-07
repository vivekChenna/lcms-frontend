import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeProfile } from "@/test/render";
import { DocumentsTab } from "../documents-tab";

afterEach(cleanup);

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let clickSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  clickSpy.mockRestore();
});

function docRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "doc-1",
    caseId: "c1",
    informationRequestId: null,
    filename: "contract.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2048,
    category: "Contract",
    version: 1,
    rootDocumentId: "doc-1",
    previousVersionId: null,
    uploaderId: "me-1",
    uploadedByName: "Vivek Requester",
    createdAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderTab(docs: unknown[] = [docRow()]) {
  fetchMock.mockImplementation(async (url: string) => {
    if (url.endsWith("/cases/c1/documents")) return json(docs);
    return json({});
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <DocumentsTab caseId="c1" me={makeProfile({ id: "me-1" })} />
    </QueryClientProvider>,
  );
}

const calls = () => fetchMock.mock.calls;
const urls = () => calls().map((c) => String(c[0]));

describe("DocumentsTab", () => {
  it("uploads a file as multipart FormData with no manual Content-Type", async () => {
    renderTab([]);
    await screen.findByText(/no documents yet/i);

    await userEvent.click(screen.getByRole("button", { name: /^upload$/i }));
    const file = new File(["hello"], "note.txt", { type: "text/plain" });
    await userEvent.upload(screen.getByLabelText(/choose files/i), file);

    await waitFor(() =>
      expect(urls().some((u) => u.includes("/cases/c1/documents?category="))).toBe(true),
    );
    const uploadCall = calls().find((c) => String(c[0]).includes("/cases/c1/documents?category="));
    const init = uploadCall?.[1] as RequestInit;
    expect(init.body).toBeInstanceOf(FormData);
    const headers = new Headers(init.headers);
    expect(headers.has("Content-Type")).toBe(false);
  });

  it("a rejected file shows the backend message on that file only, while others complete", async () => {
    renderTab([]);
    await screen.findByText(/no documents yet/i);
    await userEvent.click(screen.getByRole("button", { name: /^upload$/i }));

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes("/cases/c1/documents?category=")) {
        const form = init?.body as FormData;
        const uploaded = form.get("file") as File;
        if (uploaded.name === "bad.txt") {
          return json(
            { error: { code: "VALIDATION", message: "File rejected by the server" } },
            400,
          );
        }
        return json(docRow({ filename: uploaded.name }), 201);
      }
      return json(docs());
      function docs() {
        return [];
      }
    });

    const good = new File(["ok"], "good.txt", { type: "text/plain" });
    const bad = new File(["bad"], "bad.txt", { type: "text/plain" });
    await userEvent.upload(screen.getByLabelText(/choose files/i), [good, bad]);

    expect(await screen.findByText("File rejected by the server")).toBeInTheDocument();
    expect(await screen.findByText("Done")).toBeInTheDocument();
  });

  it("downloads a document by its filename via apiDownload", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/cases/c1/documents")) return json([docRow()]);
      if (url.includes("/documents/doc-1/download")) {
        return new Response("pdf-bytes", {
          status: 200,
          headers: { "Content-Disposition": 'attachment; filename="contract.pdf"' },
        });
      }
      return json({});
    });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <DocumentsTab caseId="c1" me={makeProfile({ id: "me-1" })} />
      </QueryClientProvider>,
    );

    await userEvent.click(await screen.findByRole("button", { name: /^download$/i }));
    await waitFor(() =>
      expect(urls().some((u) => u.includes("/documents/doc-1/download"))).toBe(true),
    );
    expect(clickSpy).toHaveBeenCalled();
  });

  it("asks for confirmation before deleting", async () => {
    renderTab([docRow({ uploaderId: "me-1" })]);
    await userEvent.click(await screen.findByRole("button", { name: /^delete$/i }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/delete this document/i)).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.every((c) => (c[1] as RequestInit | undefined)?.method !== "DELETE"),
    ).toBe(true);

    await userEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }));
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === "DELETE"),
      ).toBe(true),
    );
  });

  it("does not show Delete for a document uploaded by someone else", async () => {
    renderTab([docRow({ uploaderId: "someone-else" })]);
    await screen.findByText("contract.pdf");
    expect(screen.queryByRole("button", { name: /^delete$/i })).not.toBeInTheDocument();
  });
});
