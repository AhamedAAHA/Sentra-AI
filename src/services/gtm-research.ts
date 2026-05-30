import { planGtmCollection, planToPrimaryRequest, type GtmRoutePlan } from "@/lib/bright-data/router";
import { collectMcpGtmEvidence, isBrightDataMcpConfigured } from "@/services/bright-data-mcp";
import {
  collectWebIntelligence,
  type BrightDataEvidence,
  type GtmEvidenceBundle,
} from "@/services/bright-data";

export type GtmResearchOptions = {
  preferMcp?: boolean;
  multiSource?: boolean;
};

export async function runGtmResearch(
  message: string,
  options?: GtmResearchOptions,
): Promise<GtmEvidenceBundle> {
  const plan = planGtmCollection(message, { preferMcp: options?.preferMcp !== false });
  return collectFromPlan(plan, options);
}

export async function collectFromPlan(
  plan: GtmRoutePlan,
  options?: GtmResearchOptions,
): Promise<GtmEvidenceBundle> {
  const steps: GtmEvidenceBundle["steps"] = [];
  const modesToRun = options?.multiSource !== false ? plan.steps : plan.steps.slice(0, 1);

  for (const step of modesToRun) {
    if (step.mode === "mcp") continue;
    try {
      const result = await collectWebIntelligence({
        query: plan.query,
        targetUrl: plan.targetUrl,
        mode: step.mode,
      });
      if (result.provider === "bright-data") {
        steps.push({
          mode: result.collectionMode ?? step.mode,
          label: step.label,
          evidence: result.evidence,
        });
      }
    } catch (error) {
      console.warn(`GTM collection step failed (${step.mode})`, error);
    }
  }

  if (plan.useMcp && isBrightDataMcpConfigured()) {
    try {
      const mcp = await collectMcpGtmEvidence(plan.query, plan.targetUrl);
      if (mcp) {
        steps.push({
          mode: "mcp",
          label: "Bright Data MCP",
          evidence: mcp.evidence,
        });
      }
    } catch (error) {
      console.warn("MCP GTM collection failed", error);
    }
  }

  const provider = steps.length ? ("bright-data" as const) : ("demo" as const);
  const evidence =
    steps.length > 0
      ? steps.map((s) => `### ${s.label} (${s.mode})\n${s.evidence}`).join("\n\n").slice(0, 16_000)
      : (await collectWebIntelligence(planToPrimaryRequest(plan))).evidence;

  return {
    provider,
    query: plan.query,
    targetUrl: plan.targetUrl,
    steps,
    evidence,
    plan,
  };
}

export function bundleToLegacyEvidence(bundle: GtmEvidenceBundle): BrightDataEvidence {
  return {
    provider: bundle.provider,
    query: bundle.query,
    evidence: bundle.evidence,
    collectionMode: bundle.steps[0]?.mode,
  };
}
