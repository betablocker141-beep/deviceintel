"use client";

import type { CountRow, DemographicRow } from "@/lib/analytics";
import type { FdaEvent } from "@/lib/fda";
import { EVENT_TYPE_LABELS, translate } from "@/lib/fda-codes";
import { formatFdaDate } from "@/lib/utils";
import { Badge } from "./ui";

export function CountTable({ rows }: { rows: CountRow[] }) {
  const max = rows.length ? rows[0].count : 1;
  if (!rows.length)
    return <p className="px-5 py-6 text-sm text-[var(--color-muted)]">No data.</p>;
  return (
    <div className="px-2 pb-2">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="group">
              <td className="relative py-2 pl-3 pr-2">
                <div
                  className="absolute inset-y-1 left-1 rounded-md bg-[var(--color-brand-50)] transition-all"
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
                <span className="relative font-medium text-[var(--color-ink)]">
                  {r.label}
                </span>
              </td>
              <td className="whitespace-nowrap py-2 pr-2 text-right tabular-nums text-[var(--color-ink-soft)]">
                {r.count.toLocaleString()}
              </td>
              <td className="whitespace-nowrap py-2 pr-3 text-right text-xs tabular-nums text-[var(--color-muted)]">
                {r.percent.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DemographicsTable({ rows }: { rows: DemographicRow[] }) {
  if (!rows.length)
    return (
      <p className="px-5 py-6 text-sm text-[var(--color-muted)]">
        No patient demographic data in this result set.
      </p>
    );
  return (
    <div className="overflow-x-auto px-2 pb-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
            <th className="px-3 py-2 font-medium">Characteristic</th>
            <th className="px-3 py-2 font-medium">Value</th>
            <th className="px-3 py-2 text-right font-medium">n</th>
            <th className="px-3 py-2 text-right font-medium">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-[var(--color-border)]/60">
              <td className="px-3 py-2 font-medium text-[var(--color-ink)]">
                {r.characteristic}
              </td>
              <td className="px-3 py-2 text-[var(--color-ink-soft)]">{r.value}</td>
              <td className="px-3 py-2 text-right tabular-nums text-[var(--color-ink-soft)]">
                {r.frequency}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-[var(--color-muted)]">
                {r.percentage}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function eventTone(type?: string) {
  const t = (type ?? "").toLowerCase();
  if (t === "death" || t === "d") return "death" as const;
  if (t === "injury" || t === "in" || t === "il") return "injury" as const;
  if (t === "malfunction" || t === "m") return "malfunction" as const;
  return "neutral" as const;
}

export function RecentEventsTable({ events }: { events: FdaEvent[] }) {
  const rows = events.slice(0, 60);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="sticky top-0 bg-[var(--color-surface)]">
          <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
            <th className="px-4 py-3 font-medium">Report #</th>
            <th className="px-4 py-3 font-medium">Event</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Brand</th>
            <th className="px-4 py-3 font-medium">Manufacturer</th>
            <th className="px-4 py-3 font-medium">Device Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((ev, i) => {
            const d = ev.device?.[0];
            return (
              <tr
                key={`${ev.report_number}-${i}`}
                className="border-t border-[var(--color-border)]/60 transition hover:bg-[var(--color-surface-2)]"
              >
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-[var(--color-ink-soft)]">
                  {ev.report_number || "—"}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={eventTone(ev.event_type)}>
                    {translate(EVENT_TYPE_LABELS, ev.event_type) || "—"}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-[var(--color-ink-soft)]">
                  {formatFdaDate(ev.date_received) || "—"}
                </td>
                <td className="max-w-[180px] truncate px-4 py-2.5 text-[var(--color-ink)]">
                  {d?.brand_name || "—"}
                </td>
                <td className="max-w-[200px] truncate px-4 py-2.5 text-[var(--color-ink-soft)]">
                  {d?.manufacturer_d_name || "—"}
                </td>
                <td className="max-w-[200px] truncate px-4 py-2.5 text-[var(--color-ink-soft)]">
                  {d?.generic_name || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
