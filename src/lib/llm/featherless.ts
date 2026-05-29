import OpenAI from "openai";
import { createChatCompletion } from "@/lib/llm/client";

const FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1";

export function isFeatherlessConfigured() {
  return Boolean(process.env.FEATHERLESS_API_KEY?.trim());
}

export function getFeatherlessClient(): OpenAI | null {
  const apiKey = process.env.FEATHERLESS_API_KEY?.trim();
  if (!apiKey) return null;

  return new OpenAI({
    apiKey,
    baseURL: process.env.FEATHERLESS_BASE_URL?.trim() || FEATHERLESS_BASE_URL,
    defaultHeaders: {
      "HTTP-Referer": process.env.SENTRA_APP_URL?.trim() || "http://localhost:3001",
      "X-Title": "Sentra AI",
    },
  });
}

export function getFeatherlessChatModel() {
  return (
    process.env.FEATHERLESS_MODEL_CHAT?.trim() || "meta-llama/Llama-3.3-70B-Instruct"
  );
}

export function getFeatherlessFastModel() {
  return process.env.FEATHERLESS_MODEL_FAST?.trim() || "Qwen/Qwen2.5-7B-Instruct";
}

export function getFeatherlessVisionModel() {
  return process.env.FEATHERLESS_MODEL_VISION?.trim() || "google/gemma-3-27b-it";
}

/** Prefer Featherless for open-source agent workflows; fall back to AIML. */
export function getAgentInferenceClient() {
  return getFeatherlessClient();
}

export function getAgentInferenceModel() {
  return getFeatherlessChatModel();
}

export async function createFeatherlessChatCompletion(
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
) {
  const client = getFeatherlessClient();
  if (!client) {
    throw new Error("FEATHERLESS_API_KEY is not configured.");
  }
  return createChatCompletion(client, params);
}
