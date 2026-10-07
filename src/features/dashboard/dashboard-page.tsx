import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { useMe } from "@/lib/auth";
import { isLegal } from "@/lib/permissions";
import { useDashboard } from "./use-dashboard";
import { TilesSkeletonGrid, Tiles } from "./tiles";
import { StatusChart } from "./status-chart";
import { MyAssignedCases } from "./case-panel";
import { ManagerPanels } from "./manager-panels";

export function DashboardPage() {
  const me = useMe();
  const { data, isPending, isError, error, refetch } = useDashboard();

  return (
    <div>
      <PageHeader title="Dashboard" description="Your caseload and SLA overview." />

      {isPending && me && <TilesSkeletonGrid role={me.role} />}
      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {data && me && (
        <div className="space-y-6">
          <Tiles data={data} role={me.role} />
          <StatusChart byStatus={data.byStatus} />
          {me.role === "legal_rep" && <MyAssignedCases items={data.myAssignedCases ?? []} />}
          {isLegal(me.role) && data.managerPanels && <ManagerPanels panels={data.managerPanels} />}
        </div>
      )}
    </div>
  );
}
