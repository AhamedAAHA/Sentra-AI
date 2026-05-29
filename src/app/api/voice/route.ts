import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensurePlatformSecrets } from "@/lib/secrets/platform-secrets";
import { SpeechmaticsTtsError, synthesizeSpeech } from "@/services/voice-synthesis";
import type { VoiceMode } from "@/settings/settings-context";

export const runtime = "nodejs";

const VOICE_MODES = new Set<VoiceMode>(["professional", "analyst", "calm", "fast"]);

export async function POST(request: Request) {
  try {
    await ensurePlatformSecrets();
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;

    const limited = await checkRateLimit(auth.user.id, "voice");
    if (!limited.allowed) {
      return NextResponse.json({ error: limited.message }, { status: 429 });
    }

    const body = (await request.json()) as { text?: string; voiceMode?: string };
    const text = body.text?.trim();
    const voiceMode =
      body.voiceMode && VOICE_MODES.has(body.voiceMode as VoiceMode)
        ? (body.voiceMode as VoiceMode)
        : undefined;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const audio = await synthesizeSpeech(text, voiceMode);

    if (!audio) {
      return NextResponse.json({
        demo: true,
        message: "Add SPEECHMATICS_API_KEY to the Supabase vault (npm run secrets:rotate) for live voice.",
      });
    }

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Voice route failed", error);
    if (error instanceof SpeechmaticsTtsError) {
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
