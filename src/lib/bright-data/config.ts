import { getPlatformEnv } from "@/lib/secrets/platform-secrets";
import { resolveAllBrightDataZones } from "@/lib/bright-data/zones";
import type { BrightDataRequest } from "@/types/intelligence";

export type BrightDataMode = "serp" | "unlocker" | "scraper" | "browser" | "mcp";

export type BrightDataProductId =
  | "serp"
  | "unlocker"
  | "scraper"
  | "browser"
  | "mcp"
  | "studio";

export type BrightDataProductStatus = {
  id: BrightDataProductId;
  label: string;
  ready: boolean;
  message: string;
};

/** Production deploy (Vercel/host) — demo fallback disabled unless explicitly allowed. */
export function isProductionDeploy() {
  if (process.env.VERCEL === "1") return true;
  return process.env.NODE_ENV === "production";
}

/** Local dev may use sample evidence when Bright Data zones are missing. */
export function allowBrightDataDemoFallback() {
  if (process.env.SENTRA_ALLOW_DEMO_FALLBACK === "true") return true;
  if (process.env.SENTRA_ALLOW_DEMO_FALLBACK === "false") return false;
  return !isProductionDeploy();
}

export function requiresLiveBrightData() {
  return !allowBrightDataDemoFallback();
}

export function isBrightDataMcpEnabled() {
  return process.env.BRIGHT_DATA_MCP_ENABLED !== "false";
}

export class BrightDataNotConfiguredError extends Error {
  constructor(
    message: string,
    public mode: BrightDataMode,
    public reason: "missing_api_key" | "missing_endpoint" | "missing_zone" | "missing_target_url",
  ) {
    super(message);
    this.name = "BrightDataNotConfiguredError";
  }
}

export class BrightDataCollectionError extends Error {
  constructor(
    message: string,
    public mode: BrightDataMode,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "BrightDataCollectionError";
  }
}

const endpointByMode: Record<Exclude<BrightDataMode, "mcp">, string> = {
  serp: "BRIGHT_DATA_SERP_ENDPOINT",
  unlocker: "BRIGHT_DATA_WEB_UNLOCKER_ENDPOINT",
  scraper: "BRIGHT_DATA_SCRAPER_ENDPOINT",
  browser: "BRIGHT_DATA_BROWSER_ENDPOINT",
};

const zoneEnvByMode: Record<Exclude<BrightDataMode, "mcp">, string> = {
  serp: "BRIGHT_DATA_SERP_ZONE",
  unlocker: "BRIGHT_DATA_WEB_UNLOCKER_ZONE",
  scraper: "BRIGHT_DATA_SCRAPER_ZONE",
  browser: "BRIGHT_DATA_BROWSER_ZONE",
};

export async function getBrightDataProductStatuses(): Promise<BrightDataProductStatus[]> {
  const apiKey = Boolean(getPlatformEnv("BRIGHT_DATA_API_KEY"));
  const zones = apiKey ? await resolveAllBrightDataZones() : {};
  const studioId = getPlatformEnv("BRIGHT_DATA_STUDIO_COLLECTOR_ID");

  return [
    {
      id: "serp",
      label: "SERP API",
      ready: apiKey && Boolean(getPlatformEnv(endpointByMode.serp)) && Boolean(zones.serp),
      message: zones.serp
        ? `Zone ${zones.serp} ready`
        : "Create SERP API zone in Bright Data control panel",
    },
    {
      id: "unlocker",
      label: "Web Unlocker",
      ready: apiKey && Boolean(getPlatformEnv(endpointByMode.unlocker)) && Boolean(zones.unlocker),
      message: zones.unlocker
        ? `Zone ${zones.unlocker} ready`
        : "Create Web Unlocker zone in Bright Data control panel",
    },
    {
      id: "scraper",
      label: "Web Scraper API",
      ready: apiKey && Boolean(getPlatformEnv(endpointByMode.scraper)) && Boolean(zones.scraper),
      message: zones.scraper
        ? `Zone ${zones.scraper} ready`
        : "Create Web Scraper / dataset zone and set BRIGHT_DATA_SCRAPER_ZONE",
    },
    {
      id: "browser",
      label: "Scraping Browser",
      ready: apiKey && Boolean(getPlatformEnv(endpointByMode.browser)) && Boolean(zones.browser),
      message: zones.browser
        ? `Zone ${zones.browser} ready`
        : "Create Scraping Browser zone and set BRIGHT_DATA_BROWSER_ZONE",
    },
    {
      id: "mcp",
      label: "Bright Data MCP",
      ready: apiKey && isBrightDataMcpEnabled(),
      message: apiKey
        ? "Uses BRIGHT_DATA_API_KEY against mcp.brightdata.com (search + scrape tools)"
        : "Add BRIGHT_DATA_API_KEY to vault",
    },
    {
      id: "studio",
      label: "Scraper Studio collector",
      ready: Boolean(studioId),
      message: studioId
        ? `Collector ${studioId} configured`
        : "Optional: set BRIGHT_DATA_STUDIO_COLLECTOR_ID after building a Studio collector",
    },
  ];
}

export function getBrightDataReadiness(mode: BrightDataMode = "serp", targetUrl?: string) {
  const apiKey = Boolean(getPlatformEnv("BRIGHT_DATA_API_KEY"));

  if (mode === "mcp") {
    return {
      ready: apiKey && isBrightDataMcpEnabled(),
      apiKey,
      mode: "mcp" as const,
      message: apiKey
        ? "Bright Data MCP ready (hosted server)"
        : "Add BRIGHT_DATA_API_KEY to the Supabase vault",
      demoFallbackAllowed: allowBrightDataDemoFallback(),
      production: isProductionDeploy(),
    };
  }

  const endpointKey = endpointByMode[mode];
  const endpoint = Boolean(getPlatformEnv(endpointKey));
  const zoneEnv = zoneEnvByMode[mode];
  const zoneFromEnv = Boolean(getPlatformEnv(zoneEnv));
  const needsUrl = mode === "unlocker" || mode === "browser" || mode === "scraper";
  const urlReady = !needsUrl || Boolean(targetUrl?.trim());
  const ready = apiKey && endpoint && zoneFromEnv && urlReady;

  let message = "Bright Data is configured for live GTM collection.";
  if (!apiKey) message = "Add BRIGHT_DATA_API_KEY to the Supabase vault (npm run secrets:sync).";
  else if (!endpoint) message = `Set ${endpointKey} in the vault.`;
  else if (!zoneFromEnv) {
    message =
      mode === "serp"
        ? "Create a SERP API zone and set BRIGHT_DATA_SERP_ZONE."
        : mode === "unlocker"
          ? "Create a Web Unlocker zone and set BRIGHT_DATA_WEB_UNLOCKER_ZONE."
          : mode === "scraper"
            ? "Create a Web Scraper zone and set BRIGHT_DATA_SCRAPER_ZONE."
            : "Create a Scraping Browser zone and set BRIGHT_DATA_BROWSER_ZONE.";
  } else if (needsUrl && !urlReady) {
    message = "This mode requires an HTTPS target URL.";
  }

  return {
    ready,
    apiKey,
    endpoint,
    serpZone: mode === "serp" ? zoneFromEnv : undefined,
    unlockerZone: mode === "unlocker" ? zoneFromEnv : undefined,
    scraperZone: mode === "scraper" ? zoneFromEnv : undefined,
    browserZone: mode === "browser" ? zoneFromEnv : undefined,
    mode,
    message,
    demoFallbackAllowed: allowBrightDataDemoFallback(),
    production: isProductionDeploy(),
  };
}

export async function getBrightDataReadinessWithZones(
  mode: BrightDataMode = "serp",
  targetUrl?: string,
) {
  const base = getBrightDataReadiness(mode, targetUrl);
  if (base.ready || mode === "mcp") return base;

  const apiKey = getPlatformEnv("BRIGHT_DATA_API_KEY");
  if (!apiKey) return base;

  const zones = await resolveAllBrightDataZones();
  const zoneReady =
    mode === "serp"
      ? Boolean(zones.serp)
      : mode === "unlocker"
        ? Boolean(zones.unlocker)
        : mode === "scraper"
          ? Boolean(zones.scraper)
          : mode === "browser"
            ? Boolean(zones.browser)
            : false;

  if (!zoneReady) return base;

  return {
    ...base,
    ready: base.apiKey && base.endpoint && zoneReady,
    message: `Zone discovered in Bright Data account. Add ${zoneEnvByMode[mode as Exclude<BrightDataMode, "mcp">]}=${mode === "serp" ? zones.serp : mode === "unlocker" ? zones.unlocker : mode === "scraper" ? zones.scraper : zones.browser} to vault.`,
  };
}

export function assertBrightDataReady(request: BrightDataRequest) {
  const mode = (request.mode ?? "serp") as BrightDataMode;
  const readiness = getBrightDataReadiness(mode, request.targetUrl);
  if (readiness.ready || allowBrightDataDemoFallback()) return readiness;

  if (!readiness.apiKey) {
    throw new BrightDataNotConfiguredError(readiness.message, mode, "missing_api_key");
  }
  if (!readiness.endpoint) {
    throw new BrightDataNotConfiguredError(readiness.message, mode, "missing_endpoint");
  }
  if (mode !== "mcp" && !readiness.ready) {
    throw new BrightDataNotConfiguredError(readiness.message, mode, "missing_zone");
  }
  if ((mode === "unlocker" || mode === "browser") && !request.targetUrl?.trim()) {
    throw new BrightDataNotConfiguredError(readiness.message, mode, "missing_target_url");
  }

  throw new BrightDataNotConfiguredError(readiness.message, mode, "missing_zone");
}
