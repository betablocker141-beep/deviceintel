"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Layers,
  RefreshCw,
  Search,
  Loader2,
  Database,
} from "lucide-react";
import { Badge, Button, Card, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

interface AnnexCode {
  annex: string;
  imdrfCode: string;
  fdaCode: string;
  ncitCode: string;
  term: string;
  termPath: string;
  definition: string;
  level: number;
  selectable: boolean;
  status: string;
}
interface AnnexTable {
  annex: string;
  title: string;
  release: string;
  codes: AnnexCode[];
}
interface Bundle {
  release: string;
  source: string;
  fetchedAt: string;
  annexes: AnnexTable[];
}

const ALL_ANNEXES = [
  { letter: "A", label: "A · Device Problem" },
  { letter: "G", label: "G · Component" },
  { letter: "C", label: "C · Investigation Findings" },
  { letter: "D", label: "D · Investigation Conclusion" },
  { letter: "E", label: "E · Health Effects (Clinical)" },
  { letter: "F", label: "F · Health Effects (Impact)" },
  { letter: "B", label: "B · Type of Investigation" },
];

const ANNEX_TONE: Record<string, "brand" | "injury" | "malfunction" | "ok" | "neutral"> = {
  A: "brand",
  G: "malfunction",
  C: "injury",
  D: "ok",
  E: "neutral",
  F: "neutral",
  B: "neutral",
};

export default function CodesPage() {
  const [selected, setSelected] = React.useState<string[]>(["A", "G", "C", "D"]);
  const [bundle, setBundle] = React.useState<Bundle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [activeAnnex, setActiveAnnex] = React.useState<string>("A");

  const load = React.useCallback(
    async (letters: string[], refresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/imdrf?annex=${letters.join(",")}${refresh ? "&refresh=1" : ""}`,
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load codes");
        setBundle(json as Bundle);
        if (!letters.includes(activeAnnex)) setActiveAnnex(letters[0]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load codes");
      } finally {
        setLoading(false);
      }
    },
    [activeAnnex],
  );

  React.useEffect(() => {
    load(["A", "G", "C", "D"]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleAnnex = (letter: string) => {
    const next = selected.includes(letter)
      ? selected.filter((l) => l !== letter)
      : [...selected, letter];
    if (!next.length) return;
    setSelected(next);
    load(next);
  };

  const table = bundle?.annexes.find((a) => a.annex === activeAnnex);
  const filtered = React.useMemo(() => {
    if (!table) return [];
    const q = query.trim().toLowerCase();
    if (!q) return table.codes;
    return table.codes.filter(
      (c) =>
        c.imdrfCode.toLowerCase().includes(q) ||
        c.fdaCode.toLowerCase().includes(q) ||
        c.term.toLowerCase().includes(q) ||
        c.termPath.toLowerCase().includes(q) ||
        c.definition.toLowerCase().includes(q),
    );
  }, [table, query]);

  const totalCodes = bundle?.annexes.reduce((s, a) => s + a.codes.length, 0) ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-cyan-500 text-white shadow-[0_10px_30px_-10px_var(--color-brand)]">
            <Layers className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--color-ink)]">
              IMDRF / FDA Code Explorer
            </h1>
            <p className="text-xs text-[var(--color-muted)]">
              Adverse-event annex terminology, pulled live from FDA
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition hover:text-[var(--color-brand)]"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
      </header>

      {/* Source banner */}
      {bundle ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge tone="ok">
            <Database className="size-3.5" /> FDA release {bundle.release}
          </Badge>
          <Badge tone="neutral">{totalCodes.toLocaleString()} codes loaded</Badge>
          <a
            href={bundle.source}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[var(--color-muted)] underline decoration-dotted"
          >
            media/192166 · FDA MDR Adverse Event Codes
          </a>
        </div>
      ) : null}

      {/* Controls */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium text-[var(--color-ink-soft)]">
              Annexes:
            </span>
            {ALL_ANNEXES.map((a) => (
              <button
                key={a.letter}
                onClick={() => toggleAnnex(a.letter)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  selected.includes(a.letter)
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-50)] text-[var(--color-brand)]"
                    : "bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:border-[var(--color-brand)]",
                )}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                className={cn(inputClass, "pl-9")}
                placeholder="Search IMDRF code, FDA code, term, or definition…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => load(selected, true)}
              disabled={loading}
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} /> Refresh from FDA
            </Button>
            <a href={`/api/imdrf/export?annex=${selected.join(",")}`}>
              <Button size="sm">
                <Download className="size-4" /> Export Excel
              </Button>
            </a>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-[var(--color-death)]/30 bg-red-500/5 p-4 text-sm text-[var(--color-death)]">
          {error}
        </div>
      ) : null}

      {/* Annex tabs */}
      {bundle ? (
        <div className="flex flex-wrap gap-1 rounded-2xl border bg-[var(--color-surface)] p-1">
          {bundle.annexes.map((a) => {
            const active = activeAnnex === a.annex;
            return (
              <button
                key={a.annex}
                onClick={() => setActiveAnnex(a.annex)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-[var(--color-brand)] text-white"
                    : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)]",
                )}
              >
                Annex {a.annex}
                <span className={cn("text-xs", active ? "text-white/80" : "text-[var(--color-muted)]")}>
                  {a.codes.length}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Table */}
      <Card className="overflow-hidden">
        {loading && !bundle ? (
          <div className="flex items-center justify-center gap-2 p-16 text-sm text-[var(--color-muted)]">
            <Loader2 className="size-4 animate-spin" /> Fetching annex codes from FDA…
          </div>
        ) : table ? (
          <>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <Badge tone={ANNEX_TONE[table.annex]}>Annex {table.annex}</Badge>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                  {table.title}
                </h3>
              </div>
              <span className="text-xs text-[var(--color-muted)]">
                {filtered.length.toLocaleString()} of {table.codes.length.toLocaleString()} codes
              </span>
            </div>
            <div className="max-h-[62vh] overflow-auto border-t border-[var(--color-border)]">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--color-surface)]">
                  <tr className="text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
                    <th className="px-4 py-3 font-medium">IMDRF</th>
                    <th className="px-4 py-3 font-medium">FDA</th>
                    <th className="px-4 py-3 font-medium">NCIt</th>
                    <th className="px-4 py-3 font-medium">Term</th>
                    <th className="px-4 py-3 font-medium">Definition</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr
                      key={`${c.imdrfCode}-${i}`}
                      className="border-t border-[var(--color-border)]/60 align-top transition hover:bg-[var(--color-surface-2)]"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs font-semibold text-[var(--color-brand)]">
                        {c.imdrfCode}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-[var(--color-ink-soft)]">
                        {c.fdaCode || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-[var(--color-muted)]">
                        {c.ncitCode || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-[var(--color-ink)]">{c.term}</div>
                        {c.level > 1 ? (
                          <div className="text-xs text-[var(--color-muted)]">{c.termPath}</div>
                        ) : null}
                        {!c.selectable ? (
                          <span className="mt-0.5 inline-block text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                            category · not selectable
                          </span>
                        ) : null}
                      </td>
                      <td className="max-w-[420px] px-4 py-2.5 text-xs text-[var(--color-ink-soft)]">
                        {c.definition || "—"}
                      </td>
                    </tr>
                  ))}
                  {!filtered.length ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--color-muted)]">
                        No codes match “{query}”.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </Card>

      <footer className="mt-auto border-t border-[var(--color-border)] pt-5 text-xs text-[var(--color-muted)]">
        Codes pulled live from the FDA MDR Adverse Event Codes workbook (IMDRF
        Annexes A–G with FDA & NCIt crosswalk). For research and educational use only.
      </footer>
    </div>
  );
}
