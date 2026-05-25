import axios from "axios";
import { signalStream } from "@/data/mock-intelligence";
import type { BrightDataRequest } from "@/types/intelligence";

type BrightDataEvidence = {
  provider: "bright-data" | "demo";
  query: string;
  evidence: string;
  raw?: unknown;
};

const endpointByMode = {
  serp: "BRIGHT_DATA_SERP_ENDPOINT",
  unlocker: "BRIGHT_DATA_WEB_UNLOCKER_ENDPOINT",
  scraper: "BRIGHT_DATA_SCRAPER_ENDPOINT",
  browser: "BRIGHT_DATA_SCRAPER_ENDPOINT",
} as const;

export async function collectWebIntelligence({
  query,
  targetUrl,
  mode = "serp",
}: BrightDataRequest): Promise<BrightDataEvidence> {
  const endpointKey = endpointByMode[mode];
  const endpoint = process.env[endpointKey];
  const apiKey = process.env.BRIGHT_DATA_API_KEY;

  if (!apiKey || !endpoint) {
    return {
      provider: "demo",
      query,
      evidence: signalStream
        .map((signal) => `${signal.title}: ${signal.summary} Source=${signal.source}`)
        .join("\n"),
    };
  }

  const response = await axios.post(
    endpoint,
    {
      query,
      url: targetUrl,
      parse: true,
      country: "us",
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    },
  );

  return {
    provider: "bright-data",
    query,
    evidence: JSON.stringify(response.data).slice(0, 8000),
    raw: response.data,
  };
}

export async function monitorCompetitor(targetUrl: string) {
  return collectWebIntelligence({
    query: `Monitor competitor website changes, pricing, product launches, and hiring signals for ${targetUrl}`,
    targetUrl,
    mode: "scraper",
  });
}
