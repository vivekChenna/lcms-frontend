import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import type { CaseDto } from "@/lib/api/types";
import { useRaiseInfoRequest } from "./use-info-requests";

type Props = { caseItem: CaseDto; open: boolean; onOpenChange: (open: boolean) => void };

/**
 * Raises an information request. The responder is always the case's requester - the backend
 * accepts any active user, but the requester is the only person this flow needs to ask, and
 * exposing a full user search here would need admin-level access a legal rep doesn't have.
 */
export function RaiseDialog({ caseItem, open, onOpenChange }: Props) {
  const raise = useRaiseInfoRequest(caseItem.id);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [touched, setTouched] = useState(false);

  const subjectInvalid = subject.trim().length === 0;
  const descriptionInvalid = description.trim().length === 0;

  const confirm = () => {
    setTouched(true);
    if (subjectInvalid || descriptionInvalid) return;
    raise.mutate(
      {
        subject: subject.trim(),
        requirementDescription: description.trim(),
        responderId: caseItem.requesterId,
        ...(dueDate ? { dueDate } : {}),
      },
      {
        onSuccess: () => {
          setSubject("");
          setDescription("");
          setDueDate("");
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
      description={`This will be sent to ${caseItem.requesterName ?? "the requester"}.`}
      footer={
        <Button type="button" className="h-11 lg:h-9" disabled={raise.isPending} onClick={confirm}>
          Raise request
        </Button>
      }
    >
      <Label htmlFor="ir-subject">Subject</Label>
      <Input
        id="ir-subject"
        className="mt-1 h-11 lg:h-9"
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
