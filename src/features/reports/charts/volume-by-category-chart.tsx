import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/common/empty-state";
import { FolderTree } from "lucide-react";
import type { VolumeByCategoryReportDto } from "@/lib/api/types";

export function VolumeByCategoryChart({ data }: { data: VolumeByCategoryReportDto }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={FolderTree}
        title="No cases"
        description="Volume by category and type appears here."
      />
    );
  }
  const rows = data.map((d) => ({ ...d, label: `${d.categoryName} / ${d.caseTypeName}` }));

  return (
    <div>
      <div className="h-[280px] min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={80}
            />
            <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table data-chart-table className="mt-4 w-full text-sm">
        <caption className="sr-only">Volume by category and case type</caption>
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-1">Category</th>
            <th className="py-1">Case type</th>
            <th className="py-1">Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={`${d.categoryId}-${d.caseTypeId}`} className="border-b">
              <td className="py-1">{d.categoryName}</td>
              <td className="py-1">{d.caseTypeName}</td>
              <td className="py-1">{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
