import { Controller, type UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/format";
import { useCaseTypes, useCategories, useDepartments } from "@/lib/queries/lookups";
import { nameOf } from "@/lib/queries/lookups";
import { parseMoney, type RequestFormInput, type RequestFormValues } from "../schema";
import { Attachments } from "../attachments";

type Props = {
  form: UseFormReturn<RequestFormInput, unknown, RequestFormValues>;
  files: File[];
  onFilesChange: (files: File[]) => void;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export function ReviewStep({ form, files, onFilesChange }: Props) {
  const values = form.watch();
  const categories = useCategories();
  const caseTypes = useCaseTypes();
  const departments = useDepartments();
  const { errors } = form.formState;
  const estimated = parseMoney(values.estimatedValue);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 text-sm font-medium">Summary</h2>
        <div className="rounded-lg border bg-card p-4">
          <Row label="Title" value={values.title} />
          <Row label="Category" value={nameOf(categories.data, values.categoryId)} />
          <Row label="Case type" value={nameOf(caseTypes.data, values.caseTypeId)} />
          <Row label="Department" value={nameOf(departments.data, values.departmentId)} />
          <Row label="Priority" value={values.priority ?? "Medium"} />
          <Row label="Confidential" value={values.isConfidential ? "Yes" : "No"} />
          {values.estimatedValue && (
            <Row label="Estimated value" value={formatMoney(estimated ?? null)} />
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">Attachments (optional)</h2>
        <Attachments files={files} onChange={onFilesChange} />
      </div>

      <div className="flex items-start gap-2">
        <Controller
          control={form.control}
          name="declarationConfirmed"
          render={({ field }) => (
            <Checkbox
              id="rf-declaration"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
        <Label htmlFor="rf-declaration" className="text-sm font-normal">
          I confirm the information above is accurate and I am authorised to submit this request.
        </Label>
      </div>
      {errors.declarationConfirmed && (
        <p role="alert" className="text-sm text-danger">
          {errors.declarationConfirmed.message}
        </p>
      )}
    </div>
  );
}
