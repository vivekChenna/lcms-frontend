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
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import type { UserDto } from "@/lib/api/types";
import { useBusinessUnits, useDepartments, useEntities } from "@/lib/queries/lookups";
import { useCreateUser, useUpdateUser } from "./use-users";

const ALL = "__none__";
const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

const baseFields = {
  fullName: z.string().trim().min(1, "Full name is required"),
  designation: optionalText(200),
  phone: optionalText(50),
  departmentId: z.string().optional().default(""),
  entityId: z.string().optional().default(""),
  businessUnitId: z.string().optional().default(""),
};

const createSchema = z.object({
  ...baseFields,
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const editSchema = z.object(baseFields);

type CreateInput = z.input<typeof createSchema>;
type CreateValues = z.infer<typeof createSchema>;
type EditInput = z.input<typeof editSchema>;
type EditValues = z.infer<typeof editSchema>;

function toFormValues(user: UserDto | null): CreateInput {
  return {
    fullName: user?.fullName ?? "",
    email: "",
    password: "",
    designation: user?.designation ?? "",
    phone: user?.phone ?? "",
    departmentId: user?.departmentId ?? "",
    entityId: user?.entityId ?? "",
    businessUnitId: user?.businessUnitId ?? "",
  };
}

type Props = { user: UserDto | null; open: boolean; onOpenChange: (open: boolean) => void };

/** `user: null` creates a new account; otherwise edits it (email/password are not editable here
 * - the backend's PATCH /users/{id} body has no fields for them). */
export function UserFormDialog({ user, open, onOpenChange }: Props) {
  const isCreate = user === null;
  const create = useCreateUser();
  const update = useUpdateUser(user?.id ?? "");
  const mutation = isCreate ? create : update;

  const form = useForm<CreateInput, unknown, CreateValues>({
    resolver: zodResolver(isCreate ? createSchema : (editSchema as unknown as typeof createSchema)),
    defaultValues: toFormValues(user),
  });
  const { register, watch, control, formState, reset, handleSubmit } = form;
  const { errors } = formState;
  const departments = useDepartments();
  const entities = useEntities();
  const businessUnits = useBusinessUnits();
  const entityId = watch("entityId");
  const businessUnitOptions = (businessUnits.data ?? []).filter(
    (b) => !entityId || b.entityId === entityId,
  );

  useEffect(() => {
    if (open) reset(toFormValues(user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  const trim = (v: string) => (v.trim() === "" ? null : v.trim());

  const onSubmit = handleSubmit((values) => {
    if (isCreate) {
      const createValues = values as CreateValues;
      create.mutate(
        {
          fullName: createValues.fullName.trim(),
          email: createValues.email.trim(),
          password: createValues.password,
          ...(trim(createValues.designation)
            ? { designation: trim(createValues.designation)! }
            : {}),
          ...(trim(createValues.phone) ? { phone: trim(createValues.phone)! } : {}),
          ...(createValues.departmentId ? { departmentId: createValues.departmentId } : {}),
          ...(createValues.entityId ? { entityId: createValues.entityId } : {}),
          ...(createValues.businessUnitId ? { businessUnitId: createValues.businessUnitId } : {}),
        },
        {
          onSuccess: () => onOpenChange(false),
          onError: (err) => {
            if (err.status === 409) form.setError("email", { message: err.message });
          },
        },
      );
    } else {
      const editValues = values as unknown as EditValues;
      update.mutate(
        {
          fullName: editValues.fullName.trim(),
          designation: trim(editValues.designation),
          phone: trim(editValues.phone),
          departmentId: editValues.departmentId || null,
          entityId: editValues.entityId || null,
          businessUnitId: editValues.businessUnitId || null,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={mutation.isPending}
      title={isCreate ? "New user" : "Edit user"}
      footer={
        <Button
          type="submit"
          form="user-form"
          className="h-11 lg:h-9"
          disabled={mutation.isPending}
        >
          Save
        </Button>
      }
    >
      <form id="user-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="uf-name">Full name</Label>
          <Input id="uf-name" className="mt-1 h-11 lg:h-9" {...register("fullName")} />
          {errors.fullName && (
            <p role="alert" className="mt-1 text-sm text-danger">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {isCreate && (
          <>
            <div>
              <Label htmlFor="uf-email">Email</Label>
              <Input id="uf-email" className="mt-1 h-11 lg:h-9" {...register("email")} />
              {errors.email && (
                <p role="alert" className="mt-1 text-sm text-danger">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="uf-password">Password</Label>
              <Input
                id="uf-password"
                type="password"
                className="mt-1 h-11 lg:h-9"
                {...register("password")}
              />
              {errors.password && (
                <p role="alert" className="mt-1 text-sm text-danger">
                  {errors.password.message}
                </p>
              )}
            </div>
          </>
        )}

        <div>
          <Label htmlFor="uf-designation">Designation</Label>
          <Input id="uf-designation" className="mt-1 h-11 lg:h-9" {...register("designation")} />
        </div>
        <div>
          <Label htmlFor="uf-phone">Phone</Label>
          <Input id="uf-phone" className="mt-1 h-11 lg:h-9" {...register("phone")} />
        </div>

        <div>
          <Label htmlFor="uf-department">Department</Label>
          <Controller
            control={control}
            name="departmentId"
            render={({ field }) => (
              <Select
                value={field.value || ALL}
                onValueChange={(v) => field.onChange(v === ALL ? "" : v)}
              >
                <SelectTrigger id="uf-department" className="mt-1 h-11 lg:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>None</SelectItem>
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
        <div>
          <Label htmlFor="uf-entity">Entity</Label>
          <Controller
            control={control}
            name="entityId"
            render={({ field }) => (
              <Select
                value={field.value || ALL}
                onValueChange={(v) => {
                  field.onChange(v === ALL ? "" : v);
                  form.setValue("businessUnitId", "");
                }}
              >
                <SelectTrigger id="uf-entity" className="mt-1 h-11 lg:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>None</SelectItem>
                  {entities.data?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="uf-business-unit">Business unit</Label>
          <Controller
            control={control}
            name="businessUnitId"
            render={({ field }) => (
              <Select
                value={field.value || ALL}
                onValueChange={(v) => field.onChange(v === ALL ? "" : v)}
              >
                <SelectTrigger id="uf-business-unit" className="mt-1 h-11 lg:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>None</SelectItem>
                  {businessUnitOptions.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {mutation.isError && !errors.email && (
          <p role="alert" className="sm:col-span-2 text-sm text-danger">
            {mutation.error.message}
          </p>
        )}
      </form>
    </ResponsiveDialog>
  );
}
