import { describe as vdescribe, expect, it } from "vitest";
import { describe, type AuditRow } from "../describe";

function row(overrides: Partial<AuditRow> = {}): AuditRow {
  return {
    id: "a1",
    caseId: "c1",
    caseReference: "AGC-INT-000001",
    actorId: "u1",
    actorName: "Rex Rep",
    actorRole: "legal_rep",
    action: "case.submitted",
    beforeValue: null,
    afterValue: null,
    createdAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

vdescribe("describe", () => {
  it("case.submitted", () => {
    expect(describe(row({ action: "case.submitted" }))).toBe("submitted the case");
  });

  it("case.assigned", () => {
    expect(describe(row({ action: "case.assigned" }))).toBe("assigned the case");
  });

  it("case.auto_assigned", () => {
    expect(describe(row({ action: "case.auto_assigned" }))).toBe("the case was auto-assigned");
  });

  it("case.accepted", () => {
    expect(describe(row({ action: "case.accepted" }))).toBe("accepted the case");
  });

  it("case.rejected with a reason", () => {
    expect(
      describe(row({ action: "case.rejected", afterValue: { reason: "Not my department" } })),
    ).toBe('rejected the assignment: "Not my department"');
  });

  it("case.rejected without a reason falls back", () => {
    expect(describe(row({ action: "case.rejected", afterValue: {} }))).toBe(
      "rejected the assignment",
    );
  });

  it("case.waiting_on_input", () => {
    expect(describe(row({ action: "case.waiting_on_input" }))).toBe(
      "marked the case as waiting on input",
    );
  });

  it("case.resumed_in_progress", () => {
    expect(describe(row({ action: "case.resumed_in_progress" }))).toBe("resumed the case");
  });

  it("case.escalated with a reason", () => {
    expect(
      describe(
        row({
          action: "case.escalated",
          beforeValue: { isEscalated: false },
          afterValue: { isEscalated: true, escalationReason: "SLA at risk" },
        }),
      ),
    ).toBe('escalated the case: "SLA at risk"');
  });

  it("case.escalated without a reason falls back", () => {
    expect(describe(row({ action: "case.escalated", afterValue: { isEscalated: true } }))).toBe(
      "escalated the case",
    );
  });

  it("case.escalation_cleared", () => {
    expect(describe(row({ action: "case.escalation_cleared" }))).toBe("cleared the escalation");
  });

  it("case.closed", () => {
    expect(describe(row({ action: "case.closed" }))).toBe("closed the case");
  });

  it("case.updated", () => {
    expect(describe(row({ action: "case.updated" }))).toBe("updated the case details");
  });

  it("case.priority_changed with a value", () => {
    expect(describe(row({ action: "case.priority_changed", afterValue: { priority: "P1" } }))).toBe(
      "changed the priority to P1",
    );
  });

  it("case.priority_changed without a value falls back", () => {
    expect(describe(row({ action: "case.priority_changed", afterValue: {} }))).toBe(
      "changed the priority",
    );
  });

  it("comment.created public", () => {
    expect(describe(row({ action: "comment.created", afterValue: { isInternal: false } }))).toBe(
      "posted a comment",
    );
  });

  it("comment.created internal", () => {
    expect(describe(row({ action: "comment.created", afterValue: { isInternal: true } }))).toBe(
      "posted an internal note",
    );
  });

  it("comment.edited", () => {
    expect(describe(row({ action: "comment.edited" }))).toBe("edited a comment");
  });

  it("comment.deleted", () => {
    expect(describe(row({ action: "comment.deleted" }))).toBe("deleted a comment");
  });

  it("info_request.raised with a subject", () => {
    expect(
      describe(row({ action: "info_request.raised", afterValue: { subject: "Need the NDA" } })),
    ).toBe('raised an information request: "Need the NDA"');
  });

  it("info_request.answered", () => {
    expect(describe(row({ action: "info_request.answered" }))).toBe(
      "answered an information request",
    );
  });

  it("info_request.reopened", () => {
    expect(describe(row({ action: "info_request.reopened" }))).toBe(
      "reopened an information request",
    );
  });

  it("document.uploaded with a filename", () => {
    expect(
      describe(row({ action: "document.uploaded", afterValue: { filename: "contract.pdf" } })),
    ).toBe('uploaded "contract.pdf"');
  });

  it("document.version_uploaded with a filename", () => {
    expect(
      describe(
        row({ action: "document.version_uploaded", afterValue: { filename: "contract.pdf" } }),
      ),
    ).toBe('uploaded a new version of "contract.pdf"');
  });

  it("document.deleted with a filename", () => {
    expect(
      describe(row({ action: "document.deleted", beforeValue: { filename: "contract.pdf" } })),
    ).toBe('deleted "contract.pdf"');
  });

  it("falls back to the raw action string for an unknown action", () => {
    expect(describe(row({ action: "weird.action" }))).toBe("weird.action");
  });
});
