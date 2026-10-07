import { describe, expect, it } from "vitest";
import { requestSchema, toCreateBody, type RequestFormValues } from "../schema";

function values(overrides: Partial<RequestFormValues> = {}): RequestFormValues {
  return {
    title: "Vendor dispute",
    description: "A description that is definitely twenty characters or more.",
    categoryId: "cat-1",
    caseTypeId: "type-1",
    departmentId: "dept-1",
    priority: "Medium",
    isConfidential: false,
    entityId: "",
    businessUnitId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    counterparty: "",
    estimatedValue: "",
    incidentDate: "",
    businessDeadline: "",
    desiredOutcome: "",
    thirdPartyDetails: "",
    declarationConfirmed: true,
    ...overrides,
  };
}

describe("toCreateBody", () => {
  it("omits a blank optional field instead of sending an empty string", () => {
    const body = toCreateBody(values({ contactEmail: "  " }), "requester");
    expect(body).not.toHaveProperty("contactEmail");
  });

  it("parses a comma-formatted estimated value into a number", () => {
    const body = toCreateBody(values({ estimatedValue: "1,200.50" }), "requester");
    expect(body.estimatedValue).toBe(1200.5);
  });

  it("omits estimatedValue when left blank", () => {
    const body = toCreateBody(values({ estimatedValue: "" }), "requester");
    expect(body).not.toHaveProperty("estimatedValue");
  });

  it("never includes entityId/businessUnitId for a requester", () => {
    const body = toCreateBody(values({ entityId: "e1", businessUnitId: "b1" }), "requester");
    expect(body).not.toHaveProperty("entityId");
    expect(body).not.toHaveProperty("businessUnitId");
  });

  it("includes entityId/businessUnitId for an admin", () => {
    const body = toCreateBody(values({ entityId: "e1", businessUnitId: "b1" }), "admin");
    expect(body.entityId).toBe("e1");
    expect(body.businessUnitId).toBe("b1");
  });

  it("maps the UI priority label to the backend code", () => {
    expect(toCreateBody(values({ priority: "Critical" }), "requester").priority).toBe("P1");
    expect(toCreateBody(values({ priority: "Low" }), "requester").priority).toBe("P4");
  });

  it("always sends declarationConfirmed true and trims strings", () => {
    const body = toCreateBody(values({ contactName: "  Jane  " }), "requester");
    expect(body.declarationConfirmed).toBe(true);
    expect(body.contactName).toBe("Jane");
  });
});

describe("requestSchema", () => {
  it("rejects a description under 20 characters", () => {
    const result = requestSchema.safeParse(values({ description: "too short" }));
    expect(result.success).toBe(false);
  });

  it("rejects when the declaration is unchecked", () => {
    const result = requestSchema.safeParse(values({ declarationConfirmed: false }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid contact email", () => {
    const result = requestSchema.safeParse(values({ contactEmail: "not-an-email" }));
    expect(result.success).toBe(false);
  });

  it("accepts a blank contact email", () => {
    const result = requestSchema.safeParse(values({ contactEmail: "" }));
    expect(result.success).toBe(true);
  });

  it("rejects an estimated value above the backend's limit", () => {
    const result = requestSchema.safeParse(values({ estimatedValue: "9999999999999" }));
    expect(result.success).toBe(false);
  });

  it("rejects a missing title, category, case type or department", () => {
    expect(requestSchema.safeParse(values({ title: "" })).success).toBe(false);
    expect(requestSchema.safeParse(values({ categoryId: "" })).success).toBe(false);
    expect(requestSchema.safeParse(values({ caseTypeId: "" })).success).toBe(false);
    expect(requestSchema.safeParse(values({ departmentId: "" })).success).toBe(false);
  });
});
