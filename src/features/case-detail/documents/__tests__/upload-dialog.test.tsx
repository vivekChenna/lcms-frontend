import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { UploadDialog } from "../upload-dialog";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(json([]));
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(toast.error).mockClear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderIt(maxFiles?: number) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <UploadDialog
        caseId="c1"
        open
        onOpenChange={vi.fn()}
        {...(maxFiles !== undefined ? { maxFiles } : {})}
      />
    </QueryClientProvider>,
  );
}

function pdf(name: string) {
  return new File(["x"], name, { type: "application/pdf" });
}

async function choose(files: File[]) {
  const input = screen.getByLabelText(/choose files/i);
  await userEvent.upload(input, files);
}

describe("UploadDialog maxFiles", () => {
  it("stages every file when there is no cap", async () => {
    renderIt();
    await choose([
      pdf("a.pdf"),
      pdf("b.pdf"),
      pdf("c.pdf"),
      pdf("d.pdf"),
      pdf("e.pdf"),
      pdf("f.pdf"),
    ]);
    expect(await screen.findByText("a.pdf")).toBeInTheDocument();
    expect(screen.getByText("f.pdf")).toBeInTheDocument();
  });

  it("stages up to the cap", async () => {
    renderIt(5);
    await choose([pdf("a.pdf"), pdf("b.pdf"), pdf("c.pdf"), pdf("d.pdf"), pdf("e.pdf")]);
    expect(await screen.findByText("a.pdf")).toBeInTheDocument();
    expect(screen.getByText("e.pdf")).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("refuses a selection that would go over the cap, with a toast, and stages none of it", async () => {
    renderIt(5);
    await choose([
      pdf("a.pdf"),
      pdf("b.pdf"),
      pdf("c.pdf"),
      pdf("d.pdf"),
      pdf("e.pdf"),
      pdf("f.pdf"),
    ]);
    expect(toast.error).toHaveBeenCalledWith("You can upload at most 5 documents at a time.");
    expect(screen.queryByText("a.pdf")).not.toBeInTheDocument();
    expect(screen.queryByText("f.pdf")).not.toBeInTheDocument();
  });

  it("refuses to add more once already at the cap, across two selections", async () => {
    renderIt(5);
    await choose([pdf("a.pdf"), pdf("b.pdf"), pdf("c.pdf"), pdf("d.pdf"), pdf("e.pdf")]);
    expect(await screen.findByText("e.pdf")).toBeInTheDocument();
    await choose([pdf("f.pdf")]);
    expect(toast.error).toHaveBeenCalledWith("You can upload at most 5 documents at a time.");
    expect(screen.queryByText("f.pdf")).not.toBeInTheDocument();
  });
});
