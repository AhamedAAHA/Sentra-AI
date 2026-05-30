import { NextResponse } from "next/server";
import { buildPresetDemoBundle } from "@/lib/demo/preset-scenario";

export const runtime = "nodejs";

export async function POST() {
  const bundle = buildPresetDemoBundle();
  return NextResponse.json({
    ok: true,
    monitor: bundle.monitor,
    signals: bundle.signals,
    report: bundle.report,
    detectedChanges: [bundle.detectedChange],
    timeline: bundle.timeline,
    evidence: bundle.evidence,
  });
}
