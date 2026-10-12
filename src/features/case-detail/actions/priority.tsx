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
import type { CasePriority } from "@/lib/api/types";
import { PRIORITY_LABEL } from "@/lib/labels";
import { useChangePriority } from "../use-case-actions";

const PRIORITIES: CasePriority[] = ["P1", "P2", "P3", "P4"];

type Props = {
  caseId: string;
  current: CasePriority;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Change a case's priority. */
export function PriorityDialog({ caseId, current, open, onOpenChange }: Props) {
  const changePriority = useChangePriority(caseId);
  const [priority, setPriority] = useState<CasePriority>(current);

  const confirm = () => {
    if (priority === current) return;
    changePriority.mutate(priority, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={changePriority.isPending}
      title="Change priority"
      footer={
        <Button
          type="button"
          className="h-11 lg:h-9"
          disabled={priority === current}
          loading={changePriority.isPending}
          loadingText="Saving…"
          onClick={confirm}
        >
          Save
        </Button>
      }
    >
      <Label htmlFor="priority-select">Priority</Label>
      <Select value={priority} onValueChange={(v) => setPriority(v as CasePriority)}>
        <SelectTrigger id="priority-select" className="mt-1 h-11 lg:h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {changePriority.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {changePriority.error.message}
        </p>
      )}
    </ResponsiveDialog>
  );
}
