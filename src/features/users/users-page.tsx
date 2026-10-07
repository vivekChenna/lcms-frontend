import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { UserPlus, Users as UsersIcon } from "lucide-react";
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
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { FilterSheet } from "@/components/common/filter-sheet";
import { PageHeader } from "@/components/common/page-header";
import { Pagination } from "@/components/common/pagination";
import { ResponsiveTable, type Column } from "@/components/common/responsive-table";
import { useMe } from "@/lib/auth";
import type { UserDto, UserRole } from "@/lib/api/types";
import { nameOf, useBusinessUnits, useDepartments, useEntities } from "@/lib/queries/lookups";
import { ROLE_LABEL } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { RoleDialog } from "./role-dialog";
import { UserFormDialog } from "./user-form-dialog";
import { useSetActive, useUsers, type UsersFilters } from "./use-users";

const ALL = "__all__";
const ROLES: UserRole[] = ["admin", "legal_manager", "legal_rep", "requester", "viewer"];

type Search = {
  search?: string | undefined;
  role?: UserRole | undefined;
  isActive?: boolean | undefined;
  page?: number | undefined;
};

export function UsersPage() {
  const me = useMe();
  const search = useSearch({ strict: false }) as Search;
  const navigate = useNavigate();
  const departments = useDepartments();
  const entities = useEntities();
  const businessUnits = useBusinessUnits();

  const [searchInput, setSearchInput] = useState(search.search ?? "");
  useEffect(() => setSearchInput(search.search ?? ""), [search.search]);
  useEffect(() => {
    const id = setTimeout(() => {
      if ((search.search ?? "") !== searchInput)
        void setSearch({ search: searchInput || undefined });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const filters: UsersFilters = {
    search: search.search,
    role: search.role,
    isActive: search.isActive,
    page: search.page ?? 1,
  };
  const { data, isPending, isError, error, refetch } = useUsers(filters);

  const setSearch = (patch: Partial<Search>) =>
    void navigate({ to: ".", search: { ...search, ...patch, page: 1 } as never });
  const clear = () => void navigate({ to: ".", search: {} as never });
  const setPage = (next: number) =>
    void navigate({ to: ".", search: { ...search, page: next } as never });

  const [formUser, setFormUser] = useState<UserDto | null | undefined>(undefined);
  const [roleTarget, setRoleTarget] = useState<UserDto | null>(null);
  const [resetTarget, setResetTarget] = useState<UserDto | null>(null);
  const [activeTarget, setActiveTarget] = useState<{ user: UserDto; next: boolean } | null>(null);

  const canEdit = !!me && can.editUsers(me.role);
  const setActive = useSetActive(activeTarget?.user.id ?? "");

  if (isPending) return null;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const columns: Column<UserDto>[] = [
    { key: "name", header: "Name", cell: (u) => u.fullName },
    { key: "email", header: "Email", cell: (u) => u.email },
    { key: "designation", header: "Designation", cell: (u) => u.designation ?? "—" },
    { key: "role", header: "Role", cell: (u) => ROLE_LABEL[u.role] },
    {
      key: "department",
      header: "Department",
      cell: (u) => nameOf(departments.data, u.departmentId),
    },
    { key: "entity", header: "Entity", cell: (u) => nameOf(entities.data, u.entityId) },
    {
      key: "businessUnit",
      header: "Business unit",
      cell: (u) => nameOf(businessUnits.data, u.businessUnitId),
    },
    {
      key: "status",
      header: "Status",
      cell: (u) => (
        <Badge variant={u.isActive ? "outline" : "secondary"}>
          {u.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    ...(canEdit
      ? [
          {
            key: "actions",
            header: "",
            cell: (u: UserDto) => (
              <div className="flex flex-wrap gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setFormUser(u)}>
                  Edit
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setRoleTarget(u)}>
                  Role
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setResetTarget(u)}>
                  Reset password
                </Button>
                {u.id !== me?.id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTarget({ user: u, next: !u.isActive })}
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
                  </Button>
                )}
              </div>
            ),
          } as Column<UserDto>,
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage who can access the system and what they can do."
        actions={
          canEdit && (
            <Button type="button" size="sm" onClick={() => setFormUser(null)}>
              <UserPlus />
              New user
            </Button>
          )
        }
      />

      <FilterSheet
        activeCount={Object.values(filters).filter((v) => v !== undefined && v !== 1).length}
        onClear={clear}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="users-search">Search</Label>
            <Input
              id="users-search"
              className="mt-1 h-11 lg:h-9"
              placeholder="Name or email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="users-role">Role</Label>
            <Select
              value={search.role ?? ALL}
              onValueChange={(v) => setSearch({ role: v === ALL ? undefined : (v as UserRole) })}
            >
              <SelectTrigger id="users-role" className="mt-1 h-11 lg:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="users-status">Status</Label>
            <Select
              value={search.isActive === undefined ? ALL : String(search.isActive)}
              onValueChange={(v) => setSearch({ isActive: v === ALL ? undefined : v === "true" })}
            >
              <SelectTrigger id="users-status" className="mt-1 h-11 lg:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FilterSheet>

      <div className="mt-4">
        {data.items.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users match these filters" />
        ) : (
          <ResponsiveTable
            columns={columns}
            rows={data.items}
            rowKey={(u) => u.id}
            renderCard={(u) => (
              <div className="space-y-1">
                <p className="font-medium">{u.fullName}</p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{ROLE_LABEL[u.role]}</Badge>
                  <Badge variant={u.isActive ? "outline" : "secondary"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {canEdit && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormUser(u)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRoleTarget(u)}
                    >
                      Role
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setResetTarget(u)}
                    >
                      Reset password
                    </Button>
                    {u.id !== me?.id && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTarget({ user: u, next: !u.isActive })}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          />
        )}
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={setPage}
        />
      </div>

      {formUser !== undefined && (
        <UserFormDialog
          user={formUser}
          open={formUser !== undefined}
          onOpenChange={(open) => !open && setFormUser(undefined)}
        />
      )}
      {roleTarget && (
        <RoleDialog
          user={roleTarget}
          open={!!roleTarget}
          onOpenChange={(open) => !open && setRoleTarget(null)}
        />
      )}
      {resetTarget && (
        <ResetPasswordDialog
          user={resetTarget}
          open={!!resetTarget}
          onOpenChange={(open) => !open && setResetTarget(null)}
        />
      )}
      <ConfirmDialog
        open={!!activeTarget}
        title={activeTarget?.next ? "Activate this user?" : "Deactivate this user?"}
        description={
          activeTarget?.next
            ? `${activeTarget.user.fullName} will be able to sign in again.`
            : `${activeTarget?.user.fullName} will be signed out and unable to sign in.`
        }
        confirmLabel={activeTarget?.next ? "Activate" : "Deactivate"}
        destructive={!activeTarget?.next}
        pending={setActive.isPending}
        onConfirm={() => {
          if (activeTarget)
            setActive.mutate(activeTarget.next, { onSuccess: () => setActiveTarget(null) });
        }}
        onOpenChange={(open) => !open && setActiveTarget(null)}
      />
    </div>
  );
}
