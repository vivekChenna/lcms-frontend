import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { useLegalReps } from "@/lib/queries/lookups";
import { useAssignCase } from "../use-case-actions";

type Props = {
  caseId: string;
  /** The current assignee, if any; present means this is a reassign and resets acceptance. */
  currentRepId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Assign (or reassign) a case to an active legal rep. */
export function AssignDialog({ caseId, currentRepId, open, onOpenChange }: Props) {
  const { data: reps, isLoading } = useLegalReps();
  const assign = useAssignCase(caseId);
  const [repId, setRepId] = useState("");

  const confirm = () => {
    if (!repId) return;
    assign.mutate(repId, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={assign.isPending}
      title={currentRepId ? "Reassign this case" : "Assign this case"}
      description={
        currentRepId
          ? "Reassigning resets any acceptance; the new rep must accept it again."
          : "Choose a legal representative to assign this case to."
      }
      footer={
        <Button
          type="button"
          className="h-11 lg:h-9"
          disabled={!repId || assign.isPending}
          onClick={confirm}
        >
          Assign
        </Button>
      }
    >
      <Label htmlFor="assign-rep">Legal representative</Label>
      <Select value={repId} onValueChange={setRepId} disabled={isLoading}>
        <SelectTrigger id="assign-rep" className="mt-1 h-11 lg:h-9">
          <SelectValue placeholder={isLoading ? "Loading…" : "Select a representative"} />
        </SelectTrigger>
        <SelectContent>
          {reps?.map((rep) => (
            <SelectItem key={rep.id} value={rep.id}>
              {rep.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ResponsiveDialog>
  );
}
