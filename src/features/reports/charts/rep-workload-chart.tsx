import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/common/empty-state";
import { Users } from "lucide-react";
import type { RepWorkloadReportDto } from "@/lib/api/types";
import { GRID, axisProps, TOOLTIP, LEGEND_STYLE } from "./chart-theme";

export function RepWorkloadChart({ data }: { data: RepWorkloadReportDto }) {
  if (data.length === 0) {
    return (
      <EmptyState icon={Users} title="No legal reps" description="Per-rep workload appears here." />
    );
  }

  return (
    <div>
      <div className="h-[280px] min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid {...GRID} />
            <XAxis
              dataKey="fullName"
              {...axisProps(10)}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={80}
            />
            <YAxis allowDecimals={false} width={28} {...axisProps(11)} />
            <Tooltip {...TOOLTIP} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Bar
              dataKey="openCount"
              name="Open"
              fill="var(--color-primary)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="awaitingAcceptanceCount"
              name="Awaiting acceptance"
              fill="var(--color-warning)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="overdueCount"
              name="Overdue"
              fill="var(--color-danger)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table data-chart-table className="mt-4 w-full text-sm">
        <caption className="sr-only">Legal rep workload</caption>
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-1">Rep</th>
            <th className="py-1">Open</th>
            <th className="py-1">Awaiting acceptance</th>
            <th className="py-1">Overdue</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.legalRepId} className="border-b">
              <td className="py-1">{d.fullName}</td>
              <td className="py-1">{d.openCount}</td>
              <td className="py-1">{d.awaitingAcceptanceCount}</td>
              <td className="py-1">{d.overdueCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
