import ExcelJS from "exceljs";
import { computeAnalytics, type CountRow } from "@/lib/analytics";
import type { FdaEvent } from "@/lib/fda";
import {
  EVENT_TYPE_LABELS,
  OCCUPATION_CODES,
  REPORT_SOURCE_CODES,
  SEX_CODES,
  translate,
  translateOutcomes,
  YES_NO_CODES,
} from "@/lib/fda-codes";
import { formatFdaDate } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 300;

const HEADER_FILL = "FF0F172A";
const ACCENT_FILL = "FF2563EB";

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });
}

function autoWidth(ws: ExcelJS.Worksheet, max = 60) {
  ws.columns.forEach((col) => {
    let width = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length + 2;
      if (len > width) width = len;
    });
    col.width = Math.min(width, max);
  });
}

function addCountSheet(wb: ExcelJS.Workbook, title: string, rows: CountRow[]) {
  const ws = wb.addWorksheet(title.slice(0, 31));
  const header = ws.addRow([title, "Count", "Percent"]);
  styleHeader(header);
  for (const r of rows) {
    ws.addRow([r.label, r.count, `${r.percent.toFixed(1)}%`]);
  }
  autoWidth(ws);
  return ws;
}

export async function POST(req: Request) {
  let events: FdaEvent[];
  try {
    const body = await req.json();
    events = body.events;
    if (!Array.isArray(events) || !events.length) {
      return new Response("No data to export", { status: 400 });
    }
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  const analytics = computeAnalytics(events);
  const wb = new ExcelJS.Workbook();
  wb.creator = "DeviceIntel";
  wb.created = new Date();

  // ---- Overview sheet ----
  const overview = wb.addWorksheet("Overview");
  overview.addRow(["DeviceIntel Export"]).font = { bold: true, size: 16, color: { argb: ACCENT_FILL } };
  overview.addRow([`Generated: ${new Date().toLocaleString()}`]);
  overview.addRow([]);
  const kpis: [string, number][] = [
    ["Total Reports", analytics.totalReports],
    ["Total Devices", analytics.totalDevices],
    ["Total Patients", analytics.totalPatients],
    ["Deaths", analytics.deathCount],
    ["Injuries", analytics.injuryCount],
    ["Malfunctions", analytics.malfunctionCount],
  ];
  const kh = overview.addRow(["Metric", "Value"]);
  styleHeader(kh);
  for (const [k, v] of kpis) overview.addRow([k, v]);
  autoWidth(overview);

  // ---- Demographics ----
  const demo = wb.addWorksheet("Demographics");
  const dh = demo.addRow(["Characteristic", "Value", "Frequency", "Percentage"]);
  styleHeader(dh);
  for (const r of analytics.demographics)
    demo.addRow([r.characteristic, r.value, r.frequency, r.percentage]);
  autoWidth(demo);

  // ---- Summary count sheets ----
  addCountSheet(wb, "Event Types", analytics.eventTypes);
  addCountSheet(wb, "Report Sources", analytics.reportSources);
  addCountSheet(wb, "Reporter Occupations", analytics.occupations);
  addCountSheet(wb, "Product Codes", analytics.productCodes);
  addCountSheet(wb, "Manufacturers", analytics.manufacturers);
  addCountSheet(wb, "Brand Names", analytics.brandNames);
  addCountSheet(wb, "Device Types", analytics.genericNames);
  addCountSheet(wb, "Device Problems", analytics.productProblems);
  addCountSheet(wb, "Patient Problems", analytics.patientProblems);
  addCountSheet(wb, "Patient Outcomes", analytics.patientOutcomes);

  // ---- Flattened events ----
  const evWs = wb.addWorksheet("Events");
  const evHeaders = [
    "Report Number",
    "MDR Key",
    "Event Type",
    "Date Received",
    "Date of Event",
    "Report Source",
    "Reporter Occupation",
    "Health Professional",
    "Adverse Event",
    "Product Problem",
    "Product Problems",
    "# Devices",
    "# Patients",
    "Event Location",
  ];
  styleHeader(evWs.addRow(evHeaders));
  for (const ev of events) {
    evWs.addRow([
      ev.report_number ?? "",
      ev.mdr_report_key ?? "",
      translate(EVENT_TYPE_LABELS, ev.event_type),
      formatFdaDate(ev.date_received),
      formatFdaDate(ev.date_of_event),
      translate(REPORT_SOURCE_CODES, ev.report_source_code),
      translate(OCCUPATION_CODES, ev.reporter_occupation_code),
      translate(YES_NO_CODES, ev.health_professional),
      translate(YES_NO_CODES, ev.adverse_event_flag),
      translate(YES_NO_CODES, ev.product_problem_flag),
      (ev.product_problems ?? []).join("; "),
      ev.number_devices_in_event ?? "",
      ev.number_patients_in_event ?? "",
      ev.event_location ?? "",
    ]);
  }
  autoWidth(evWs);

  // ---- Devices ----
  const devWs = wb.addWorksheet("Devices");
  styleHeader(
    devWs.addRow([
      "Report Number",
      "Brand Name",
      "Generic Name",
      "Manufacturer",
      "Country",
      "Product Code",
      "Model Number",
      "Catalog Number",
      "Lot Number",
      "Device Class",
      "Implant",
    ]),
  );
  for (const ev of events) {
    for (const d of ev.device ?? []) {
      devWs.addRow([
        ev.report_number ?? "",
        d.brand_name ?? "",
        d.generic_name ?? "",
        d.manufacturer_d_name ?? "",
        d.manufacturer_d_country ?? "",
        d.device_report_product_code ?? "",
        d.model_number ?? "",
        d.catalog_number ?? "",
        d.lot_number ?? "",
        d.device_class ?? "",
        translate(YES_NO_CODES, d.implant_flag),
      ]);
    }
  }
  autoWidth(devWs);

  // ---- Patients ----
  const patWs = wb.addWorksheet("Patients");
  styleHeader(
    patWs.addRow([
      "Report Number",
      "Sequence #",
      "Age",
      "Sex",
      "Weight",
      "Ethnicity",
      "Race",
      "Problems",
      "Outcomes",
    ]),
  );
  for (const ev of events) {
    for (const p of ev.patient ?? []) {
      patWs.addRow([
        ev.report_number ?? "",
        p.patient_sequence_number ?? "",
        p.patient_age ?? "",
        translate(SEX_CODES, p.patient_sex),
        p.patient_weight ?? "",
        p.patient_ethnicity ?? "",
        p.patient_race ?? "",
        (p.patient_problems ?? []).join("; "),
        translateOutcomes(p.sequence_number_outcome),
      ]);
    }
  }
  autoWidth(patWs);

  // ---- MDR narrative text ----
  const txtWs = wb.addWorksheet("MDR Text");
  styleHeader(txtWs.addRow(["Report Number", "Type", "Patient Seq", "Narrative"]));
  for (const ev of events) {
    for (const t of ev.mdr_text ?? []) {
      txtWs.addRow([
        ev.report_number ?? "",
        t.text_type_code ?? "",
        t.patient_sequence_number ?? "",
        t.text ?? "",
      ]);
    }
  }
  txtWs.getColumn(4).width = 100;
  txtWs.getColumn(4).alignment = { wrapText: true, vertical: "top" };

  const buffer = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="DeviceIntel_${stamp}.xlsx"`,
    },
  });
}
