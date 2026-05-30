import { resolveBrowserTtsLanguage } from "@/lib/voice/languages";
import { isAbortError, VOICE_ABORT_REASON } from "@/lib/voice/abort";

export type BrowserTtsSettings = {
  language: string;
  volume: number;
  speed: number;
};

function pickVoice(lang: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const exact = voices.find((voice) => voice.lang.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;
  const prefix = lang.split("-")[0]?.toLowerCase();
  return voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix ?? lang)) ?? null;
}

export function speakWithBrowser(
  text: string,
  settings: BrowserTtsSettings,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("Browser speech synthesis is not available."));
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = resolveBrowserTtsLanguage(settings.language);
    utterance.volume = Math.min(1, Math.max(0, settings.volume));
    utterance.rate = Math.min(2, Math.max(0.5, settings.speed));

    const voice = pickVoice(utterance.lang);
    if (voice) utterance.voice = voice;

    const onAbort = () => {
      window.speechSynthesis.cancel();
      reject(new DOMException(VOICE_ABORT_REASON, "AbortError"));
    };

    if (signal.aborted) {
      onAbort();
      return;
    }

    signal.addEventListener("abort", onAbort, { once: true });

    utterance.onend = () => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    };

    utterance.onerror = () => {
      signal.removeEventListener("abort", onAbort);
      reject(new Error("Browser voice playback failed."));
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

export async function speakBrowserChunks(
  chunks: string[],
  settings: BrowserTtsSettings,
  signal: AbortSignal,
) {
  for (const chunk of chunks) {
    if (signal.aborted) throw new DOMException(VOICE_ABORT_REASON, "AbortError");
    try {
      await speakWithBrowser(chunk, settings, signal);
    } catch (error) {
      if (isAbortError(error) || signal.aborted) throw error;
      throw error;
    }
  }
}
