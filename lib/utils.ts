import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a YYYYMMDD string (openFDA date format) into MM/DD/YYYY. */
export function formatFdaDate(raw?: string | null): string {
  if (!raw || raw.length !== 8) return raw ?? "";
  const y = raw.slice(0, 4);
  const m = raw.slice(4, 6);
  const d = raw.slice(6, 8);
  return `${m}/${d}/${y}`;
}

/** Convert YYYYMMDD -> YYYY-MM for monthly bucketing. */
export function fdaDateToMonth(raw?: string | null): string | null {
  if (!raw || raw.length < 6) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function pct(part: number, total: number): string {
  if (!total) return "0.0%";
  return `${((100 * part) / total).toFixed(1)}%`;
}
