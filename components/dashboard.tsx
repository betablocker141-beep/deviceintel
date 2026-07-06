"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  Boxes,
  Download,
  FileSpreadsheet,
  HeartPulse,
  Skull,
  Users,
  Wrench,
  BarChart3,
  PieChart as PieIcon,
  Building2,
  Stethoscope,
  ClipboardList,
  Factory,
  TrendingUp,
} from "lucide-react";
import type { Analytics } from "@/lib/analytics";
import type { FdaEvent } from "@/lib/fda";
import { Badge, Button, Card, CardHeader } from "./ui";
import {
  BrandEventTypeChart,
  EventTypeDonut,
  HorizontalBars,
  TimelineArea,
} from "./charts";
import { CountTable, DemographicsTable, RecentEventsTable } from "./tables";
import { formatNumber } from "@/lib/utils";

export interface SearchResponse {
  events: FdaEvent[];
  analytics: Analytics;
  total: number;
  fetched: number;
  truncated: boolean;
  query: string;
}

function Kpi({
  label,
  value,
  icon,
  tone = "brand",
  sub,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "brand" | "death" | "injury" | "malfunction" | "ok";
  sub?: string;
}) {
  const ring: Record<string, string> = {
    brand: "text-[var(--color-brand)] bg-[var(--color-brand-50)]",
    death: "text-[var(--color-death)] bg-red-500/10",
    injury: "text-[var(--color-injury)] bg-orange-500/10",
    malfunction: "text-[var(--color-malfunction)] bg-yellow-500/10",
    ok: "text-[var(--color-ok)] bg-emerald-500/10",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className={`grid size-10 place-items-center rounded-xl ${ring[tone]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-[var(--color-ink)]">
        {formatNumber(value)}
      </p>
      <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">{label}</p>
      {sub ? <p className="mt-0.5 text-xs text-[var(--color-muted)]">{sub}</p> : null}
    </Card>
  );
}

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "devices", label: "Devices & Makers", icon: Factory },
  { id: "problems", label: "Problems & Outcomes", icon: ClipboardList },
  { id: "patients", label: "Demographics", icon: Users },
  { id: "reports", label: "Reports", icon: FileSpreadsheet },
] as const;

export function Dashboard({ data }: { data: SearchResponse }) {
  const { analytics: a } = data;
  const [tab, setTab] = React.useState<(typeof TABS)[number]["id"]>("overview");
  const [exporting, setExporting] = React.useState(false);

  const exportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: data.events }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DeviceIntel_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      {/* Result banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone="ok">
            <Activity className="size-3.5" /> {formatNumber(data.fetched)} reports analyzed
          </Badge>
          {data.total > data.fetched ? (
            <Badge tone="neutral">
              of {formatNumber(data.total)} matched · showing most recent
            </Badge>
          ) : (
            <Badge tone="neutral">{formatNumber(data.total)} total matched</Badge>
          )}
          <span className="font-mono text-xs text-[var(--color-muted)]">
            {data.query.length > 70 ? data.query.slice(0, 70) + "…" : data.query}
          </span>
        </div>
        <Button onClick={exportExcel} disabled={exporting} variant="outline" size="sm">
          <Download className="size-4" />
          {exporting ? "Building…" : "Export Excel"}
        </Button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Reports" value={a.totalReports} icon={<FileSpreadsheet className="size-5" />} />
        <Kpi label="Devices" value={a.totalDevices} icon={<Boxes className="size-5" />} />
        <Kpi label="Patients" value={a.totalPatients} icon={<Users className="size-5" />} />
        <Kpi label="Deaths" value={a.deathCount} icon={<Skull className="size-5" />} tone="death" />
        <Kpi label="Injuries" value={a.injuryCount} icon={<AlertTriangle className="size-5" />} tone="injury" />
        <Kpi label="Malfunctions" value={a.malfunctionCount} icon={<Wrench className="size-5" />} tone="malfunction" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-2xl border bg-[var(--color-surface)] p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[var(--color-brand)] text-white shadow-[0_8px_20px_-10px_var(--color-brand)]"
                  : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)]"
              }`}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panels */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Event type distribution" icon={<PieIcon className="size-4" />} />
            <div className="p-4">
              <EventTypeDonut data={a.eventTypes} />
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Reports over time"
              subtitle="By month received"
              icon={<TrendingUp className="size-4" />}
            />
            <div className="p-4">
              <TimelineArea data={a.timeline} />
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader
              title="Event types by brand"
              subtitle="Top 10 brands, stacked by outcome"
              icon={<BarChart3 className="size-4" />}
            />
            <div className="p-4">
              <BrandEventTypeChart chart={a.brandByEventType} />
            </div>
          </Card>
        </div>
      )}

      {tab === "devices" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Top manufacturers" icon={<Building2 className="size-4" />} />
            <div className="p-4">
              <HorizontalBars data={a.manufacturers} color="#8b5cf6" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Top brand names" icon={<Boxes className="size-4" />} />
            <div className="p-4">
              <HorizontalBars data={a.brandNames} color="#2563eb" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Product codes" icon={<FileSpreadsheet className="size-4" />} />
            <CountTable rows={a.productCodes} />
          </Card>
          <Card>
            <CardHeader title="Device types (generic)" icon={<Stethoscope className="size-4" />} />
            <CountTable rows={a.genericNames} />
          </Card>
        </div>
      )}

      {tab === "problems" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Device problems" icon={<Wrench className="size-4" />} />
            <div className="p-4">
              <HorizontalBars data={a.productProblems} color="#ea580c" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Patient problems" icon={<HeartPulse className="size-4" />} />
            <div className="p-4">
              <HorizontalBars data={a.patientProblems} color="#dc2626" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Patient outcomes" icon={<HeartPulse className="size-4" />} />
            <CountTable rows={a.patientOutcomes} />
          </Card>
          <Card>
            <CardHeader title="Report sources" icon={<ClipboardList className="size-4" />} />
            <CountTable rows={a.reportSources} />
          </Card>
        </div>
      )}

      {tab === "patients" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Patient demographics"
              subtitle="Age, weight, sex, ethnicity & race"
              icon={<Users className="size-4" />}
            />
            <DemographicsTable rows={a.demographics} />
          </Card>
          <Card>
            <CardHeader title="Reporter occupations" icon={<Stethoscope className="size-4" />} />
            <CountTable rows={a.occupations} />
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Manufacturer countries" icon={<Factory className="size-4" />} />
            <CountTable rows={a.manufacturerCountries} />
          </Card>
        </div>
      )}

      {tab === "reports" && (
        <Card className="overflow-hidden">
          <CardHeader
            title="Individual reports"
            subtitle={`Showing up to 60 of ${formatNumber(data.fetched)} downloaded reports`}
            icon={<FileSpreadsheet className="size-4" />}
            action={
              <Button onClick={exportExcel} disabled={exporting} size="sm" variant="ghost">
                <Download className="size-4" /> All to Excel
              </Button>
            }
          />
          <div className="mt-3 max-h-[560px] overflow-auto border-t border-[var(--color-border)]">
            <RecentEventsTable events={data.events} />
          </div>
        </Card>
      )}
    </div>
  );
}
