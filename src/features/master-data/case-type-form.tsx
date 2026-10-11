import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/common/empty-state";
import type { CaseCategoryDto, CaseTypeDto } from "@/lib/api/types";
import { useCreateCaseType, useUpdateCaseTypeMasterData } from "./use-master-data";

function CaseTypeRow({ caseType }: { caseType: CaseTypeDto }) {
  const update = useUpdateCaseTypeMasterData(caseType.id);
  return (
    <li className="flex items-center justify-between gap-2 border-b py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="break-words">{caseType.name}</p>
        <p className="text-xs text-muted-foreground">
          Ack {caseType.slaAckHours}h / Resolve {caseType.slaResolutionHours}h
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <Switch
          checked={caseType.isActive}
          onCheckedChange={(checked) => update.mutate({ isActive: checked })}
          aria-label={
            caseType.isActive ? `Deactivate ${caseType.name}` : `Activate ${caseType.name}`
          }
        />
        <Badge
          variant={caseType.isActive ? "outline" : "secondary"}
          className="hidden sm:inline-flex"
        >
          {caseType.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
    </li>
  );
}

type Props = { categories: CaseCategoryDto[] | undefined; caseTypes: CaseTypeDto[] | undefined };

export function CaseTypeForm({ categories, caseTypes }: Props) {
  const create = useCreateCaseType();
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [ackHours, setAckHours] = useState("24");
  const [resolutionHours, setResolutionHours] = useState("72");

  const add = () => {
    const trimmed = name.trim();
    const ack = Number(ackHours);
    const resolution = Number(resolutionHours);
    if (
      !trimmed ||
      !categoryId ||
      !Number.isInteger(ack) ||
      ack <= 0 ||
      !Number.isInteger(resolution) ||
      resolution <= 0
    ) {
      return;
    }
    create.mutate(
      { categoryId, name: trimmed, slaAckHours: ack, slaResolutionHours: resolution },
      { onSuccess: () => setName("") },
    );
  };

  const groups = (categories ?? []).map((c) => ({
    category: c,
    items: (caseTypes ?? []).filter((t) => t.categoryId === c.id),
  }));

  return (
    <div>
      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label htmlFor="ct-category">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="ct-category" className="mt-1 h-11 lg:h-9">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="ct-name">Name</Label>
          <Input
            id="ct-name"
            className="mt-1 h-11 lg:h-9"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="ct-ack">Ack SLA (hours)</Label>
          <Input
            id="ct-ack"
            type="number"
            className="mt-1 h-11 lg:h-9"
            value={ackHours}
            onChange={(e) => setAckHours(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="ct-resolution">Resolution SLA (hours)</Label>
          <Input
            id="ct-resolution"
            type="number"
            className="mt-1 h-11 lg:h-9"
            value={resolutionHours}
            onChange={(e) => setResolutionHours(e.target.value)}
          />
        </div>
        <Button
          type="button"
          className="self-end"
          disabled={!name.trim() || !categoryId || create.isPending}
          onClick={add}
        >
          <Plus />
          Add case type
        </Button>
      </div>
      {create.isError && (
        <p role="alert" className="mb-2 text-sm text-danger">
          {create.error.message}
        </p>
      )}

      {groups.every((g) => g.items.length === 0) ? (
        <EmptyState title="No case types yet" icon={Plus} />
      ) : (
        <div className="space-y-4">
          {groups
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <div key={g.category.id}>
                <h3 className="mb-1 text-sm font-medium">{g.category.name}</h3>
                <ul className="rounded-lg border bg-card px-3">
                  {g.items.map((t) => (
                    <CaseTypeRow key={t.id} caseType={t} />
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
