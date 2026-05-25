import { NextResponse } from "next/server";
import { collectWebIntelligence } from "@/services/bright-data";
import type { BrightDataRequest } from "@/types/intelligence";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BrightDataRequest;
    if (!body.query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const result = await collectWebIntelligence(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Bright Data route failed", error);
    return NextResponse.json({ error: "Unable to collect web intelligence" }, { status: 500 });
  }
}
