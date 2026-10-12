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
import { useMe } from "@/lib/auth";
import { personLabel } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/labels";
import { useCaseHolders } from "@/lib/queries/lookups";
import { useAssignCase } from "../use-case-actions";

type Props = {
  caseId: string;
  /** The current assignee, if any; present means this is a reassign and resets acceptance. */
  currentRepId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Assign (or reassign) a case to an active legal rep or legal manager. A manager may pick themselves
 * to take the case up; they then accept it like any representative.
 */
export function AssignDialog({ caseId, currentRepId, open, onOpenChange }: Props) {
  const me = useMe();
  const { data: reps, isLoading } = useCaseHolders();
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
          : "Choose a legal representative or manager to assign this case to. You can pick yourself to take it up."
      }
      footer={
        <Button
          type="button"
          className="h-11 lg:h-9"
          disabled={!repId}
          loading={assign.isPending}
          loadingText="Assigning…"
          onClick={confirm}
        >
          Assign
        </Button>
      }
    >
      <Label htmlFor="assign-rep">Assign to</Label>
      <Select value={repId} onValueChange={setRepId} disabled={isLoading}>
        <SelectTrigger id="assign-rep" className="mt-1 h-11 lg:h-9">
          <SelectValue placeholder={isLoading ? "Loading…" : "Select a person"} />
        </SelectTrigger>
        <SelectContent>
          {reps?.map((rep) => (
            <SelectItem key={rep.id} value={rep.id}>
              {personLabel(rep.fullName, rep.designation)}
              {rep.role === "legal_manager" && ` · ${ROLE_LABEL.legal_manager}`}
              {rep.id === me?.id && " (you)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ResponsiveDialog>
  );
}
