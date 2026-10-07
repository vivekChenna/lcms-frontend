import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCaseTypes, useCategories, useDepartments } from "@/lib/queries/lookups";
import { PRIORITY_UI, type RequestFormInput, type RequestFormValues } from "../schema";

type Props = { form: UseFormReturn<RequestFormInput, unknown, RequestFormValues> };

export function DetailsStep({ form }: Props) {
  const { register, watch, control, formState } = form;
  const { errors } = formState;
  const categories = useCategories();
  const caseTypes = useCaseTypes();
  const departments = useDepartments();
  const categoryId = watch("categoryId");
  const caseTypeOptions = (caseTypes.data ?? []).filter((t) => t.categoryId === categoryId);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="rf-title">Title</Label>
        <Input id="rf-title" className="mt-1 h-11 lg:h-9" {...register("title")} />
        {errors.title && (
          <p role="alert" className="mt-1 text-sm text-danger">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="rf-description">Description</Label>
        <Textarea id="rf-description" className="mt-1" rows={4} {...register("description")} />
        {errors.description && (
          <p role="alert" className="mt-1 text-sm text-danger">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="rf-category">Category</Label>
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
              <SelectTrigger id="rf-category" className="mt-1 h-11 lg:h-9">
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
        {errors.categoryId && (
          <p role="alert" className="mt-1 text-sm text-danger">
            {errors.categoryId.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="rf-case-type">Case type</Label>
        <Controller
          control={control}
          name="caseTypeId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={!categoryId}>
              <SelectTrigger id="rf-case-type" className="mt-1 h-11 lg:h-9">
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
        {errors.caseTypeId && (
          <p role="alert" className="mt-1 text-sm text-danger">
            {errors.caseTypeId.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="rf-department">Department</Label>
        <Controller
          control={control}
          name="departmentId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="rf-department" className="mt-1 h-11 lg:h-9">
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
        {errors.departmentId && (
          <p role="alert" className="mt-1 text-sm text-danger">
            {errors.departmentId.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="rf-priority">Priority</Label>
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <Select value={field.value ?? "Medium"} onValueChange={field.onChange}>
              <SelectTrigger id="rf-priority" className="mt-1 h-11 lg:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_UI.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="sm:col-span-2 flex items-center gap-2 pt-2">
        <Controller
          control={control}
          name="isConfidential"
          render={({ field }) => (
            <Switch
              id="rf-confidential"
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <div>
          <Label htmlFor="rf-confidential">Confidential</Label>
          <p className="text-xs text-muted-foreground">
            Only the legal team, you and information-request responders can see this case.
          </p>
        </div>
      </div>
    </div>
  );
}
