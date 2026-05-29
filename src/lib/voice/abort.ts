export const VOICE_ABORT_REASON = "voice-playback-stopped";

export function isAbortError(error: unknown) {
  if (!error) return false;
  if (typeof error === "object" && "name" in error) {
    const name = (error as { name?: string }).name;
    if (name === "AbortError") return true;
  }
  if (error instanceof Error && /abort/i.test(error.message)) return true;
  return false;
}

export function abortVoiceController(controller: AbortController | null | undefined) {
  if (!controller || controller.signal.aborted) return;
  try {
    controller.abort(VOICE_ABORT_REASON);
  } catch {
    // Abort is best-effort; never surface to the UI.
  }
}
