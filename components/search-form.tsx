"use client";

import * as React from "react";
import {
  Search,
  Sparkles,
  ChevronDown,
  KeyRound,
  Loader2,
} from "lucide-react";
import type { SearchParams } from "@/lib/fda";
import { Button, Field, inputClass } from "./ui";
import { cn } from "@/lib/utils";

const PRESETS: { label: string; params: SearchParams }[] = [
  { label: "Insulin pumps", params: { genericName: "Insulin Pump" } },
  { label: "Surgical staplers (code GDW)", params: { productCode: "GDW" } },
  { label: "Coronary stents", params: { genericName: "Stent, Coronary" } },
  { label: "Hip implants", params: { genericName: "Prosthesis, Hip" } },
  { label: "Da Vinci robots", params: { brandName: "da Vinci" } },
];

const EVENT_TYPES = [
  { value: "", label: "Any event type" },
  { value: "Death", label: "Death" },
  { value: "Injury", label: "Injury" },
  { value: "Malfunction", label: "Malfunction" },
  { value: "Other", label: "Other" },
];

export function SearchForm({
  onSearch,
  loading,
}: {
  onSearch: (params: SearchParams) => void;
  loading: boolean;
}) {
  const [form, setForm] = React.useState<SearchParams>({
    productCode: "",
    brandName: "",
    genericName: "",
    manufacturer: "",
    startDate: "",
    endDate: "",
    maxRecords: 500,
    apiKey: "",
    eventType: "",
  });
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const set = (k: keyof SearchParams, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    onSearch(form);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Product code" hint="e.g. GDW, LWS — comma-separated">
          <input
            className={inputClass}
            placeholder="GDW, DXY"
            value={form.productCode}
            onChange={(e) => set("productCode", e.target.value)}
          />
        </Field>
        <Field label="Brand name" hint="Exact device brand">
          <input
            className={inputClass}
            placeholder="da Vinci"
            value={form.brandName}
            onChange={(e) => set("brandName", e.target.value)}
          />
        </Field>
        <Field label="Device type" hint="Generic / FDA device name">
          <input
            className={inputClass}
            placeholder="Insulin Pump"
            value={form.genericName}
            onChange={(e) => set("genericName", e.target.value)}
          />
        </Field>
        <Field label="Manufacturer" hint="Company name (prefix match)">
          <input
            className={inputClass}
            placeholder="Medtronic"
            value={form.manufacturer}
            onChange={(e) => set("manufacturer", e.target.value)}
          />
        </Field>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((s) => !s)}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--color-brand)]"
      >
        <ChevronDown
          className={cn("size-4 transition-transform", showAdvanced && "rotate-180")}
        />
        {showAdvanced ? "Hide" : "Show"} advanced filters
      </button>

      {showAdvanced ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up">
          <Field label="Date received — from">
            <input
              type="date"
              className={inputClass}
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </Field>
          <Field label="Date received — to">
            <input
              type="date"
              className={inputClass}
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </Field>
          <Field label="Event type">
            <select
              className={inputClass}
              value={form.eventType}
              onChange={(e) => set("eventType", e.target.value)}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Max records" hint="Up to 25,000">
            <input
              type="number"
              min={1}
              max={25000}
              className={inputClass}
              value={form.maxRecords}
              onChange={(e) => set("maxRecords", Number(e.target.value))}
            />
          </Field>
          <Field
            label="openFDA API key (optional)"
            hint="Doubles batch size & rate limit"
          >
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                className={cn(inputClass, "pl-9")}
                placeholder="Paste key"
                value={form.apiKey}
                onChange={(e) => set("apiKey", e.target.value)}
              />
            </div>
          </Field>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-medium text-[var(--color-muted)]">
          <Sparkles className="size-3.5" /> Try:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setForm((f) => ({
                ...f,
                productCode: "",
                brandName: "",
                genericName: "",
                manufacturer: "",
                ...p.params,
              }));
            }}
            className="rounded-full border bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-ink-soft)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="min-w-40">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Querying openFDA…
            </>
          ) : (
            <>
              <Search className="size-4" /> Search reports
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
