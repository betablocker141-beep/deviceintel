/**
 * IMDRF / FDA Adverse-Event terminology loader.
 *
 * Source: FDA "MDR Adverse Event Codes" combined annex workbook (updated ~yearly).
 * https://www.fda.gov/medical-devices/mdr-adverse-event-codes
 * Direct file: https://www.fda.gov/media/192166/download
 *
 * openFDA has NO JSON endpoint for these code tables, so we fetch the official
 * FDA spreadsheet and normalize each annex sheet into JSON on demand.
 */

import ExcelJS from "exceljs";

export const FDA_ANNEX_WORKBOOK_URL = "https://www.fda.gov/media/192166/download";

export type AnnexLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export const ANNEX_TITLES: Record<AnnexLetter, string> = {
  A: "Medical Device Problem",
  B: "Cause Investigation — Type of Investigation",
  C: "Cause Investigation — Investigation Findings",
  D: "Cause Investigation — Investigation Conclusion",
  E: "Health Effects — Clinical Signs, Symptoms & Conditions",
  F: "Health Effects — Health Impact",
  G: "Medical Device Component",
};

export interface AnnexCode {
  annex: AnnexLetter;
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

export interface AnnexTable {
  annex: AnnexLetter;
  title: string;
  release: string;
  codes: AnnexCode[];
}

export interface AnnexBundle {
  release: string;
  source: string;
  fetchedAt: string;
  annexes: AnnexTable[];
}

// ---- module-level cache (24h) ----
let CACHE: { bundle: AnnexBundle; ts: number } | null = null;
const TTL_MS = 24 * 60 * 60 * 1000;

function cellText(row: ExcelJS.Row, col: number): string {
  const c = row.getCell(col);
  const v = c.text;
  return (v ?? "").toString().trim();
}

/** Locate the header row and map header label -> column index. */
function headerMap(ws: ExcelJS.Worksheet): {
  headerRow: number;
  cols: Record<string, number>;
} {
  for (let i = 1; i <= 12; i++) {
    const row = ws.getRow(i);
    const cols: Record<string, number> = {};
    let hit = false;
    row.eachCell((cell, ci) => {
      const t = (cell.text ?? "").toString().trim();
      if (t) cols[t] = ci;
      if (/^IMDRF Code$/i.test(t)) hit = true;
    });
    if (hit) return { headerRow: i, cols };
  }
  return { headerRow: 0, cols: {} };
}

function parseSheet(ws: ExcelJS.Worksheet, annex: AnnexLetter): AnnexTable {
  const release =
    cellText(ws.getRow(3), 1).replace(/^Release Number:\s*/i, "") || "unknown";
  const title =
    cellText(ws.getRow(2), 1).replace(/^Annex Title:\s*/i, "") ||
    ANNEX_TITLES[annex];

  const { headerRow, cols } = headerMap(ws);
  const codes: AnnexCode[] = [];
  if (!headerRow) return { annex, title, release, codes };

  const levelCols = [cols["Level 1 Term"], cols["Level 2 Term"], cols["Level 3 Term"]].filter(
    Boolean,
  ) as number[];
  const cImdrf = cols["IMDRF Code"];
  const cFda = cols["FDA Code"];
  const cNcit = cols["NCIt Code"] ?? cols["NCIT Code"];
  const cDef = cols["Definition"];
  const cStatus = cols["Status"];

  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const imdrfCode = cImdrf ? cellText(row, cImdrf) : "";
    if (!imdrfCode) continue;

    const levels = levelCols.map((c) => cellText(row, c));
    const filled = levels.filter(Boolean);
    const term = filled[filled.length - 1] ?? "";
    const status = cStatus ? cellText(row, cStatus) : "";

    codes.push({
      annex,
      imdrfCode,
      fdaCode: cFda ? cellText(row, cFda) : "",
      ncitCode: cNcit ? cellText(row, cNcit) : "",
      term,
      termPath: filled.join(" › "),
      definition: cDef ? cellText(row, cDef) : "",
      level: filled.length,
      selectable: !/not selectable/i.test(status),
      status,
    });
  }
  return { annex, title, release, codes };
}

/** Fetch + parse the FDA annex workbook (cached). */
export async function loadAnnexes(
  letters: AnnexLetter[] = ["A", "C", "D", "G"],
  force = false,
): Promise<AnnexBundle> {
  if (!force && CACHE && Date.now() - CACHE.ts < TTL_MS) {
    return filterBundle(CACHE.bundle, letters);
  }

  const res = await fetch(FDA_ANNEX_WORKBOOK_URL, {
    headers: { "User-Agent": "DeviceIntel/1.0 (+research)" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`FDA annex workbook fetch failed: HTTP ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  const all: AnnexTable[] = [];
  let release = "unknown";
  for (const letter of ["A", "B", "C", "D", "E", "F", "G"] as AnnexLetter[]) {
    const ws = wb.getWorksheet(letter);
    if (!ws) continue;
    const table = parseSheet(ws, letter);
    if (table.codes.length) {
      all.push(table);
      if (table.release !== "unknown") release = table.release;
    }
  }

  const bundle: AnnexBundle = {
    release,
    source: FDA_ANNEX_WORKBOOK_URL,
    fetchedAt: new Date().toISOString(),
    annexes: all,
  };
  CACHE = { bundle, ts: Date.now() };
  return filterBundle(bundle, letters);
}

function filterBundle(bundle: AnnexBundle, letters: AnnexLetter[]): AnnexBundle {
  return {
    ...bundle,
    annexes: bundle.annexes.filter((a) => letters.includes(a.annex)),
  };
}
