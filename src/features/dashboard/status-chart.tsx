import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CaseStatus } from "@/lib/api/types";
import { STATUS_ORDER } from "@/lib/labels";

type Props = { byStatus: { status: CaseStatus; count: number }[] };

export function StatusChart({ byStatus }: Props) {
  const data = STATUS_ORDER.map((status) => ({
    status,
    count: byStatus.find((s) => s.status === status)?.count ?? 0,
  }));

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-medium">Cases by status</h2>
      {/* overflow-hidden: recharts positions its tooltip portal with absolute coordinates left
          over from before a resize, which can push document.body's scrollWidth past the
          viewport on narrow screens until the tooltip repositions; clipping it here contains it. */}
      <div className="h-[220px] min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="status"
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Cases by status</caption>
        <thead>
          <tr>
            <th>Status</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.status}>
              <td>{d.status}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
