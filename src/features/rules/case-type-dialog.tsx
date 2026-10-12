import { useState } from "react";
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
import { useCreateCaseType } from "@/features/master-data/use-master-data";
import { useCategories } from "@/lib/queries/lookups";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

const isWholeHours = (v: string) => Number.isInteger(Number(v)) && Number(v) > 0;

/** Adds a case type together with its SLA: the category it belongs to, its name and its two targets. */
export function CaseTypeDialog({ open, onOpenChange }: Props) {
  const categories = useCategories();
  const create = useCreateCaseType();
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [ack, setAck] = useState("24");
  const [resolution, setResolution] = useState("72");
  const [touched, setTouched] = useState(false);

  const nameInvalid = name.trim().length === 0;
  const hoursInvalid = !isWholeHours(ack) || !isWholeHours(resolution);
  const resolutionShorter = !hoursInvalid && Number(resolution) < Number(ack);

  const save = () => {
    setTouched(true);
    if (!categoryId || nameInvalid || hoursInvalid || resolutionShorter) return;
    create.mutate(
      {
        categoryId,
        name: name.trim(),
        slaAckHours: Number(ack),
        slaResolutionHours: Number(resolution),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={create.isPending}
      title="New case type"
      description="A case type is a kind of matter, with the time legal has to take it on and to resolve it."
      footer={
        <Button
          type="button"
          className="h-11 lg:h-9"
          loading={create.isPending}
          loadingText="Adding…"
          onClick={save}
        >
          Add case type
        </Button>
      }
    >
      <Label htmlFor="ct-category">Category</Label>
      <Select value={categoryId} onValueChange={setCategoryId}>
        <SelectTrigger id="ct-category" className="mt-1 h-11 lg:h-9">
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {categories.data
            ?.filter((c) => c.isActive)
            .map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {touched && !categoryId && (
        <p role="alert" className="mt-1 text-sm text-danger">
          Choose a category.
        </p>
      )}

      <Label htmlFor="ct-name" className="mt-4 block">
        Name
      </Label>
      <Input
        id="ct-name"
        className="mt-1 h-11 lg:h-9"
        placeholder="e.g. Commercial Contract Review"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {touched && nameInvalid && (
        <p role="alert" className="mt-1 text-sm text-danger">
          Name is required.
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ct-ack">Acknowledge within (hours)</Label>
          <Input
            id="ct-ack"
            type="number"
            min={1}
            className="mt-1 h-11 lg:h-9"
            value={ack}
            onChange={(e) => setAck(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="ct-resolution">Resolve within (hours)</Label>
          <Input
            id="ct-resolution"
            type="number"
            min={1}
            className="mt-1 h-11 lg:h-9"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          />
        </div>
      </div>
      {touched && hoursInvalid && (
        <p role="alert" className="mt-2 text-sm text-danger">
          Enter a whole number of hours, 1 or more, in both fields.
        </p>
      )}
      {touched && resolutionShorter && (
        <p role="alert" className="mt-2 text-sm text-danger">
          Resolution time cannot be shorter than the acknowledgement time.
        </p>
      )}
      {create.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {create.error.message}
        </p>
      )}
    </ResponsiveDialog>
  );
}
