import { NextResponse } from "next/server";
import { getProviderUsageSnapshot } from "@/lib/provider-usage";
import { ensurePlatformSecrets } from "@/lib/secrets/platform-secrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensurePlatformSecrets(true);
    const snapshot = await getProviderUsageSnapshot();
    return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Provider usage unavailable." }, { status: 500 });
  }
}
