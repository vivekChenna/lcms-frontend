import { zodResolver } from "@hookform/resolvers/zod";
import { useBlocker } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { fieldErrors } from "@/lib/api/errors";
import { useMe } from "@/lib/auth";
import { DetailsStep } from "./steps/details";
import { PartiesStep } from "./steps/parties";
import { ReviewStep } from "./steps/review";
import {
  requestSchema,
  toCreateBody,
  type RequestFormInput,
  type RequestFormValues,
} from "./schema";
import { useSubmitCase } from "./use-submit-case";

const STEP_LABELS = ["Details", "Parties & intake", "Review & submit"];

const STEP_FIELDS: FieldPath<RequestFormInput>[][] = [
  ["title", "description", "categoryId", "caseTypeId", "departmentId", "priority"],
  ["entityId", "businessUnitId", "contactEmail", "estimatedValue"],
  ["declarationConfirmed"],
];

const DEFAULT_VALUES: RequestFormInput = {
  title: "",
  description: "",
  categoryId: "",
  caseTypeId: "",
  departmentId: "",
  priority: "Medium",
  isConfidential: false,
  entityId: "",
  businessUnitId: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  counterparty: "",
  estimatedValue: "",
  incidentDate: "",
  businessDeadline: "",
  desiredOutcome: "",
  thirdPartyDetails: "",
  declarationConfirmed: false,
};

export function NewRequestPage() {
  const me = useMe();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  // 3 generics: field/register state is the pre-default input shape, but `handleSubmit`'s
  // callback (and `toCreateBody`) get the fully-defaulted output shape (RequestFormValues).
  const form = useForm<RequestFormInput, unknown, RequestFormValues>({
    resolver: zodResolver(requestSchema),
    mode: "onBlur",
    defaultValues: DEFAULT_VALUES,
  });
  // Clears the dirty flag before navigating away, synchronously — not via `submit.isSuccess`,
  // which only updates on the next render and would otherwise race the blocker below.
  const submit = useSubmitCase({ onBeforeNavigate: () => form.reset(DEFAULT_VALUES) });

  // The blocker is always armed (`condition: true`) and reads `form.formState.isDirty` fresh,
  // inside the callback, at the moment a navigation is attempted — not as an external
  // `condition` value captured at the last render. RHF's `formState` getters read the live
  // internal store, so `form.reset()` (called synchronously before navigating on a successful
  // submit) is reflected immediately; a `condition` prop tied to `isDirty` instead would still
  // show the pre-reset value, because updating it needs a render that hasn't happened yet.
  // blockerFn returning true means "block this navigation"; window.confirm returns true when
  // the user clicks OK to leave, so blocking happens on the opposite answer (Cancel).
  useBlocker(
    () =>
      form.formState.isDirty &&
      !window.confirm("Leave this page? Your request has not been submitted."),
    true,
  );

  if (!me) return null;

  const next = async () => {
    const ok = await form.trigger(STEP_FIELDS[step]);
    if (ok) setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = form.handleSubmit((values) => {
    const body = toCreateBody(values, me.role);
    submit.mutate(
      { body, files },
      {
        onError: (err) => {
          const errors = fieldErrors(err);
          let firstStep = STEP_LABELS.length - 1;
          for (const [field, message] of Object.entries(errors)) {
            form.setError(field as FieldPath<RequestFormInput>, { message });
            const idx = STEP_FIELDS.findIndex((fields) =>
              fields.includes(field as FieldPath<RequestFormInput>),
            );
            if (idx >= 0 && idx < firstStep) firstStep = idx;
          }
          setStep(Object.keys(errors).length > 0 ? firstStep : 0);
        },
      },
    );
  });

  return (
    <div>
      <PageHeader title="New request" description="Submit a legal case for review." />

      <ol className="mb-6 flex flex-wrap gap-2 text-sm" aria-label="Steps">
        {STEP_LABELS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={`rounded-full px-3 py-1 ${
              i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <form onSubmit={(e) => e.preventDefault()}>
        {step === 0 && <DetailsStep form={form} />}
        {step === 1 && <PartiesStep form={form} me={me} />}
        {step === 2 && <ReviewStep form={form} files={files} onFilesChange={setFiles} />}

        <div className="mt-6 flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 lg:h-9"
            disabled={step === 0}
            onClick={back}
          >
            Back
          </Button>
          {step < STEP_LABELS.length - 1 ? (
            <Button type="button" className="h-11 lg:h-9" onClick={next}>
              Next
            </Button>
          ) : (
            <Button
              type="button"
              className="h-11 lg:h-9"
              disabled={submit.isPending}
              onClick={onSubmit}
            >
              Submit request
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
