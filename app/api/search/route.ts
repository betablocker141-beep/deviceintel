import { NextResponse } from "next/server";
import { fetchMaude, OpenFdaError, type SearchParams } from "@/lib/fda";
import { computeAnalytics } from "@/lib/analytics";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  let body: SearchParams;
  try {
    body = (await req.json()) as SearchParams;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const hasFilter =
    body.productCode ||
    body.brandName ||
    body.genericName ||
    body.manufacturer ||
    (body.startDate && body.endDate) ||
    body.eventType;

  if (!hasFilter) {
    return NextResponse.json(
      { error: "Provide at least one search filter (e.g. product code, brand, or date range)." },
      { status: 400 },
    );
  }

  try {
    const result = await fetchMaude(body);
    if (!result.events.length) {
      return NextResponse.json(
        {
          error:
            result.total > 0
              ? `Found ${result.total.toLocaleString()} matching reports in FDA, but none could be downloaded. Try narrowing the query.`
              : "No matching adverse-event reports found for these filters.",
          total: result.total,
        },
        { status: 404 },
      );
    }
    const analytics = computeAnalytics(result.events);
    return NextResponse.json({
      events: result.events,
      analytics,
      total: result.total,
      fetched: result.fetched,
      truncated: result.truncated,
      query: result.query,
    });
  } catch (err) {
    if (err instanceof OpenFdaError && err.rateLimited) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Error querying FDA openFDA API: ${message}` },
      { status: 502 },
    );
  }
}
