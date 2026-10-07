import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/common/empty-state";
import type { BusinessUnitDto, EntityDto } from "@/lib/api/types";
import {
  useCreateBusinessUnit,
  useCreateEntity,
  useUpdateBusinessUnit,
  useUpdateEntity,
} from "./use-master-data";

function BusinessUnitRow({ unit }: { unit: BusinessUnitDto }) {
  const update = useUpdateBusinessUnit(unit.id);
  return (
    <li className="flex items-center justify-between gap-2 py-1.5 pl-6 text-sm">
      <span className="min-w-0 flex-1 break-words text-muted-foreground">{unit.name}</span>
      <div className="flex items-center gap-1.5">
        <Switch
          checked={unit.isActive}
          onCheckedChange={(checked) => update.mutate({ isActive: checked })}
          aria-label={unit.isActive ? `Deactivate ${unit.name}` : `Activate ${unit.name}`}
        />
        <Badge variant={unit.isActive ? "outline" : "secondary"} className="hidden sm:inline-flex">
          {unit.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
    </li>
  );
}

function EntityRow({
  entity,
  businessUnits,
}: {
  entity: EntityDto;
  businessUnits: BusinessUnitDto[];
}) {
  const update = useUpdateEntity(entity.id);
  const createUnit = useCreateBusinessUnit();
  const [newUnit, setNewUnit] = useState("");

  const addUnit = () => {
    const trimmed = newUnit.trim();
    if (!trimmed) return;
    createUnit.mutate({ entityId: entity.id, name: trimmed }, { onSuccess: () => setNewUnit("") });
  };

  return (
    <li className="border-b py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-medium">{entity.name}</span>
          <span className="ml-2 text-sm text-muted-foreground">{entity.code}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch
            checked={entity.isActive}
            onCheckedChange={(checked) => update.mutate({ isActive: checked })}
            aria-label={entity.isActive ? `Deactivate ${entity.name}` : `Activate ${entity.name}`}
          />
          <Badge
            variant={entity.isActive ? "outline" : "secondary"}
            className="hidden sm:inline-flex"
          >
            {entity.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <ul className="mt-2">
        {businessUnits.map((u) => (
          <BusinessUnitRow key={u.id} unit={u} />
        ))}
      </ul>
      <div className="mt-2 flex gap-2 pl-6">
        <Input
          className="h-9"
          placeholder="New business unit name"
          value={newUnit}
          onChange={(e) => setNewUnit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addUnit()}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!newUnit.trim() || createUnit.isPending}
          onClick={addUnit}
        >
          <Plus />
          Add
        </Button>
      </div>
      {(update.isError || createUnit.isError) && (
        <p role="alert" className="mt-1 text-sm text-danger">
          {update.error?.message ?? createUnit.error?.message}
        </p>
      )}
    </li>
  );
}

type Props = { entities: EntityDto[] | undefined; businessUnits: BusinessUnitDto[] | undefined };

export function EntityForm({ entities, businessUnits }: Props) {
  const createEntity = useCreateEntity();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const addEntity = () => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    if (!trimmedName || !trimmedCode) return;
    createEntity.mutate(
      { name: trimmedName, code: trimmedCode },
      {
        onSuccess: () => {
          setName("");
          setCode("");
        },
      },
    );
  };

  return (
    <div>
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <Label htmlFor="entity-name">New entity name</Label>
          <Input
            id="entity-name"
            className="mt-1 h-10"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="entity-code">Code</Label>
          <Input
            id="entity-code"
            className="mt-1 h-10"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <Button
          type="button"
          className="self-end"
          disabled={!name.trim() || !code.trim() || createEntity.isPending}
          onClick={addEntity}
        >
          <Plus />
          Add entity
        </Button>
      </div>
      {createEntity.isError && (
        <p role="alert" className="mb-2 text-sm text-danger">
          {createEntity.error.message}
        </p>
      )}

      {!entities || entities.length === 0 ? (
        <EmptyState title="No entities yet" icon={Plus} />
      ) : (
        <ul className="rounded-lg border bg-card px-3">
          {entities.map((e) => (
            <EntityRow
              key={e.id}
              entity={e}
              businessUnits={(businessUnits ?? []).filter((u) => u.entityId === e.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
