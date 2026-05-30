import axios from "axios";
import { createHash } from "crypto";
import { signalStream } from "@/data/mock-intelligence";
import {
  allowBrightDataDemoFallback,
  assertBrightDataReady,
  BrightDataCollectionError,
  type BrightDataMode,
} from "@/lib/bright-data/config";
import { resolveAllBrightDataZones, type ResolvedBrightDataZones } from "@/lib/bright-data/zones";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformEnv } from "@/lib/secrets/platform-secrets";
import { getSupabaseServiceRoleKey } from "@/lib/supabase/env";
import type { BrightDataRequest } from "@/types/intelligence";

export {
  allowBrightDataDemoFallback,
  BrightDataCollectionError,
  BrightDataNotConfiguredError,
  getBrightDataProductStatuses,
  getBrightDataReadiness,
  getBrightDataReadinessWithZones,
  requiresLiveBrightData,
} from "@/lib/bright-data/config";

export type BrightDataEvidence = {
  provider: "bright-data" | "demo";
  query: string;
  evidence: string;
  collectionMode?: BrightDataMode;
  raw?: unknown;
  cacheHit?: boolean;
};

export type GtmEvidenceBundle = {
  provider: "bright-data" | "demo";
  query: string;
  targetUrl?: string;
  steps: Array<{ mode: BrightDataMode; label: string; evidence: string }>;
  evidence: string;
  plan?: import("@/lib/bright-data/router").GtmRoutePlan;
};

const endpointByMode: Record<Exclude<BrightDataMode, "mcp">, keyof ResolvedBrightDataZones | null> = {
  serp: "serp",
  unlocker: "unlocker",
  scraper: "scraper",
  browser: "browser",
};

const endpointEnvByMode: Record<Exclude<BrightDataMode, "mcp">, string> = {
  serp: "BRIGHT_DATA_SERP_ENDPOINT",
  unlocker: "BRIGHT_DATA_WEB_UNLOCKER_ENDPOINT",
  scraper: "BRIGHT_DATA_SCRAPER_ENDPOINT",
  browser: "BRIGHT_DATA_BROWSER_ENDPOINT",
};

function getCacheTtlSeconds() {
  const raw = Number(getPlatformEnv("BRIGHT_DATA_CACHE_TTL_SECONDS") ?? 900);
  return Number.isFinite(raw) && raw > 0 ? raw : 900;
}

function buildCacheKey(mode: string, zone: string, query: string, targetUrl?: string) {
  const payload = `${mode}|${zone}|${query}|${targetUrl ?? ""}`;
  return createHash("sha256").update(payload).digest("hex");
}

async function readCache(cacheKey: string): Promise<BrightDataEvidence | null> {
  if (!getSupabaseServiceRoleKey()) return null;

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("bd_cache")
      .select("payload, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (!data || new Date(data.expires_at) < new Date()) {
      if (data) await admin.from("bd_cache").delete().eq("cache_key", cacheKey);
      return null;
    }

    const cached = data.payload as BrightDataEvidence;
    return { ...cached, cacheHit: true };
  } catch {
    return null;
  }
}

async function writeCache(cacheKey: string, value: BrightDataEvidence) {
  if (!getSupabaseServiceRoleKey()) return;

  try {
    const admin = createAdminClient();
    const expiresAt = new Date(Date.now() + getCacheTtlSeconds() * 1000).toISOString();
    await admin.from("bd_cache").upsert({
      cache_key: cacheKey,
      payload: value,
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error("Bright Data cache write failed", error);
  }
}

export async function discoverBrightDataZones(apiKey: string) {
  const { fetchActiveBrightDataZones } = await import("@/lib/bright-data/zones");
  return fetchActiveBrightDataZones(apiKey);
}

function getDemoEvidence(query: string, mode: BrightDataMode = "serp"): BrightDataEvidence {
  return {
    provider: "demo",
    query,
    collectionMode: mode,
    evidence: signalStream
      .map((signal) => `${signal.title}: ${signal.summary} Source=${signal.source}`)
      .join("\n"),
  };
}

export function collectDemoWebIntelligence(query: string): BrightDataEvidence {
  return getDemoEvidence(query);
}

async function resolveZoneForMode(mode: Exclude<BrightDataMode, "mcp">, zones: ResolvedBrightDataZones) {
  const zoneKey = endpointByMode[mode];
  if (!zoneKey) return null;
  const fromEnv =
    mode === "serp"
      ? getPlatformEnv("BRIGHT_DATA_SERP_ZONE")
      : mode === "unlocker"
        ? getPlatformEnv("BRIGHT_DATA_WEB_UNLOCKER_ZONE")
        : mode === "scraper"
          ? getPlatformEnv("BRIGHT_DATA_SCRAPER_ZONE")
          : getPlatformEnv("BRIGHT_DATA_BROWSER_ZONE");
  return fromEnv || zones[zoneKey] || null;
}

function buildRequestPayload(
  mode: Exclude<BrightDataMode, "mcp">,
  zone: string,
  query: string,
  targetUrl?: string,
) {
  if (mode === "serp") {
    return {
      zone,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}&brd_json=1&gl=us&hl=en`,
      format: "json",
      method: "GET",
      country: "us",
    };
  }

  if (mode === "unlocker" || mode === "browser") {
    return {
      zone,
      url: targetUrl,
      format: "json",
      method: "GET",
      country: "us",
      data_format: "markdown",
    };
  }

  return {
    zone,
    url: targetUrl,
    format: "json",
    method: "GET",
    country: "us",
    data_format: "markdown",
    parse: true,
  };
}

function isModeMisconfigured(
  mode: Exclude<BrightDataMode, "mcp">,
  apiKey: string | undefined,
  endpoint: string | undefined,
  zone: string | null,
  targetUrl?: string,
) {
  if (!apiKey || !endpoint || !zone) return true;
  if ((mode === "unlocker" || mode === "browser" || mode === "scraper") && !targetUrl) return true;
  return false;
}

export async function collectWebIntelligence({
  query,
  targetUrl,
  mode = "serp",
}: BrightDataRequest): Promise<BrightDataEvidence> {
  const effectiveMode = mode;
  const apiKey = getPlatformEnv("BRIGHT_DATA_API_KEY");
  const endpoint = getPlatformEnv(endpointEnvByMode[effectiveMode]);
  const zones = apiKey ? await resolveAllBrightDataZones() : {};
  const zone = await resolveZoneForMode(effectiveMode, zones);

  if (isModeMisconfigured(effectiveMode, apiKey, endpoint, zone, targetUrl)) {
    if (!allowBrightDataDemoFallback()) {
      assertBrightDataReady({ query, targetUrl, mode: effectiveMode });
    }
    return getDemoEvidence(query, effectiveMode);
  }

  const cacheKey = buildCacheKey(effectiveMode, zone!, query, targetUrl);
  const cached = await readCache(cacheKey);
  if (cached) {
    console.info("Bright Data cache hit", { mode: effectiveMode, cacheKey: cacheKey.slice(0, 12) });
    return cached;
  }

  try {
    const payload = buildRequestPayload(effectiveMode, zone!, query, targetUrl);
    const response = await axios.post(endpoint!, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: effectiveMode === "browser" ? 45_000 : 30_000,
    });

    const result: BrightDataEvidence = {
      provider: "bright-data",
      query,
      collectionMode: effectiveMode,
      evidence: JSON.stringify(response.data).slice(0, 8000),
      raw: response.data,
      cacheHit: false,
    };

    console.info("Bright Data collection success", { mode: effectiveMode, provider: "bright-data" });
    await writeCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Bright Data lookup failed", error);
    if (!allowBrightDataDemoFallback()) {
      throw new BrightDataCollectionError(
        `Bright Data ${effectiveMode} collection failed. Check zones and API key in Settings.`,
        effectiveMode,
        error,
      );
    }
    return getDemoEvidence(query, effectiveMode);
  }
}

export async function monitorCompetitor(targetUrl: string) {
  return collectWebIntelligence({
    query: `Monitor competitor website changes, pricing, product launches, and hiring signals for ${targetUrl}`,
    targetUrl,
    mode: "unlocker",
  });
}
