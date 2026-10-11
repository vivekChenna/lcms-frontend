// Recharts draws with its own defaults (a light-grey grid, white tooltip, dark-grey labels), which
// are unreadable on a dark page. These props point every chart at the app's theme variables
// instead, so axes, grid, hover highlight and tooltip follow light and dark mode.

export const GRID = {
  strokeDasharray: "3 3",
  vertical: false,
  stroke: "var(--border)",
} as const;

/** Axis styling: label colour and line colour from the theme; pass the label size. */
export const axisProps = (fontSize: number) =>
  ({
    tick: { fontSize, fill: "var(--muted-foreground)" },
    axisLine: { stroke: "var(--border)" },
    tickLine: { stroke: "var(--border)" },
  }) as const;

export const TOOLTIP = {
  cursor: { fill: "var(--muted)", opacity: 0.5 },
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--popover-foreground)",
    boxShadow: "0 8px 24px -12px rgb(0 0 0 / 0.4)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--popover-foreground)", fontWeight: 600 },
  itemStyle: { color: "var(--popover-foreground)" },
} as const;

export const LEGEND_STYLE = { color: "var(--muted-foreground)", fontSize: 12 } as const;
