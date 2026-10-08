import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { UserPlus, Users as UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ResultsRegion } from "@/components/common/results-region";
import { SearchInput } from "@/components/common/search-input";
import { useDebouncedField } from "@/hooks/use-debounced-field";
import { useMe } from "@/lib/auth";
import type { UserDto, UserRole } from "@/lib/api/types";
import { nameOf, useBusinessUnits, useDepartments, useEntities } from "@/lib/queries/lookups";
import { ROLE_LABEL } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { UserRowMenu } from "./user-row-menu";
import { SendLinkDialog } from "./send-link-dialog";
import { RoleDialog } from "./role-dialog";
import { UserFormDialog } from "./user-form-dialog";
import { useSetActive, useUsers, type UsersFilters } from "./use-users";

const ALL = "__all__";
const ROLES: UserRole[] = ["admin", "legal_manager", "legal_rep", "requester", "viewer"];

/** Active, Inactive, or Invited (added by an admin, has not chosen a password yet). */
function StatusBadge({ user }: { user: UserDto }) {
  if (!user.isActive) return <Badge variant="secondary">Inactive</Badge>;
  if (user.isInvited)
    return (
      <Badge variant="outline" className="border-warning/40 bg-warning/15 text-warning-foreground">
        Invited
      </Badge>
    );
  return <Badge variant="outline">Active</Badge>;
}

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

  const {
    text: searchInput,
    setText: setSearchInput,
    waiting: searchWaiting,
  } = useDebouncedField(search.search ?? "", (value) => setSearch({ search: value || undefined }));

  const filters: UsersFilters = {
    search: search.search,
    role: search.role,
    isActive: search.isActive,
    page: search.page ?? 1,
  };
  const { data, isPending, isFetching, isError, error, refetch } = useUsers(filters);

  const setSearch = (patch: Partial<Search>) =>
    void navigate({ to: ".", search: { ...search, ...patch, page: 1 } as never });
  const clear = () => void navigate({ to: ".", search: {} as never });
  const setPage = (next: number) =>
    void navigate({ to: ".", search: { ...search, page: next } as never });

  const [formUser, setFormUser] = useState<UserDto | null | undefined>(undefined);
  const [roleTarget, setRoleTarget] = useState<UserDto | null>(null);
  const [linkTarget, setLinkTarget] = useState<UserDto | null>(null);
  const [activeTarget, setActiveTarget] = useState<{ user: UserDto; next: boolean } | null>(null);

  const canEdit = !!me && can.editUsers(me.role);
  const setActive = useSetActive(activeTarget?.user.id ?? "");

  // The page chrome (filters included) always renders; only the results wait for data.
  if (isError && !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  // department first, then "entity · business unit"; blanks dropped
  const organisation = (u: UserDto) =>
    [
      nameOf(departments.data, u.departmentId),
      nameOf(entities.data, u.entityId),
      nameOf(businessUnits.data, u.businessUnitId),
    ].filter((part) => part !== "—");

  const rowMenu = (u: UserDto) => (
    <UserRowMenu
      user={u}
      isSelf={u.id === me?.id}
      onEdit={() => setFormUser(u)}
      onRole={() => setRoleTarget(u)}
      onSendLink={() => setLinkTarget(u)}
      onToggleActive={() => setActiveTarget({ user: u, next: !u.isActive })}
    />
  );

  const columns: Column<UserDto>[] = [
    {
      key: "user",
      header: "User",
      truncate: "max-w-64",
      title: (u) => `${u.fullName} · ${u.email}`,
      cell: (u) => (
        <>
          <p className="truncate font-medium">{u.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
        </>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (u) => (
        <>
          <p>{ROLE_LABEL[u.role]}</p>
          {u.designation && <p className="text-xs text-muted-foreground">{u.designation}</p>}
        </>
      ),
    },
    {
      key: "organisation",
      header: "Organisation",
      truncate: "max-w-56",
      title: (u) => organisation(u).join(" · ") || undefined,
      cell: (u) => {
        const [department, ...rest] = organisation(u);
        return department ? (
          <>
            <p className="truncate">{department}</p>
            {rest.length > 0 && (
              <p className="truncate text-xs text-muted-foreground">{rest.join(" · ")}</p>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (u) => <StatusBadge user={u} />,
    },
    ...(canEdit
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Actions</span>,
            sticky: true,
            className: "w-px text-right",
            cell: (u: UserDto) => rowMenu(u),
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
            <SearchInput
              id="users-search"
              className="mt-1 h-11 lg:h-9"
              placeholder="Name or email"
              value={searchInput}
              busy={searchWaiting || (isFetching && !isPending)}
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
        <ResultsRegion label="users" initialLoading={isPending} fetching={isFetching && !isPending}>
          {data &&
            (data.items.length === 0 ? (
              <EmptyState icon={UsersIcon} title="No users match these filters" />
            ) : (
              <ResponsiveTable
                columns={columns}
                rows={data.items}
                rowKey={(u) => u.id}
                renderCard={(u) => (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium">{u.fullName}</p>
                      <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge variant="outline">{ROLE_LABEL[u.role]}</Badge>
                        <StatusBadge user={u} />
                      </div>
                      {organisation(u).length > 0 && (
                        <p className="truncate text-xs text-muted-foreground">
                          {organisation(u).join(" · ")}
                        </p>
                      )}
                    </div>
                    {canEdit && <div className="shrink-0">{rowMenu(u)}</div>}
                  </div>
                )}
              />
            ))}
          {data && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          )}
        </ResultsRegion>
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
      {linkTarget && (
        <SendLinkDialog
          user={linkTarget}
          open={!!linkTarget}
          onOpenChange={(open) => !open && setLinkTarget(null)}
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
