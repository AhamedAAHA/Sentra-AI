import { NextResponse } from "next/server";
import { collectWebIntelligence } from "@/services/bright-data";
import { generateChatResponse } from "@/services/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: string };
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const intelligence = await collectWebIntelligence({ query: message, mode: "serp" });
    const response = await generateChatResponse(message, intelligence.evidence);

    return NextResponse.json({
      message: response,
      provider: intelligence.provider,
    });
  } catch (error) {
    console.error("Chat route failed", error);
    return NextResponse.json(
      { error: "Sentra AI could not generate a response" },
      { status: 500 },
    );
  }
}
