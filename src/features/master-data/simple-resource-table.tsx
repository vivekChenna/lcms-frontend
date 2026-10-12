import { useState } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/common/empty-state";
import {
  useCreateSimpleResource,
  useUpdateSimpleResource,
  type SimpleResource,
} from "./use-master-data";

type Row = { id: string; name: string; isActive: boolean };

function Item({ row, resource }: { row: Row; resource: SimpleResource }) {
  const update = useUpdateSimpleResource(resource);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === row.name) {
      setEditing(false);
      return;
    }
    update.mutate({ id: row.id, name: trimmed }, { onSuccess: () => setEditing(false) });
  };

  return (
    <li className="flex items-center justify-between gap-2 border-b py-2 last:border-b-0">
      {editing ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            autoFocus
            className="h-11 lg:h-9"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-11 lg:size-8"
            onClick={save}
          >
            <Check className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-11 lg:size-8"
            onClick={() => {
              setName(row.name);
              setEditing(false);
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <span className="min-w-0 flex-1 break-words">{row.name}</span>
      )}
      <div className="flex shrink-0 items-center gap-3">
        {!editing && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-11 lg:size-8"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-4" />
          </Button>
        )}
        <div className="flex items-center gap-1.5">
          <Switch
            checked={row.isActive}
            onCheckedChange={(checked) => update.mutate({ id: row.id, isActive: checked })}
            aria-label={row.isActive ? `Deactivate ${row.name}` : `Activate ${row.name}`}
          />
          <Badge variant={row.isActive ? "outline" : "secondary"} className="hidden sm:inline-flex">
            {row.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
      {update.isError && (
        <p role="alert" className="text-sm text-danger">
          {update.error.message}
        </p>
      )}
    </li>
  );
}

type Props = {
  resource: SimpleResource;
  label: string;
  pluralLabel: string;
  rows: Row[] | undefined;
};

/** Departments, case categories and closure outcomes: list, add, rename, activate/deactivate. */
export function SimpleResourceTable({ resource, label, pluralLabel, rows }: Props) {
  const create = useCreateSimpleResource(resource);
  const [name, setName] = useState("");

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    create.mutate(trimmed, { onSuccess: () => setName("") });
  };

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <Input
          className="h-11 lg:h-10"
          placeholder={`New ${label.toLowerCase()} name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button
          type="button"
          disabled={!name.trim()}
          loading={create.isPending}
          loadingText="Adding…"
          onClick={add}
        >
          <Plus />
          Add
        </Button>
      </div>
      {create.isError && (
        <p role="alert" className="mb-2 text-sm text-danger">
          {create.error.message}
        </p>
      )}
      {!rows || rows.length === 0 ? (
        <EmptyState title={`No ${pluralLabel.toLowerCase()} yet`} icon={Plus} />
      ) : (
        <ul className="rounded-lg border bg-card px-3">
          {rows.map((r) => (
            <Item key={r.id} row={r} resource={resource} />
          ))}
        </ul>
      )}
    </div>
  );
}
