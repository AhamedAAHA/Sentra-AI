import { NextResponse } from "next/server";
import { generateChatResponse } from "@/services/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: string };
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const response = await generateChatResponse(message);

    return NextResponse.json({
      message: response,
      provider: "openai-web-search",
    });
  } catch (error) {
    console.error("Chat route failed", error);
    const message =
      error instanceof Error ? error.message : "Sentra AI could not generate a response";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
