"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from "recharts";
import type { Analytics, CountRow } from "@/lib/analytics";

const PALETTE = [
  "#2563eb",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#64748b",
];

const AXIS = { fontSize: 11, fill: "var(--color-muted)" };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-xs shadow-lg">
      {label ? (
        <p className="mb-1 font-semibold text-[var(--color-ink)]">{label}</p>
      ) : null}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-[var(--color-ink-soft)]">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: p.color }}
          />
          {p.name}: <span className="font-semibold">{p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

export function EventTypeDonut({ data }: { data: CountRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          stroke="var(--color-surface)"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 11, color: "var(--color-ink-soft)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TimelineArea({
  data,
}: {
  data: { month: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="tl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="month" tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={40} />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="count"
          name="Reports"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#tl)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBars({
  data,
  color = "#2563eb",
}: {
  data: CountRow[];
  color?: string;
}) {
  const trimmed = data.slice(0, 10).map((d) => ({
    ...d,
    short: d.label.length > 26 ? d.label.slice(0, 24) + "…" : d.label,
  }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, trimmed.length * 34)}>
      <BarChart
        data={trimmed}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="short"
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={150}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-2)" }} />
        <Bar dataKey="count" name="Reports" radius={[0, 6, 6, 0]} fill={color} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BrandEventTypeChart({
  chart,
}: {
  chart: Analytics["brandByEventType"];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, chart.data.length * 38)}>
      <BarChart
        data={chart.data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="brand"
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={150}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-2)" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        {chart.eventTypes.map((t, i) => (
          <Bar
            key={t}
            dataKey={t}
            stackId="a"
            fill={PALETTE[i % PALETTE.length]}
            radius={i === chart.eventTypes.length - 1 ? [0, 6, 6, 0] : 0}
            barSize={18}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
