import { NextResponse } from "next/server";
import { recordProviderUsage, type ProviderId } from "@/lib/provider-usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEV_SEEDS: Array<[ProviderId, number]> = [
  ["bright_data", 8],
  ["aiml", 32],
  ["speechmatics", 12],
  ["featherless", 18],
];

/** Dev-only: prime usage counters so the dashboard chart is visible before heavy testing. */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 403 });
  }

  for (const [provider, count] of DEV_SEEDS) {
    await recordProviderUsage(provider, count);
  }

  return NextResponse.json({ ok: true, seeded: DEV_SEEDS });
}
