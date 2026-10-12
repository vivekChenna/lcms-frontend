import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PreviewButton } from "../preview-dialog";
import { previewKind } from "../preview";

afterEach(cleanup);

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => vi.unstubAllGlobals());

const renderButton = (filename: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PreviewButton id="d1" filename={filename} />
    </QueryClientProvider>,
  );

describe("previewKind", () => {
  it("previews PDFs, images and text, and nothing else", () => {
    expect(previewKind("contract.PDF")).toBe("pdf");
    expect(previewKind("photo.jpeg")).toBe("image");
    expect(previewKind("scan.png")).toBe("image");
    expect(previewKind("notes.txt")).toBe("text");
    expect(previewKind("memo.docx")).toBeNull();
    expect(previewKind("sheet.xlsx")).toBeNull();
    expect(previewKind("noextension")).toBeNull();
  });
});

describe("PreviewButton", () => {
  it("is not offered for a file the browser cannot show", () => {
    renderButton("memo.docx");
    expect(screen.queryByRole("button", { name: /preview/i })).not.toBeInTheDocument();
  });

  it("opens a PDF in the page, asking the server for it inline", async () => {
    fetchMock.mockResolvedValue(
      new Response("%PDF", { status: 200, headers: { "Content-Type": "application/pdf" } }),
    );
    renderButton("contract.pdf");

    await userEvent.click(screen.getByRole("button", { name: /preview contract\.pdf/i }));

    expect(await screen.findByTitle(/preview of contract\.pdf/i)).toHaveAttribute(
      "src",
      "blob:preview",
    );
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "/documents/d1/download?disposition=inline",
    );
    expect(screen.getByRole("button", { name: /^download$/i })).toBeInTheDocument();
  });

  it("shows an image as an image", async () => {
    fetchMock.mockResolvedValue(
      new Response("img", { status: 200, headers: { "Content-Type": "image/png" } }),
    );
    renderButton("scan.png");

    await userEvent.click(screen.getByRole("button", { name: /preview scan\.png/i }));

    expect(await screen.findByRole("img", { name: "scan.png" })).toHaveAttribute(
      "src",
      "blob:preview",
    );
  });

  it("says so when the file cannot be opened", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 404 }));
    renderButton("contract.pdf");

    await userEvent.click(screen.getByRole("button", { name: /preview contract\.pdf/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/cannot open this file/i);
  });
});
