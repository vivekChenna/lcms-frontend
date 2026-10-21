import { zodResolver } from "@hookform/resolvers/zod";
import { useBlocker } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { ApiError, fieldErrors } from "@/lib/api/errors";
import { useMe } from "@/lib/auth";
import type { Profile } from "@/lib/api/types";
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
  [
    "entityId",
    "businessUnitId",
    "contactEmail",
    "estimatedValue",
    "incidentDate",
    "businessDeadline",
  ],
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

/** Everything the system already knows about the person is filled in; they can still change it. */
function defaultsFor(me: Profile | null | undefined): RequestFormInput {
  return {
    ...DEFAULT_VALUES,
    contactName: me?.fullName ?? "",
    contactEmail: me?.email ?? "",
    contactPhone: me?.phone ?? "",
    departmentId: me?.departmentId ?? "",
    entityId: me?.entityId ?? "",
    businessUnitId: me?.businessUnitId ?? "",
  };
}

export function NewRequestPage() {
  const me = useMe();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  // 3 generics: field/register state is the pre-default input shape, but `handleSubmit`'s
  // callback (and `toCreateBody`) get the fully-defaulted output shape (RequestFormValues).
  const form = useForm<RequestFormInput, unknown, RequestFormValues>({
    resolver: zodResolver(requestSchema),
    mode: "onBlur",
    defaultValues: defaultsFor(me),
  });
  const confirmed = form.watch("declarationConfirmed");
  // Clears the dirty flag before navigating away, synchronously — not via `submit.isSuccess`,
  // which only updates on the next render and would otherwise race the blocker below.
  const submit = useSubmitCase({ onBeforeNavigate: () => form.reset(defaultsFor(me)) });

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
          if (Object.keys(errors).length > 0) {
            setStep(firstStep);
          } else {
            // No field-specific details (e.g. a cross-field business rule like VC-03) - there is
            // nothing to attach the message to, so it must surface as a toast or it's lost.
            toast.error(
              err instanceof ApiError ? err.message : "The request could not be completed.",
            );
            setStep(0);
          }
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
              disabled={!confirmed}
              loading={submit.isPending}
              loadingText="Submitting…"
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
