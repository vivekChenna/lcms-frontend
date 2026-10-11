import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/common/empty-state";
import { Building2 } from "lucide-react";
import type { VolumeByOrganisationReportDto } from "@/lib/api/types";
import { GRID, axisProps, TOOLTIP } from "./chart-theme";

export function VolumeByOrganisationChart({ data }: { data: VolumeByOrganisationReportDto }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No cases"
        description="Volume by entity, business unit and department appears here."
      />
    );
  }
  const rows = data.map((d) => ({ ...d, label: d.departmentName }));

  return (
    <div>
      <div className="h-[280px] min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid {...GRID} />
            <XAxis
              dataKey="label"
              {...axisProps(10)}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={80}
            />
            <YAxis allowDecimals={false} width={28} {...axisProps(11)} />
            <Tooltip {...TOOLTIP} />
            <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table data-chart-table className="mt-4 w-full text-sm">
        <caption className="sr-only">Volume by entity, business unit and department</caption>
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-1">Entity</th>
            <th className="py-1">Business unit</th>
            <th className="py-1">Department</th>
            <th className="py-1">Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={`${d.entityId}-${d.businessUnitId}-${d.departmentId}`} className="border-b">
              <td className="py-1">{d.entityName}</td>
              <td className="py-1">{d.businessUnitName ?? "—"}</td>
              <td className="py-1">{d.departmentName}</td>
              <td className="py-1">{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
