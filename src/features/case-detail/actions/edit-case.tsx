import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import type { ApiBody, CaseDto } from "@/lib/api/types";
import { useCaseTypes, useCategories, useDepartments } from "@/lib/queries/lookups";
import { parseMoney } from "@/features/new-request/schema";
import { useUpdateCase } from "../use-case-actions";

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");
const optionalEmail = z
  .union([z.literal(""), z.string().trim().email("Enter a valid email")])
  .optional()
  .default("");
const MAX_MONEY = 999_999_999_999.99;

const editSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(20, "Description must be at least 20 characters"),
  categoryId: z.string().min(1, "Category is required"),
  caseTypeId: z.string().min(1, "Case type is required"),
  departmentId: z.string().min(1, "Department is required"),
  isConfidential: z.boolean().default(false),
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
});

type EditInput = z.input<typeof editSchema>;
type EditValues = z.infer<typeof editSchema>;

function toFormValues(c: CaseDto): EditInput {
  return {
    title: c.title,
    description: c.description,
    categoryId: c.categoryId,
    caseTypeId: c.caseTypeId,
    departmentId: c.departmentId,
    isConfidential: c.isConfidential,
    contactName: c.contactName ?? "",
    contactEmail: c.contactEmail ?? "",
    contactPhone: c.contactPhone ?? "",
    counterparty: c.counterparty ?? "",
    estimatedValue: c.estimatedValue === null ? "" : String(c.estimatedValue),
    incidentDate: c.incidentDate ?? "",
    businessDeadline: c.businessDeadline ?? "",
    desiredOutcome: c.desiredOutcome ?? "",
    thirdPartyDetails: c.thirdPartyDetails ?? "",
  };
}

type UpdateBody = ApiBody<"/cases/{id}", "patch">;

/** Only the fields that actually changed vs. `original`; a field cleared back to blank sends
 * `null` (the backend's "clear this field" signal), an untouched field is omitted entirely. */
export function toUpdateBody(values: EditValues, original: CaseDto): UpdateBody {
  const body: Record<string, unknown> = {};
  const textField = (key: keyof EditValues, originalValue: string | null) => {
    const next = (values[key] as string).trim();
    const prev = originalValue ?? "";
    if (next === prev) return;
    body[key] = next === "" ? null : next;
  };

  if (values.title.trim() !== original.title) body["title"] = values.title.trim();
  if (values.description.trim() !== original.description) {
    body["description"] = values.description.trim();
  }
  if (values.categoryId !== original.categoryId) body["categoryId"] = values.categoryId;
  if (values.caseTypeId !== original.caseTypeId) body["caseTypeId"] = values.caseTypeId;
  if (values.departmentId !== original.departmentId) body["departmentId"] = values.departmentId;
  if (values.isConfidential !== original.isConfidential) {
    body["isConfidential"] = values.isConfidential;
  }
  textField("contactName", original.contactName);
  textField("contactEmail", original.contactEmail);
  textField("contactPhone", original.contactPhone);
  textField("counterparty", original.counterparty);
  textField("incidentDate", original.incidentDate);
  textField("businessDeadline", original.businessDeadline);
  textField("desiredOutcome", original.desiredOutcome);
  textField("thirdPartyDetails", original.thirdPartyDetails);

  const nextValue = parseMoney(values.estimatedValue);
  if ((nextValue ?? null) !== original.estimatedValue) {
    body["estimatedValue"] = nextValue ?? null;
  }

  return body as UpdateBody;
}

type Props = {
  caseItem: CaseDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Edit a case's intake fields. Sends only the fields that changed. */
export function EditCaseDialog({ caseItem, open, onOpenChange }: Props) {
  const update = useUpdateCase(caseItem.id);
  const categories = useCategories();
  const caseTypes = useCaseTypes();
  const departments = useDepartments();
  const form = useForm<EditInput, unknown, EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: toFormValues(caseItem),
  });
  const { register, watch, control, formState, reset, handleSubmit } = form;
  const { errors } = formState;
  const categoryId = watch("categoryId");
  const caseTypeOptions = (caseTypes.data ?? []).filter((t) => t.categoryId === categoryId);

  useEffect(() => {
    if (open) reset(toFormValues(caseItem));
  }, [open, caseItem, reset]);

  const onSubmit = handleSubmit((values) => {
    const body = toUpdateBody(values, caseItem);
    if (Object.keys(body).length === 0) {
      onOpenChange(false);
      return;
    }
    update.mutate(body, { onSuccess: () => onOpenChange(false) });
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={update.isPending}
      title="Edit case"
      footer={
        <Button
          type="submit"
          form="edit-case-form"
          className="h-11 lg:h-9"
          disabled={update.isPending}
        >
          Save
        </Button>
      }
    >
      <form id="edit-case-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="ec-title">Title</Label>
          <Input id="ec-title" className="mt-1 h-11 lg:h-9" {...register("title")} />
          {errors.title && (
            <p role="alert" className="mt-1 text-sm text-danger">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="ec-description">Description</Label>
          <Textarea id="ec-description" className="mt-1" rows={4} {...register("description")} />
          {errors.description && (
            <p role="alert" className="mt-1 text-sm text-danger">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="ec-category">Category</Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  form.setValue("caseTypeId", "");
                }}
              >
                <SelectTrigger id="ec-category" className="mt-1 h-11 lg:h-9">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.data?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label htmlFor="ec-case-type">Case type</Label>
          <Controller
            control={control}
            name="caseTypeId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={!categoryId}>
                <SelectTrigger id="ec-case-type" className="mt-1 h-11 lg:h-9">
                  <SelectValue placeholder="Select a case type" />
                </SelectTrigger>
                <SelectContent>
                  {caseTypeOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label htmlFor="ec-department">Department</Label>
          <Controller
            control={control}
            name="departmentId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="ec-department" className="mt-1 h-11 lg:h-9">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.data?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Controller
            control={control}
            name="isConfidential"
            render={({ field }) => (
              <Switch
                id="ec-confidential"
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="ec-confidential">Confidential</Label>
        </div>

        <div>
          <Label htmlFor="ec-contact-name">Contact name</Label>
          <Input id="ec-contact-name" className="mt-1 h-11 lg:h-9" {...register("contactName")} />
        </div>
        <div>
          <Label htmlFor="ec-contact-email">Contact email</Label>
          <Input id="ec-contact-email" className="mt-1 h-11 lg:h-9" {...register("contactEmail")} />
          {errors.contactEmail && (
            <p role="alert" className="mt-1 text-sm text-danger">
              {errors.contactEmail.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="ec-contact-phone">Contact phone</Label>
          <Input id="ec-contact-phone" className="mt-1 h-11 lg:h-9" {...register("contactPhone")} />
        </div>
        <div>
          <Label htmlFor="ec-counterparty">Counterparty</Label>
          <Input id="ec-counterparty" className="mt-1 h-11 lg:h-9" {...register("counterparty")} />
        </div>
        <div>
          <Label htmlFor="ec-estimated-value">Estimated value</Label>
          <Input
            id="ec-estimated-value"
            className="mt-1 h-11 lg:h-9"
            {...register("estimatedValue")}
          />
          {errors.estimatedValue && (
            <p role="alert" className="mt-1 text-sm text-danger">
              {errors.estimatedValue.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="ec-incident-date">Incident date</Label>
          <Input
            id="ec-incident-date"
            type="date"
            className="mt-1 h-11 lg:h-9"
            {...register("incidentDate")}
          />
        </div>
        <div>
          <Label htmlFor="ec-business-deadline">Business deadline</Label>
          <Input
            id="ec-business-deadline"
            type="date"
            className="mt-1 h-11 lg:h-9"
            {...register("businessDeadline")}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ec-desired-outcome">Desired outcome</Label>
          <Textarea
            id="ec-desired-outcome"
            className="mt-1"
            rows={3}
            {...register("desiredOutcome")}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ec-third-party">Third-party details</Label>
          <Textarea
            id="ec-third-party"
            className="mt-1"
            rows={3}
            {...register("thirdPartyDetails")}
          />
        </div>

        {update.isError && (
          <p role="alert" className="sm:col-span-2 text-sm text-danger">
            {update.error.message}
          </p>
        )}
      </form>
    </ResponsiveDialog>
  );
}
