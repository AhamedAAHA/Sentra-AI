import {
  isSpeechmaticsConfigured,
  SpeechmaticsTtsError,
  synthesizeSpeechmaticsSpeech,
} from "@/services/speechmatics-tts";
import type { VoiceMode } from "@/settings/settings-context";

export { SpeechmaticsTtsError };

/** Primary voice provider: Speechmatics TTS (uses SPEECHMATICS_API_KEY). */
export async function synthesizeSpeech(text: string, voiceMode?: VoiceMode) {
  if (!isSpeechmaticsConfigured()) return null;

  try {
    return await synthesizeSpeechmaticsSpeech(text, voiceMode);
  } catch (error) {
    if (error instanceof SpeechmaticsTtsError) throw error;
    console.warn("Speechmatics voice synthesis unavailable", error);
    return null;
  }
}
