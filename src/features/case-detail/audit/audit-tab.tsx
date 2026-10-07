import { useState } from "react";
import { History } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Pagination } from "@/components/common/pagination";
import { formatDateTime } from "@/lib/format";
import { describe } from "./describe";
import { useCaseAudit } from "./use-case-audit";

export function AuditTab({ caseId }: { caseId: string }) {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = useCaseAudit(caseId, page);

  if (isPending) return null;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  if (data.items.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No activity yet"
        description="Case activity appears here."
      />
    );
  }

  return (
    <div>
      <ol className="space-y-3">
        {data.items.map((row) => (
          <li key={row.id} className="rounded-lg border bg-card p-3">
            <p>
              <span className="font-medium">{row.actorName ?? "Someone"}</span>
              {row.actorRole && (
                <span className="text-muted-foreground"> ({row.actorRole})</span>
              )}{" "}
              {describe(row)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(row.createdAt)}</p>
          </li>
        ))}
      </ol>
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={setPage}
      />
    </div>
  );
}
