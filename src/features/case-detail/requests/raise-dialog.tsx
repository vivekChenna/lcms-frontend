import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { personLabel } from "@/lib/format";
import type { CaseDto } from "@/lib/api/types";
import { useRaiseInfoRequest, useResponderCandidates } from "./use-info-requests";

type Props = { caseItem: CaseDto; open: boolean; onOpenChange: (open: boolean) => void };

/**
 * Raises an information request. The legal representative picks who to ask from the people of the
 * case's department (the backend lists them: a full user search would need admin access); the
 * person who raised the case is preselected.
 */
export function RaiseDialog({ caseItem, open, onOpenChange }: Props) {
  const raise = useRaiseInfoRequest(caseItem.id);
  const candidates = useResponderCandidates(caseItem.id, open);
  const [chosenId, setChosenId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [touched, setTouched] = useState(false);

  const people = candidates.data ?? [];
  const responderId =
    chosenId || (people.some((p) => p.id === caseItem.requesterId) ? caseItem.requesterId : "");
  const responderInvalid = responderId === "";
  const subjectInvalid = subject.trim().length === 0;
  const descriptionInvalid = description.trim().length === 0;

  const confirm = () => {
    setTouched(true);
    if (subjectInvalid || descriptionInvalid || responderInvalid) return;
    raise.mutate(
      {
        subject: subject.trim(),
        requirementDescription: description.trim(),
        responderId,
        ...(dueDate ? { dueDate } : {}),
      },
      {
        onSuccess: () => {
          setSubject("");
          setDescription("");
          setDueDate("");
          setChosenId("");
          setTouched(false);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      pending={raise.isPending}
      title="Raise an information request"
      description="Ask someone from this case's department for what you need. They will be able to see the case and answer here."
      footer={
        <Button
          type="button"
          className="h-11 lg:h-9"
          loading={raise.isPending}
          loadingText="Raising…"
          onClick={confirm}
        >
          Raise request
        </Button>
      }
    >
      <Label htmlFor="ir-responder">Ask</Label>
      <Select value={responderId} onValueChange={setChosenId} disabled={candidates.isPending}>
        <SelectTrigger id="ir-responder" className="mt-1 h-11 lg:h-9">
          <SelectValue placeholder={candidates.isPending ? "Loading…" : "Select a person"} />
        </SelectTrigger>
        <SelectContent>
          {people.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {personLabel(p.fullName, p.designation)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {touched && responderInvalid && (
        <p role="alert" className="mt-1 text-sm text-danger">
          Choose who to ask.
        </p>
      )}

      <Label htmlFor="ir-subject" className="mt-4 block">
        Subject
      </Label>
      <Input
        id="ir-subject"
        className="mt-1 h-11 lg:h-9"
        placeholder="e.g. Signed copy of the contract"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      {touched && subjectInvalid && (
        <p role="alert" className="mt-1 text-sm text-danger">
          Subject is required.
        </p>
      )}

      <Label htmlFor="ir-description" className="mt-4 block">
        What do you need?
      </Label>
      <Textarea
        id="ir-description"
        className="mt-1"
        placeholder="Say exactly what you need and why."
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {touched && descriptionInvalid && (
        <p role="alert" className="mt-1 text-sm text-danger">
          This is required.
        </p>
      )}

      <Label htmlFor="ir-due-date" className="mt-4 block">
        Due date (optional)
      </Label>
      <DatePicker id="ir-due-date" value={dueDate} onChange={setDueDate} />

      {raise.isError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {raise.error.message}
        </p>
      )}
    </ResponsiveDialog>
  );
}
