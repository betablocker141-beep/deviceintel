"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  Layers,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import type { SearchParams } from "@/lib/fda";
import { SearchForm } from "@/components/search-form";
import { Dashboard, type SearchResponse } from "@/components/dashboard";
import { Card, CardHeader } from "@/components/ui";

export default function Home() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<SearchResponse | null>(null);

  const runSearch = async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Search failed.");
        setData(null);
      } else {
        setData(json as SearchResponse);
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-cyan-500 text-white shadow-[0_10px_30px_-10px_var(--color-brand)]">
            <Stethoscope className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--color-ink)]">
              Device<span className="text-[var(--color-brand)]">Intel</span>
            </h1>
            <p className="text-xs text-[var(--color-muted)]">
              FDA Medical Device Intelligence
            </p>
          </div>
        </div>
        <Link
          href="/codes"
          className="flex items-center gap-2 rounded-xl border bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-ink-soft)] transition hover:text-[var(--color-brand)]"
        >
          <Layers className="size-4" /> IMDRF codes
        </Link>
      </header>

      {/* Hero (only before first result) */}
      {!data && !loading ? (
        <section className="animate-fade-up text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-brand)]">
            <Activity className="size-3.5" /> Live medical-device data from the FDA openFDA API
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">
            Medical-device adverse events, turned into intelligence
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-[var(--color-ink-soft)]">
            Search millions of device safety reports, surface signals across
            manufacturers and products, and export analysis-ready spreadsheets —
            no installation required.
          </p>
        </section>
      ) : null}

      {/* Search card */}
      <Card className="p-5 sm:p-6">
        <CardHeader
          title="Search device reports"
          subtitle="Filter by product code, brand, device type, manufacturer, or date range"
          icon={<Stethoscope className="size-4" />}
        />
        <div className="mt-5">
          <SearchForm onSearch={runSearch} loading={loading} />
        </div>
      </Card>

      {/* Error */}
      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-death)]/30 bg-red-500/5 p-4 text-sm text-[var(--color-death)] animate-fade-up">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Search error</p>
            <p className="text-[var(--color-ink-soft)]">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Loading skeleton */}
      {loading ? <LoadingState /> : null}

      {/* Results */}
      {data && !loading ? <Dashboard data={data} /> : null}

      {/* Footer */}
      <footer className="mt-auto flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 text-xs text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-[var(--color-injury)]" />
          For research and educational purposes only. Not for clinical
          decision-making.
        </p>
        <span className="text-[var(--color-muted)]">
          DeviceIntel · data via the FDA openFDA API
        </span>
      </footer>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-[var(--radius-card)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="skeleton h-72 rounded-[var(--radius-card)]" />
        <div className="skeleton h-72 rounded-[var(--radius-card)]" />
      </div>
      <p className="text-center text-sm text-[var(--color-muted)]">
        Fetching and analyzing reports from the FDA openFDA API…
      </p>
    </div>
  );
}
