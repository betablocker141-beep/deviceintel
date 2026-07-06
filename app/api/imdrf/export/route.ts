import ExcelJS from "exceljs";
import { loadAnnexes, ANNEX_TITLES, type AnnexLetter } from "@/lib/imdrf";

export const runtime = "nodejs";
export const maxDuration = 120;

const VALID: AnnexLetter[] = ["A", "B", "C", "D", "E", "F", "G"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("annex") || "A,C,D,G").toUpperCase();
  const letters = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is AnnexLetter => VALID.includes(s as AnnexLetter));

  const bundle = await loadAnnexes(letters.length ? letters : ["A", "C", "D", "G"]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "DeviceIntel";
  wb.created = new Date();

  for (const table of bundle.annexes) {
    const ws = wb.addWorksheet(`Annex ${table.annex}`);
    ws.addRow([`Annex ${table.annex}: ${ANNEX_TITLES[table.annex]}`]).font = {
      bold: true,
      size: 14,
      color: { argb: "FF2563EB" },
    };
    ws.addRow([`FDA release ${table.release} · pulled ${new Date().toLocaleDateString()}`]);
    ws.addRow([]);
    const header = ws.addRow([
      "IMDRF Code",
      "FDA Code",
      "NCIt Code",
      "Term",
      "Term Path",
      "Level",
      "Selectable",
      "Definition",
    ]);
    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    });
    for (const c of table.codes) {
      ws.addRow([
        c.imdrfCode,
        c.fdaCode,
        c.ncitCode,
        c.term,
        c.termPath,
        c.level,
        c.selectable ? "Yes" : "No",
        c.definition,
      ]);
    }
    ws.columns.forEach((col, i) => {
      col.width = [12, 10, 10, 40, 46, 7, 10, 70][i] ?? 16;
    });
    ws.getColumn(8).alignment = { wrapText: true, vertical: "top" };
  }

  const buffer = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="IMDRF_Annexes_${raw.replace(/,/g, "")}_${stamp}.xlsx"`,
    },
  });
}
