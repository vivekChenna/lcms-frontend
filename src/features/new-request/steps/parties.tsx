import { Controller, type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile } from "@/lib/api/types";
import { useBusinessUnits, useEntities } from "@/lib/queries/lookups";
import type { RequestFormInput, RequestFormValues } from "../schema";

type Props = { form: UseFormReturn<RequestFormInput, unknown, RequestFormValues>; me: Profile };

export function PartiesStep({ form, me }: Props) {
  const { register, watch, control, formState } = form;
  const { errors } = formState;
  const entities = useEntities();
  const businessUnits = useBusinessUnits();
  const entityId = watch("entityId");
  const businessUnitOptions = (businessUnits.data ?? []).filter((b) => b.entityId === entityId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 text-sm font-medium">Entity and business unit</h2>
        {me.role === "requester" ? (
          <p className="text-sm text-muted-foreground">
            {me.entityName ?? "—"} · {me.businessUnitName ?? "—"}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="rf-entity">Entity</Label>
              <Controller
                control={control}
                name="entityId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue("businessUnitId", "");
                    }}
                  >
                    <SelectTrigger id="rf-entity" className="mt-1 h-11 lg:h-9">
                      <SelectValue placeholder="Select an entity" />
                    </SelectTrigger>
                    <SelectContent>
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
              <Label htmlFor="rf-business-unit">Business unit</Label>
              <Controller
                control={control}
                name="businessUnitId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    disabled={!entityId}
                  >
                    <SelectTrigger id="rf-business-unit" className="mt-1 h-11 lg:h-9">
                      <SelectValue placeholder="Select a business unit" />
                    </SelectTrigger>
                    <SelectContent>
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
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">Contact (optional)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="rf-contact-name">Name</Label>
            <Input id="rf-contact-name" className="mt-1 h-11 lg:h-9" {...register("contactName")} />
          </div>
          <div>
            <Label htmlFor="rf-contact-email">Email</Label>
            <Input
              id="rf-contact-email"
              type="email"
              className="mt-1 h-11 lg:h-9"
              {...register("contactEmail")}
            />
            {errors.contactEmail && (
              <p role="alert" className="mt-1 text-sm text-danger">
                {errors.contactEmail.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="rf-contact-phone">Phone</Label>
            <Input
              id="rf-contact-phone"
              type="tel"
              className="mt-1 h-11 lg:h-9"
              {...register("contactPhone")}
            />
          </div>
          <div>
            <Label htmlFor="rf-counterparty">Counterparty</Label>
            <Input
              id="rf-counterparty"
              className="mt-1 h-11 lg:h-9"
              {...register("counterparty")}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">Case intake (optional)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="rf-estimated-value">Estimated value (SAR)</Label>
            <Input
              id="rf-estimated-value"
              inputMode="decimal"
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
            <Label htmlFor="rf-incident-date">Incident date</Label>
            <Controller
              control={control}
              name="incidentDate"
              render={({ field }) => (
                <DatePicker
                  id="rf-incident-date"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div>
            <Label htmlFor="rf-business-deadline">Business deadline</Label>
            <Controller
              control={control}
              name="businessDeadline"
              render={({ field }) => (
                <DatePicker
                  id="rf-business-deadline"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="rf-desired-outcome">Desired outcome</Label>
            <Textarea
              id="rf-desired-outcome"
              className="mt-1"
              rows={3}
              {...register("desiredOutcome")}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="rf-third-party">Third-party details</Label>
            <Textarea
              id="rf-third-party"
              className="mt-1"
              rows={3}
              {...register("thirdPartyDetails")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
