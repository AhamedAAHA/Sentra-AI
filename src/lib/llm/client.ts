import OpenAI from "openai";

const AIML_DEFAULT_BASE_URL = "https://api.aimlapi.com/v1";

export function isAimlConfigured() {
  return Boolean(process.env.AIML_API_KEY?.trim());
}

/** LLM is ready only when AIML is configured (no direct OpenAI fallback). */
export function isLlmConfigured() {
  return isAimlConfigured();
}

/** All LLM traffic routes through AI/ML API (OpenAI-compatible gateway). */
export function getLlmClient(): OpenAI | null {
  const aimlKey = process.env.AIML_API_KEY?.trim();
  if (!aimlKey) return null;

  return new OpenAI({
    apiKey: aimlKey,
    baseURL: process.env.AIML_BASE_URL?.trim() || AIML_DEFAULT_BASE_URL,
  });
}

export function getLlmProviderLabel(): "aiml" | null {
  return isAimlConfigured() ? "aiml" : null;
}

export function getAnalysisModel() {
  return process.env.AIML_MODEL_ANALYSIS?.trim() || "gpt-4o-mini";
}

export function getChatModel() {
  return process.env.AIML_MODEL_CHAT?.trim() || "gpt-4o";
}

export function getSearchModel() {
  return process.env.AIML_MODEL_SEARCH?.trim() || "gpt-4o-search-preview";
}

export function getIntentModel() {
  return process.env.AIML_MODEL_INTENT?.trim() || "gpt-4o-mini";
}

export function getWorldModel() {
  return process.env.AIML_MODEL_WORLD?.trim() || "gpt-4o";
}

export function getVisionModel() {
  return process.env.AIML_MODEL_VISION?.trim() || "gpt-4o";
}

export function getTranscribeModel() {
  return process.env.AIML_MODEL_TRANSCRIBE?.trim() || "whisper-1";
}

/** Search / reasoning models on AIML often reject temperature and other sampling params. */
export function modelSupportsTemperature(model: string) {
  const id = model.toLowerCase();
  if (id.includes("search")) return false;
  if (/^o[134]/.test(id) || id.includes("-o1") || id.includes("-o3")) return false;
  return true;
}

export function getModelSamplingOptions(model: string, temperature: number) {
  return modelSupportsTemperature(model) ? { temperature } : {};
}

export function isIncompatibleModelParamError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error);
  return /incompatible request argument|unsupported (?:parameter|value)|temperature|response_format/i.test(
    message,
  );
}

type ChatCompletionBody = OpenAI.Chat.ChatCompletionCreateParamsNonStreaming;

export async function createChatCompletion(client: OpenAI, params: ChatCompletionBody) {
  const sampling = getModelSamplingOptions(params.model, params.temperature ?? 0.35);
  const body: ChatCompletionBody = {
    ...params,
    ...sampling,
  };
  if (!modelSupportsTemperature(params.model)) {
    delete body.temperature;
  }

  try {
    return await client.chat.completions.create(body);
  } catch (error) {
    if (isIncompatibleModelParamError(error) && ("temperature" in body || "response_format" in body)) {
      const retryBody = { ...body };
      delete retryBody.temperature;
      delete retryBody.response_format;
      return await client.chat.completions.create(retryBody);
    }
    throw error;
  }
}
