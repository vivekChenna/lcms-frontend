import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SelectedFiles } from "../selected-files";

afterEach(cleanup);

describe("SelectedFiles", () => {
  it("shows nothing when no file is chosen", () => {
    const { container } = render(<SelectedFiles files={[]} onRemove={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows each chosen file with its size, a thumbnail only for images", () => {
    const pdf = new File(["x".repeat(2048)], "contract.pdf", { type: "application/pdf" });
    const photo = new File(["x"], "scan.png", { type: "image/png" });
    const { container } = render(<SelectedFiles files={[pdf, photo]} onRemove={() => {}} />);
    expect(screen.getByText("contract.pdf")).toBeInTheDocument();
    expect(screen.getByText("2.0 KB")).toBeInTheDocument();
    expect(screen.getByText("scan.png")).toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });

  it("removes the file whose button was pressed", async () => {
    const onRemove = vi.fn();
    const a = new File(["a"], "a.txt", { type: "text/plain" });
    const b = new File(["b"], "b.txt", { type: "text/plain" });
    render(<SelectedFiles files={[a, b]} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove b.txt" }));
    expect(onRemove).toHaveBeenCalledWith(1);
  });
});
