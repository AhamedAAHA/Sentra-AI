import type { VoiceMode } from "@/settings/settings-context";
import { isAbortError, VOICE_ABORT_REASON } from "@/lib/voice/abort";
import { speakWithBrowser } from "@/lib/voice/browser-tts";
import { supportsSpeechmaticsTts } from "@/lib/voice/languages";
import { splitSpeechChunks } from "@/lib/voice/speech-chunks";

export type VoicePlaybackSettings = {
  volume: number;
  speed: number;
  voiceMode: VoiceMode;
  language: string;
};

export type PipelinedVoiceStatus = "idle" | "loading" | "playing";

type FetchVoiceResult =
  | { kind: "audio"; blob: Blob }
  | { kind: "browser" }
  | { kind: "demo" }
  | { kind: "error"; message: string };

async function fetchVoiceChunk(
  text: string,
  signal: AbortSignal,
  settings: VoicePlaybackSettings,
): Promise<FetchVoiceResult> {
  if (signal.aborted) throw new DOMException(VOICE_ABORT_REASON, "AbortError");

  if (!supportsSpeechmaticsTts(settings.language)) {
    return { kind: "browser" };
  }

  try {
    const response = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceMode: settings.voiceMode, language: settings.language }),
      signal,
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      return { kind: "error", message: data?.error ?? "Voice synthesis failed." };
    }

    if (response.headers.get("content-type")?.includes("audio")) {
      return { kind: "audio", blob: await response.blob() };
    }

    const payload = (await response.json().catch(() => null)) as { browserTts?: boolean } | null;
    if (payload?.browserTts) return { kind: "browser" };

    return { kind: "demo" };
  } catch (error) {
    if (isAbortError(error) || signal.aborted) {
      throw new DOMException(VOICE_ABORT_REASON, "AbortError");
    }
    throw error;
  }
}

function playBlob(blob: Blob, settings: VoicePlaybackSettings, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    const cleanup = () => {
      audio.pause();
      audio.src = "";
      URL.revokeObjectURL(url);
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException(VOICE_ABORT_REASON, "AbortError"));
    };

    if (signal.aborted) {
      cleanup();
      reject(new DOMException(VOICE_ABORT_REASON, "AbortError"));
      return;
    }

    signal.addEventListener("abort", onAbort, { once: true });
    audio.volume = settings.volume;
    audio.playbackRate = Math.min(2, Math.max(0.5, settings.speed));
    audio.onended = () => {
      signal.removeEventListener("abort", onAbort);
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      signal.removeEventListener("abort", onAbort);
      cleanup();
      reject(new Error("Audio playback failed."));
    };

    void audio.play().catch((error) => {
      signal.removeEventListener("abort", onAbort);
      cleanup();
      reject(error);
    });
  });
}

export type PipelinedVoiceCallbacks = {
  onStatus?: (status: PipelinedVoiceStatus, detail?: string) => void;
  onChunkStart?: (index: number, total: number) => void;
};

/** Synthesize and play sentence-by-sentence; prefetch the next chunk while the current one plays. */
export async function playPipelinedVoice(
  text: string,
  settings: VoicePlaybackSettings,
  signal: AbortSignal,
  callbacks?: PipelinedVoiceCallbacks,
) {
  const chunks = splitSpeechChunks(text);
  if (!chunks.length) {
    callbacks?.onStatus?.("idle");
    return "empty" as const;
  }

  callbacks?.onStatus?.("loading", "Preparing first phrase…");

  const prefetch = new Map<number, Promise<FetchVoiceResult>>();
  const queueFetch = (index: number) => {
    if (index >= chunks.length || prefetch.has(index)) return;
    prefetch.set(index, fetchVoiceChunk(chunks[index]!, signal, settings));
  };

  queueFetch(0);
  queueFetch(1);

  for (let index = 0; index < chunks.length; index += 1) {
    if (signal.aborted) return "cancelled" as const;

    queueFetch(index + 2);

    let current: FetchVoiceResult;
    try {
      current = await prefetch.get(index)!;
    } catch (error) {
      if (isAbortError(error) || signal.aborted) return "cancelled" as const;
      throw error;
    }

    prefetch.delete(index);

    if (signal.aborted) return "cancelled" as const;

    if (current.kind === "error") {
      throw new Error(current.message);
    }

    if (current.kind === "demo") {
      try {
        await speakWithBrowser(chunks[index]!, settings, signal);
        continue;
      } catch (error) {
        if (isAbortError(error) || signal.aborted) return "cancelled" as const;
        callbacks?.onStatus?.("idle");
        return "demo" as const;
      }
    }

    callbacks?.onStatus?.("playing", `Speaking ${index + 1} of ${chunks.length}`);
    callbacks?.onChunkStart?.(index + 1, chunks.length);

    try {
      if (current.kind === "browser") {
        await speakWithBrowser(chunks[index]!, settings, signal);
      } else {
        await playBlob(current.blob, settings, signal);
      }
    } catch (error) {
      if (isAbortError(error) || signal.aborted) return "cancelled" as const;
      throw error;
    }
  }

  callbacks?.onStatus?.("idle");
  return "completed" as const;
}
