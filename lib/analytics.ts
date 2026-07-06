import type { FdaEvent } from "./fda";
import {
  EVENT_TYPE_LABELS,
  OCCUPATION_CODES,
  REPORT_SOURCE_CODES,
  SEX_CODES,
  translate,
  translateOutcomes,
} from "./fda-codes";
import { fdaDateToMonth } from "./utils";

export interface CountRow {
  label: string;
  count: number;
  percent: number;
}

export interface DemographicRow {
  characteristic: string;
  value: string;
  frequency: number | "";
  percentage: string;
}

export interface Analytics {
  totalReports: number;
  totalDevices: number;
  totalPatients: number;
  deathCount: number;
  injuryCount: number;
  malfunctionCount: number;
  eventTypes: CountRow[];
  reportSources: CountRow[];
  occupations: CountRow[];
  productCodes: CountRow[];
  manufacturers: CountRow[];
  manufacturerCountries: CountRow[];
  brandNames: CountRow[];
  genericNames: CountRow[];
  productProblems: CountRow[];
  patientProblems: CountRow[];
  patientOutcomes: CountRow[];
  demographics: DemographicRow[];
  timeline: { month: string; count: number }[];
  brandByEventType: {
    data: Record<string, string | number>[];
    eventTypes: string[];
  };
}

function toNumber(val?: string): number | null {
  if (!val) return null;
  const m = String(val).match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function tally(values: (string | undefined | null)[], limit?: number): CountRow[] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const v of values) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (!s) continue;
    counts.set(s, (counts.get(s) ?? 0) + 1);
    total++;
  }
  let rows = [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percent: total ? (100 * count) / total : 0,
    }))
    .sort((a, b) => b.count - a.count);
  if (limit) rows = rows.slice(0, limit);
  return rows;
}

export function computeAnalytics(events: FdaEvent[]): Analytics {
  const eventTypeLabels: string[] = [];
  const reportSourceLabels: string[] = [];
  const occupationLabels: string[] = [];
  const productCodeVals: string[] = [];
  const manufacturerVals: string[] = [];
  const manufacturerCountryVals: string[] = [];
  const brandVals: string[] = [];
  const genericVals: string[] = [];
  const productProblemVals: string[] = [];
  const patientProblemVals: string[] = [];
  const outcomeVals: string[] = [];

  const ages: number[] = [];
  const weights: number[] = [];
  const sexVals: string[] = [];
  const ethnicityVals: string[] = [];
  const raceVals: string[] = [];

  const monthCounts = new Map<string, number>();
  const brandEventPairs: { brand: string; type: string }[] = [];

  let totalDevices = 0;
  let totalPatients = 0;
  let deathCount = 0;
  let injuryCount = 0;
  let malfunctionCount = 0;

  for (const ev of events) {
    const et = translate(EVENT_TYPE_LABELS, ev.event_type);
    if (et) eventTypeLabels.push(et);
    const etl = et.toLowerCase();
    if (etl === "death") deathCount++;
    else if (etl === "injury") injuryCount++;
    else if (etl === "malfunction") malfunctionCount++;

    if (ev.report_source_code)
      reportSourceLabels.push(translate(REPORT_SOURCE_CODES, ev.report_source_code));
    if (ev.reporter_occupation_code)
      occupationLabels.push(translate(OCCUPATION_CODES, ev.reporter_occupation_code));

    for (const p of ev.product_problems ?? []) productProblemVals.push(p);

    const month = fdaDateToMonth(ev.date_received);
    if (month) monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);

    const brandsInEvent: string[] = [];
    for (const d of ev.device ?? []) {
      totalDevices++;
      if (d.device_report_product_code) productCodeVals.push(d.device_report_product_code);
      if (d.manufacturer_d_name) manufacturerVals.push(d.manufacturer_d_name);
      if (d.manufacturer_d_country) manufacturerCountryVals.push(d.manufacturer_d_country);
      if (d.brand_name) {
        brandVals.push(d.brand_name);
        brandsInEvent.push(d.brand_name);
      }
      if (d.generic_name) genericVals.push(d.generic_name);
    }
    if (et) {
      for (const b of brandsInEvent) brandEventPairs.push({ brand: b, type: et });
    }

    for (const p of ev.patient ?? []) {
      totalPatients++;
      const age = toNumber(p.patient_age);
      if (age !== null && age > 0 && age < 130) ages.push(age);
      const weight = toNumber(p.patient_weight);
      if (weight !== null && weight > 0) weights.push(weight);
      if (p.patient_sex) sexVals.push(translate(SEX_CODES, p.patient_sex));
      if (p.patient_ethnicity) ethnicityVals.push(p.patient_ethnicity);
      if (p.patient_race) raceVals.push(p.patient_race);
      for (const pp of p.patient_problems ?? []) patientProblemVals.push(pp);
      const oc = translateOutcomes(p.sequence_number_outcome);
      if (oc) outcomeVals.push(oc);
    }
  }

  // Demographics table
  const demographics: DemographicRow[] = [];
  if (ages.length) {
    const sorted = [...ages].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    demographics.push({
      characteristic: "Age (years), median (range)",
      value: `${Math.round(median)} (${Math.round(sorted[0])}–${Math.round(sorted[sorted.length - 1])})`,
      frequency: "",
      percentage: "",
    });
  }
  if (weights.length) {
    const sorted = [...weights].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    demographics.push({
      characteristic: "Weight, median (range)",
      value: `${median.toFixed(1)} (${sorted[0].toFixed(1)}–${sorted[sorted.length - 1].toFixed(1)})`,
      frequency: "",
      percentage: "",
    });
  }
  const addCategorical = (name: string, vals: string[]) => {
    const rows = tally(vals);
    const total = rows.reduce((s, r) => s + r.count, 0);
    rows.forEach((r, i) => {
      demographics.push({
        characteristic: i === 0 ? name : "",
        value: r.label,
        frequency: r.count,
        percentage: `${((100 * r.count) / total).toFixed(1)}%`,
      });
    });
  };
  addCategorical("Sex", sexVals);
  addCategorical("Ethnicity", ethnicityVals);
  addCategorical("Race", raceVals);

  // Brand × event-type stacked chart (top 10 brands)
  const brandTotals = tally(brandEventPairs.map((p) => p.brand), 10).map((r) => r.label);
  const eventTypeSet = new Set<string>();
  const brandMap = new Map<string, Record<string, number>>();
  for (const { brand, type } of brandEventPairs) {
    if (!brandTotals.includes(brand)) continue;
    eventTypeSet.add(type);
    const rec = brandMap.get(brand) ?? {};
    rec[type] = (rec[type] ?? 0) + 1;
    brandMap.set(brand, rec);
  }
  const brandByEventType = {
    eventTypes: [...eventTypeSet],
    data: brandTotals.map((brand) => ({
      brand: brand.length > 22 ? brand.slice(0, 20) + "…" : brand,
      ...brandMap.get(brand),
    })),
  };

  const timeline = [...monthCounts.entries()]
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalReports: events.length,
    totalDevices,
    totalPatients,
    deathCount,
    injuryCount,
    malfunctionCount,
    eventTypes: tally(eventTypeLabels),
    reportSources: tally(reportSourceLabels),
    occupations: tally(occupationLabels),
    productCodes: tally(productCodeVals, 15),
    manufacturers: tally(manufacturerVals, 15),
    manufacturerCountries: tally(manufacturerCountryVals),
    brandNames: tally(brandVals, 15),
    genericNames: tally(genericVals, 15),
    productProblems: tally(productProblemVals, 15),
    patientProblems: tally(patientProblemVals, 15),
    patientOutcomes: tally(outcomeVals),
    demographics,
    timeline,
    brandByEventType,
  };
}
