import type { BrightDataRequest } from "@/types/intelligence";
import type { BrightDataMode } from "@/lib/bright-data/config";

export type GtmRouteStep = {
  mode: BrightDataMode;
  label: string;
  reason: string;
};

export type GtmRoutePlan = {
  query: string;
  targetUrl?: string;
  steps: GtmRouteStep[];
  useMcp: boolean;
  useMultiSource: boolean;
};

const pricingIntent = /\b(pricing|price|cost|plan|tier|subscription|billing|discount|incentive)\b/i;
const hiringIntent = /\b(hiring|jobs|careers|recruit|open roles|headcount)\b/i;
const competitorIntent =
  /\b(competitor|competitive|rival|battlecard|market share|product launch|announcement)\b/i;
const scrapeIntent = /\b(scrape|extract|crawl|catalog|sku|listing)\b/i;
const jsHeavyHint = /\b(spa|javascript|react site|dynamic page|login)\b/i;

function getTargetUrl(message: string) {
  const match = message.match(/https?:\/\/[^\s<>()\]]+/i)?.[0]?.replace(/[.,;!?]+$/, "");
  if (!match) return undefined;
  try {
    return new URL(match).toString();
  } catch {
    return undefined;
  }
}

/** Choose Bright Data products for a GTM intelligence request. */
export function planGtmCollection(message: string, options?: { preferMcp?: boolean }): GtmRoutePlan {
  const query = message.trim();
  const targetUrl = getTargetUrl(query);
  const steps: GtmRouteStep[] = [];

  if (targetUrl) {
    if (jsHeavyHint.test(query) || scrapeIntent.test(query)) {
      steps.push({
        mode: "browser",
        label: "Scraping Browser",
        reason: "JavaScript-heavy or structured page extraction",
      });
    }
    steps.push({
      mode: "unlocker",
      label: "Web Unlocker",
      reason: "Competitor URL deep extraction",
    });
    if (scrapeIntent.test(query)) {
      steps.push({
        mode: "scraper",
        label: "Web Scraper API",
        reason: "Structured scrape of target site",
      });
    }
  } else if (competitorIntent.test(query) || pricingIntent.test(query) || hiringIntent.test(query)) {
    steps.push({
      mode: "serp",
      label: "SERP API",
      reason: "Discovery across live search results",
    });
  } else {
    steps.push({
      mode: "serp",
      label: "SERP API",
      reason: "General GTM web discovery",
    });
  }

  const useMcp = options?.preferMcp !== false;
  const useMultiSource = steps.length > 1 || useMcp;

  return {
    query,
    targetUrl,
    steps: dedupeSteps(steps),
    useMcp,
    useMultiSource,
  };
}

export function planToPrimaryRequest(plan: GtmRoutePlan): BrightDataRequest {
  const first = plan.steps.find((step) => step.mode !== "mcp") ?? plan.steps[0];
  const mode = first?.mode === "mcp" || !first ? "serp" : first.mode;
  return {
    query: plan.query,
    targetUrl: plan.targetUrl,
    mode,
  };
}

function dedupeSteps(steps: GtmRouteStep[]) {
  const seen = new Set<BrightDataMode>();
  return steps.filter((step) => {
    if (seen.has(step.mode)) return false;
    seen.add(step.mode);
    return true;
  });
}
