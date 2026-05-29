import { getPlatformEnv } from "@/lib/secrets/platform-secrets";
import type { VoiceMode } from "@/settings/settings-context";

const DEFAULT_TTS_URL = "https://preview.tts.speechmatics.com";

export class SpeechmaticsTtsError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "SpeechmaticsTtsError";
  }
}

const VOICE_BY_MODE: Record<VoiceMode, string> = {
  professional: "sarah",
  analyst: "theo",
  calm: "megan",
  fast: "jack",
};

export function isSpeechmaticsConfigured() {
  const key = getPlatformEnv("SPEECHMATICS_API_KEY");
  return Boolean(key && !key.includes("your_"));
}

export function getSpeechmaticsTtsUrl() {
  return process.env.SPEECHMATICS_TTS_URL?.trim() || DEFAULT_TTS_URL;
}

export function resolveSpeechmaticsVoice(voiceMode?: VoiceMode) {
  if (voiceMode && VOICE_BY_MODE[voiceMode]) return VOICE_BY_MODE[voiceMode];
  return process.env.SPEECHMATICS_TTS_VOICE?.trim() || "sarah";
}

/** Low-latency Speechmatics text-to-speech (WAV 16 kHz). */
export async function synthesizeSpeechmaticsSpeech(text: string, voiceMode?: VoiceMode) {
  const apiKey = getPlatformEnv("SPEECHMATICS_API_KEY");
  if (!apiKey) return null;

  const trimmed = text.trim().slice(0, 4096);
  if (!trimmed) return null;

  const voice = resolveSpeechmaticsVoice(voiceMode);
  const url = `${getSpeechmaticsTtsUrl()}/generate/${voice}?output_format=wav_16000`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: trimmed }),
    signal: AbortSignal.timeout(14_000),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => undefined);
    throw new SpeechmaticsTtsError(
      `Speechmatics TTS failed (${response.status})`,
      response.status,
      details,
    );
  }

  return response.arrayBuffer();
}
