import { z } from "zod";
import type { CreateCaseBody, UserRole } from "@/lib/api/types";

export const PRIORITY_UI = ["Critical", "High", "Medium", "Low"] as const;
export type PriorityUi = (typeof PRIORITY_UI)[number];

const PRIORITY_TO_BACKEND: Record<PriorityUi, CreateCaseBody["priority"]> = {
  Critical: "P1",
  High: "P2",
  Medium: "P3",
  Low: "P4",
};

const MAX_MONEY = 999_999_999_999.99;

/** `"1,200.50"` -> `1200.5`; blank/whitespace -> `undefined`; anything else unparsable -> `NaN`
 * (the schema's refine rejects `NaN`, so this never reaches `toCreateBody` as a bad value). */
export function parseMoney(raw: string | undefined): number | undefined {
  if (!raw || !raw.trim()) return undefined;
  const n = Number(raw.replace(/,/g, ""));
  return n;
}

const optionalEmail = z
  .union([z.literal(""), z.string().trim().email("Enter a valid email")])
  .optional()
  .default("");
const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

/** Mirrors the backend's create-case validation (BRD + `cases.schemas.ts`); frontend-only (zod 3). */
export const requestSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(20, "Description must be at least 20 characters"),
  categoryId: z.string().min(1, "Category is required"),
  caseTypeId: z.string().min(1, "Case type is required"),
  departmentId: z.string().min(1, "Department is required"),
  priority: z.enum(PRIORITY_UI).default("Medium"),
  isConfidential: z.boolean().default(false),
  entityId: z.string().optional().default(""),
  businessUnitId: z.string().optional().default(""),
  contactName: optionalText(200),
  contactEmail: optionalEmail,
  contactPhone: optionalText(50),
  counterparty: optionalText(300),
  estimatedValue: z
    .string()
    .optional()
    .default("")
    .refine((v) => {
      const n = parseMoney(v);
      return n === undefined || (Number.isFinite(n) && n >= 0 && n <= MAX_MONEY);
    }, `Enter a valid amount up to ${MAX_MONEY.toLocaleString()}`),
  incidentDate: z.string().optional().default(""),
  businessDeadline: z.string().optional().default(""),
  desiredOutcome: optionalText(5000),
  thirdPartyDetails: optionalText(5000),
  declarationConfirmed: z
    .boolean()
    .refine((v) => v === true, "You must confirm the declaration before submitting"),
});

/** The form's live field state (register/watch/control): optional fields may be `undefined`
 * before `defaultValues` or a user edit fills them in. */
export type RequestFormInput = z.input<typeof requestSchema>;
/** What the resolver hands `handleSubmit`'s callback and what `toCreateBody` consumes: every
 * optional field has already been defaulted to `""`/`false`, so nothing here is `undefined`. */
export type RequestFormValues = z.infer<typeof requestSchema>;

/** Builds the `POST /cases` body: trims strings, omits blank optionals (never `""`), maps the
 * UI priority label, and includes entity/business unit only for roles the backend doesn't
 * pre-fill them for (requesters get theirs from their own profile, server-side). */
export function toCreateBody(values: RequestFormValues, role: UserRole): CreateCaseBody {
  const trim = (v: string) => {
    const t = v.trim();
    return t === "" ? undefined : t;
  };

  const body: Record<string, unknown> = {
    title: values.title.trim(),
    description: values.description.trim(),
    declarationConfirmed: true,
    categoryId: values.categoryId,
    caseTypeId: values.caseTypeId,
    departmentId: values.departmentId,
    priority: PRIORITY_TO_BACKEND[values.priority],
    isConfidential: values.isConfidential,
    contactName: trim(values.contactName),
    contactEmail: trim(values.contactEmail),
    contactPhone: trim(values.contactPhone),
    counterparty: trim(values.counterparty),
    desiredOutcome: trim(values.desiredOutcome),
    thirdPartyDetails: trim(values.thirdPartyDetails),
    incidentDate: trim(values.incidentDate),
    businessDeadline: trim(values.businessDeadline),
    estimatedValue: parseMoney(values.estimatedValue),
  };

  if (role !== "requester") {
    body["entityId"] = trim(values.entityId);
    body["businessUnitId"] = trim(values.businessUnitId);
  }

  for (const key of Object.keys(body)) {
    if (body[key] === undefined) delete body[key];
  }
  return body as unknown as CreateCaseBody;
}
