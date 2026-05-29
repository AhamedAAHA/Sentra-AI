import { isAbortError, VOICE_ABORT_REASON } from "@/lib/voice/abort";
import { splitSpeechChunks } from "@/lib/voice/speech-chunks";

export type VoicePlaybackSettings = {
  volume: number;
  speed: number;
};

export type PipelinedVoiceStatus = "idle" | "loading" | "playing";

type FetchVoiceResult =
  | { kind: "audio"; blob: Blob }
  | { kind: "demo" }
  | { kind: "error"; message: string };

async function fetchVoiceChunk(text: string, signal: AbortSignal): Promise<FetchVoiceResult> {
  if (signal.aborted) throw new DOMException(VOICE_ABORT_REASON, "AbortError");

  try {
    const response = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal,
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      return { kind: "error", message: data?.error ?? "Voice synthesis failed." };
    }

    if (response.headers.get("content-type")?.includes("audio")) {
      return { kind: "audio", blob: await response.blob() };
    }

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
    audio.playbackRate = settings.speed;
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

  callbacks?.onStatus?.("loading", "Preparing first sentence…");

  let nextFetch: Promise<FetchVoiceResult> = fetchVoiceChunk(chunks[0]!, signal);

  for (let index = 0; index < chunks.length; index += 1) {
    if (signal.aborted) return "cancelled" as const;

    let current: FetchVoiceResult;
    try {
      current = await nextFetch;
    } catch (error) {
      if (isAbortError(error) || signal.aborted) return "cancelled" as const;
      throw error;
    }

    if (signal.aborted) return "cancelled" as const;

    if (current.kind === "error") {
      throw new Error(current.message);
    }

    if (current.kind === "demo") {
      callbacks?.onStatus?.("idle");
      return "demo" as const;
    }

    const upcoming = index + 1 < chunks.length ? chunks[index + 1]! : null;
    if (upcoming) {
      nextFetch = fetchVoiceChunk(upcoming, signal);
    }

    callbacks?.onStatus?.("playing", `Speaking ${index + 1} of ${chunks.length}`);
    callbacks?.onChunkStart?.(index + 1, chunks.length);

    try {
      await playBlob(current.blob, settings, signal);
    } catch (error) {
      if (isAbortError(error) || signal.aborted) return "cancelled" as const;
      throw error;
    }
  }

  callbacks?.onStatus?.("idle");
  return "completed" as const;
}
