import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/common/empty-state";
import { Clock } from "lucide-react";
import type { AgeingReportDto } from "@/lib/api/types";

export function AgeingChart({ data }: { data: AgeingReportDto }) {
  if (data.every((d) => d.count === 0)) {
    return (
      <EmptyState
        icon={Clock}
        title="No open cases"
        description="Case age buckets appear here once there are open cases."
      />
    );
  }

  return (
    <div>
      <div className="h-[260px] min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table data-chart-table className="mt-4 w-full text-sm">
        <caption className="sr-only">Case ageing by bucket (days)</caption>
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-1">Bucket (days)</th>
            <th className="py-1">Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.bucket} className="border-b">
              <td className="py-1">{d.bucket}</td>
              <td className="py-1">{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
