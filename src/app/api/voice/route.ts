import { NextResponse } from "next/server";
import { ElevenLabsError, synthesizeSpeech } from "@/services/elevenlabs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const audio = await synthesizeSpeech(text.slice(0, 2500));

    if (!audio) {
      return NextResponse.json({
        demo: true,
        message: "ElevenLabs keys are not configured. Demo voice orb is active.",
      });
    }

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Voice route failed", error);
    if (error instanceof ElevenLabsError) {
      return NextResponse.json(
        {
          error: error.message,
          providerStatus: error.status,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ error: "Unable to synthesize voice" }, { status: 500 });
  }
}
