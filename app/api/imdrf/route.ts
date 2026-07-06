import { NextResponse } from "next/server";
import { loadAnnexes, type AnnexLetter } from "@/lib/imdrf";

export const runtime = "nodejs";
export const maxDuration = 120;

const VALID: AnnexLetter[] = ["A", "B", "C", "D", "E", "F", "G"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("annex") || "A,C,D,G").toUpperCase();
  const force = searchParams.get("refresh") === "1";
  const letters = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is AnnexLetter => VALID.includes(s as AnnexLetter));

  try {
    const bundle = await loadAnnexes(letters.length ? letters : ["A", "C", "D", "G"], force);
    return NextResponse.json(bundle);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Could not load FDA/IMDRF annex codes: ${message}` },
      { status: 502 },
    );
  }
}
