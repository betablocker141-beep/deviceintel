/**
 * FDA MAUDE code → human-readable translations.
 * Sourced from openFDA field reference and observed MAUDE data.
 */

export const OUTCOME_CODES: Record<string, string> = {
  R: "Required Intervention",
  O: "Other",
  H: "Hospitalization",
  D: "Death",
  L: "Life Threatening",
  I: "Injury",
  M: "Malfunction",
  N: "No Information",
  U: "Unknown",
  S: "Disability",
};

export const OCCUPATION_CODES: Record<string, string> = {
  "501": "Administrator/Supervisor",
  "003": "Non-Healthcare Professional",
  "117": "Nurse Practitioner",
  "2": "Nurse",
  PHYSICIAN: "Physician",
  NURSE: "Nurse",
  OTHER: "Other",
  "OTHER HEALTH CARE PROFESSIONAL": "Other Health Care Professional",
  "RISK MANAGER": "Risk Manager",
  PATIENT: "Patient",
  ATTORNEY: "Attorney",
  "PATIENT FAMILY MEMBER OR FRIEND": "Patient Family Member or Friend",
  UNKNOWN: "Unknown",
};

export const REPORT_SOURCE_CODES: Record<string, string> = {
  "0": "Unknown",
  "1": "Foreign",
  "2": "Study",
  "3": "Literature",
  "4": "Consumer",
  "5": "Health Professional",
  "6": "User Facility",
  "7": "Company Representative",
  "8": "Distributor",
  "9": "Other",
};

export const YES_NO_CODES: Record<string, string> = {
  Y: "Yes",
  N: "No",
  I: "Invalid/Incomplete",
  U: "Unknown",
  "*": "Not Available",
};

export const SEX_CODES: Record<string, string> = {
  M: "Male",
  F: "Female",
  "*": "Not Reported",
  U: "Unknown",
  N: "Not Applicable",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  D: "Death",
  IN: "Injury",
  IL: "Injury",
  M: "Malfunction",
  O: "Other",
  N: "No Answer Provided",
  "*": "Not Available",
};

export function translate(map: Record<string, string>, code?: string | null): string {
  if (code === undefined || code === null || code === "") return "";
  const key = String(code).trim();
  return map[key] ?? map[key.toUpperCase()] ?? key;
}

/** Semicolon / list separated outcome codes -> readable string. */
export function translateOutcomes(value?: string | string[] | null): string {
  if (!value) return "";
  const parts = Array.isArray(value) ? value : String(value).split(/[;,]/);
  return parts
    .map((c) => translate(OUTCOME_CODES, c))
    .filter(Boolean)
    .join(", ");
}
