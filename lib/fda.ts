/**
 * openFDA MAUDE (device/event) client + query builder.
 * Docs: https://open.fda.gov/apis/device/event/
 */

const FDA_ENDPOINT = "https://api.fda.gov/device/event.json";

export interface SearchParams {
  productCode?: string;
  brandName?: string;
  genericName?: string;
  manufacturer?: string;
  startDate?: string; // YYYYMMDD or YYYY-MM-DD
  endDate?: string;
  maxRecords?: number;
  apiKey?: string;
  eventType?: string; // D | IN | IL | M | O
}

export interface FdaDevice {
  brand_name?: string;
  generic_name?: string;
  manufacturer_d_name?: string;
  manufacturer_d_country?: string;
  manufacturer_d_state?: string;
  model_number?: string;
  catalog_number?: string;
  lot_number?: string;
  device_report_product_code?: string;
  device_name?: string;
  medical_specialty_description?: string;
  device_class?: string;
  implant_flag?: string;
  device_operator?: string;
  openfda?: Record<string, unknown>;
}

export interface FdaPatient {
  patient_sequence_number?: string;
  patient_age?: string;
  patient_sex?: string;
  patient_weight?: string;
  patient_ethnicity?: string;
  patient_race?: string;
  patient_problems?: string[];
  sequence_number_outcome?: string[];
  sequence_number_treatment?: string[];
}

export interface FdaMdrText {
  text_type_code?: string;
  patient_sequence_number?: string;
  text?: string;
  mdr_text_key?: string;
}

export interface FdaEvent {
  report_number?: string;
  mdr_report_key?: string;
  event_type?: string;
  event_location?: string;
  date_received?: string;
  date_of_event?: string;
  report_source_code?: string;
  source_type?: string[];
  reporter_occupation_code?: string;
  health_professional?: string;
  adverse_event_flag?: string;
  product_problem_flag?: string;
  product_problems?: string[];
  number_devices_in_event?: string;
  number_patients_in_event?: string;
  remedial_action?: string[];
  type_of_report?: string[];
  device?: FdaDevice[];
  patient?: FdaPatient[];
  mdr_text?: FdaMdrText[];
}

export interface FetchResult {
  events: FdaEvent[];
  total: number;
  fetched: number;
  query: string;
  truncated: boolean;
}

function normalizeDate(d?: string): string | undefined {
  if (!d) return undefined;
  return d.replace(/-/g, "");
}

/** Build the openFDA `search` expression from user filters. */
export function buildSearchQuery(params: SearchParams): string {
  const clauses: string[] = [];

  const start = normalizeDate(params.startDate);
  const end = normalizeDate(params.endDate);
  if (start && end) {
    clauses.push(`date_received:[${start}+TO+${end}]`);
  }

  if (params.productCode) {
    const codes = params.productCode
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    if (codes.length) {
      const q = codes
        .map((c) => `device.device_report_product_code:${c}*`)
        .join(" OR ");
      clauses.push(`(${q})`);
    }
  }

  if (params.brandName) {
    const names = params.brandName
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length) {
      const q = names.map((n) => `device.brand_name:"${n}"`).join(" OR ");
      clauses.push(`(${q})`);
    }
  }

  if (params.genericName) {
    const names = params.genericName
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length) {
      const q = names.map((n) => `device.generic_name:"${n}"`).join(" OR ");
      clauses.push(`(${q})`);
    }
  }

  if (params.manufacturer) {
    const names = params.manufacturer
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length) {
      const q = names
        .map((n) => `device.manufacturer_d_name:${n}*`)
        .join(" OR ");
      clauses.push(`(${q})`);
    }
  }

  if (params.eventType) {
    clauses.push(`event_type:"${params.eventType}"`);
  }

  return clauses.length ? clauses.join("+AND+") : "*";
}

function buildUrl(
  search: string,
  extra: Record<string, string | number>,
  apiKey?: string,
): string {
  let url = `${FDA_ENDPOINT}?search=${search}`;
  for (const [k, v] of Object.entries(extra)) {
    url += `&${k}=${v}`;
  }
  const key = apiKey || process.env.FDA_API_KEY;
  if (key) url += `&api_key=${key}`;
  return url;
}

function extractNextUrl(res: Response): string | null {
  const link = res.headers.get("link");
  if (!link) return null;
  const m = link.match(/<([^>]+)>;\s*rel="next"/i);
  return m ? m[1] : null;
}

async function fetchWithRetry(
  url: string,
  maxRetries = 3,
): Promise<Response | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.status === 200) return res;
      if (res.status === 404) return res; // no results / end of pages
      if (res.status === 429) {
        await sleep(2 ** (attempt + 1) * 500);
        continue;
      }
      if (attempt < maxRetries - 1) await sleep(2 ** (attempt + 1) * 500);
      else return res;
    } catch {
      if (attempt < maxRetries - 1) await sleep(2 ** (attempt + 1) * 500);
    }
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Lightweight count-only query. */
export async function fetchTotal(
  search: string,
  apiKey?: string,
): Promise<number> {
  const url = buildUrl(search, { limit: 1 }, apiKey);
  const res = await fetchWithRetry(url);
  if (!res || res.status !== 200) return 0;
  const data = await res.json();
  return data?.meta?.results?.total ?? 0;
}

/**
 * Fetch MAUDE events using cursor-based (search_after) pagination via the
 * Link header, honoring a maximum record cap.
 */
export async function fetchMaude(params: SearchParams): Promise<FetchResult> {
  const search = buildSearchQuery(params);
  const apiKey = params.apiKey || process.env.FDA_API_KEY;
  const batch = apiKey ? 1000 : 500;
  const maxRecords = Math.min(params.maxRecords || 1000, 25000);

  const total = await fetchTotal(search, apiKey);

  const events: FdaEvent[] = [];
  let nextUrl: string | null = buildUrl(
    search,
    { limit: batch, sort: "date_received:desc" },
    apiKey,
  );

  while (nextUrl && events.length < maxRecords) {
    const res: Response | null = await fetchWithRetry(nextUrl);
    if (!res || res.status !== 200) break;

    const data = await res.json();
    const results: FdaEvent[] = data?.results ?? [];
    if (!results.length) break;

    events.push(...results);

    if (events.length >= maxRecords) break;

    nextUrl = extractNextUrl(res);
    if (nextUrl && apiKey && !nextUrl.includes("api_key=")) {
      nextUrl += `${nextUrl.includes("?") ? "&" : "?"}api_key=${apiKey}`;
    }
    if (nextUrl) await sleep(150);
  }

  const trimmed = events.slice(0, maxRecords);
  return {
    events: trimmed,
    total,
    fetched: trimmed.length,
    query: decodeURIComponent(search),
    truncated: total > trimmed.length,
  };
}
