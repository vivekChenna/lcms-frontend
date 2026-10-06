import { Flame, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { CasePriority, CaseStatus, SlaState } from "@/lib/api/types";
import {
  PRIORITY_LABEL,
  SLA_LABEL,
  priorityTone,
  slaTone,
  statusTone,
  type Tone,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-info-border bg-info text-info-foreground",
  success: "border-success/30 bg-success/10 text-success-foreground",
  warning: "border-warning/40 bg-warning/15 text-warning-foreground",
  danger: "border-danger/30 bg-danger/10 text-danger-foreground",
};

function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 whitespace-nowrap font-medium shadow-none", TONE_CLASS[tone])}
    >
      {children}
    </Badge>
  );
}

export const StatusBadge = ({ status }: { status: CaseStatus }) => (
  <ToneBadge tone={statusTone(status)}>{status}</ToneBadge>
);

export const PriorityBadge = ({ priority }: { priority: CasePriority }) => (
  <ToneBadge tone={priorityTone(priority)}>{PRIORITY_LABEL[priority]}</ToneBadge>
);

export const SlaBadge = ({ state }: { state: SlaState }) => (
  <ToneBadge tone={slaTone(state)}>{SLA_LABEL[state]}</ToneBadge>
);

export const ConfidentialBadge = () => (
  <ToneBadge tone="neutral">
    <Lock className="size-3" aria-hidden />
    Confidential
  </ToneBadge>
);

export const EscalatedBadge = () => (
  <ToneBadge tone="danger">
    <Flame className="size-3" aria-hidden />
    Escalated
  </ToneBadge>
);
