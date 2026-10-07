import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SlaComplianceReportDto } from "@/lib/api/types";

export function SlaComplianceChart({ data }: { data: SlaComplianceReportDto }) {
  const rows = [
    { label: "Closed on time", count: data.closedOnTime },
    { label: "Closed late", count: data.closedLate },
    { label: "Open on track", count: data.openOnTrack },
    { label: "Open at risk", count: data.openAtRisk },
    { label: "Open breached", count: data.openBreached },
  ];

  return (
    <div>
      <p className="mb-3 text-2xl font-semibold">
        {data.compliancePercent === null
          ? "No closed cases yet"
          : `${data.compliancePercent}% compliant`}
      </p>
      <div className="h-[260px] min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="mt-4 w-full text-sm">
        <caption className="sr-only">SLA compliance</caption>
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-1">Metric</th>
            <th className="py-1">Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b">
              <td className="py-1">{r.label}</td>
              <td className="py-1">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
