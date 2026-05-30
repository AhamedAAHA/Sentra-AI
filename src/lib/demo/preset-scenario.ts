import type {
  DetectedChange,
  ExecutiveIntelligenceReport,
  IntelligenceAnalysis,
  IntelligenceSignal,
  MonitorTimelineEvent,
  PageSnapshot,
} from "@/types/intelligence";
import { createExecutiveReport } from "@/services/intelligence-report";
import { seedSnapshot } from "@/services/change-detection";
import { appendTimelineEvents } from "@/lib/monitor-timeline";

export const PRESET_DEMO_MONITOR_ID = "demo-competitive-pricing";

export const presetCompetitors = [
  {
    name: "ApexAnalytics",
    url: "https://apexanalytics.io/pricing",
    plans: { Starter: "$49", Pro: "$129", Enterprise: "$499" },
  },
  {
    name: "DataForge",
    url: "https://dataforge.com/pricing",
    plans: { Starter: "$39", Pro: "$89", Enterprise: "$349" },
  },
  {
    name: "InsightPro",
    url: "https://insightpro.ai/pricing",
    plans: { Starter: "$59", Pro: "$99", Enterprise: "$449" },
  },
] as const;

/** Baseline snapshot — ApexAnalytics Pro at $99 before the May 2026 increase */
export function buildBaselineSnapshot(monitorId: string): PageSnapshot {
  const collectedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: "demo-baseline-snapshot",
    monitorId,
    url: presetCompetitors[0].url,
    collectedAt,
    contentHash: "demo-baseline",
    brightDataMode: "unlocker",
    rawExcerpt:
      "ApexAnalytics pricing page captured via Bright Data Web Unlocker. Pro plan $99/mo, Enterprise $449/mo.",
    fields: {
      "ApexAnalytics Pro": "$99",
      "ApexAnalytics Enterprise": "$449",
      "ApexAnalytics Starter": "$49",
      "DataForge Pro": "$89",
      "InsightPro Pro": "$99",
    },
  };
}

export function buildCurrentEvidence(): string {
  return [
    "### ApexAnalytics pricing (unlocker)",
    `Source: ${presetCompetitors[0].url}`,
    "Captured May 30, 2026 via Bright Data Web Unlocker.",
    "",
    "ApexAnalytics Pro plan: $129/month (previously $99)",
    "ApexAnalytics Enterprise: $449/month",
    "ApexAnalytics Starter: $49/month",
    'Marketing copy: "Pro now includes unlimited competitor monitors and CRM export."',
    "",
    "### DataForge pricing (serp)",
    `Source: ${presetCompetitors[1].url}`,
    "DataForge Pro plan: $89/month — unchanged",
    "DataForge Enterprise: $349/month",
    "",
    "### InsightPro pricing (unlocker)",
    `Source: ${presetCompetitors[2].url}`,
    "InsightPro Pro plan: $99/month — unchanged",
    "InsightPro Enterprise: $449/month",
  ].join("\n");
}

export function buildPresetAnalysis(): IntelligenceAnalysis {
  const primaryChange: IntelligenceSignal = {
    id: "demo-sig-pricing-001",
    title: "ApexAnalytics Pro plan increased from $99 to $129",
    source: presetCompetitors[0].url,
    summary:
      "Competitor Pro tier rose 30.3% with new monitor and CRM export features — immediate battlecard and renewal risk review recommended.",
    category: "pricing",
    severity: "high",
    confidence: 0.96,
    timestamp: "just now",
    oldValue: "$99",
    newValue: "$129",
    sourceUrl: presetCompetitors[0].url,
  };

  return {
    summary:
      "Competitive pricing scan detected a material ApexAnalytics Pro increase (+30.3%) while DataForge and InsightPro held steady. Strategic accounts comparing mid-market tiers face renewed procurement pressure.",
    risks: [
      "ApexAnalytics undercuts Sentra on bundled monitor + CRM positioning at $129.",
      "Three enterprise accounts (Meridian Health, NovaRetail, Atlas FinServ) flagged Apex in recent RFPs.",
      "Price increase may trigger mid-contract renegotiation windows in Q3.",
    ],
    opportunities: [
      "Lead with analyst-hours-saved ROI vs Apex's new bundle.",
      "Offer competitive migration credits for accounts evaluating Apex Pro.",
      "Publish side-by-side evidence table for sales enablement.",
    ],
    recommendations: [
      "Brief sales leadership on Apex Pro change within 24 hours.",
      "Update battlecard with verified pricing evidence and source URLs.",
      "Trigger CRM workflow for Meridian Health, NovaRetail, and Atlas FinServ.",
      "Schedule pricing committee review for Sentra Pro tier positioning.",
    ],
    confidenceScore: 0.94,
    signals: [primaryChange],
  };
}

export function buildPresetDetectedChange(monitorId: string): DetectedChange {
  return {
    id: "demo-change-apex-pro",
    monitorId,
    field: "ApexAnalytics Pro",
    oldValue: "$99",
    newValue: "$129",
    sourceUrl: presetCompetitors[0].url,
    detectedAt: new Date().toISOString(),
    impact:
      "ApexAnalytics Pro moved increase by 30% — review competitive positioning and account renewals for Meridian Health, NovaRetail, and Atlas FinServ.",
    severity: "high",
    category: "pricing",
  };
}

export function buildPresetTimeline(monitorId: string): MonitorTimelineEvent[] {
  const now = Date.now();
  return [
    {
      id: "demo-timeline-1",
      type: "change_detected",
      timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
      monitorId,
      monitorRequirement: "Alert when competitor SaaS pricing pages change on Pro or Enterprise tiers",
      summary: "ApexAnalytics Pro changed from $99 to $129",
      severity: "high",
      affectedAccounts: ["Meridian Health", "NovaRetail", "Atlas FinServ"],
      changeId: "demo-change-apex-pro",
      metadata: {
        sourceUrl: presetCompetitors[0].url,
        oldValue: "$99",
        newValue: "$129",
        field: "ApexAnalytics Pro",
      },
    },
    {
      id: "demo-timeline-2",
      type: "report_generated",
      timestamp: new Date(now - 90 * 1000).toISOString(),
      monitorId,
      monitorRequirement: "Alert when competitor SaaS pricing pages change on Pro or Enterprise tiers",
      summary: "1 monitored signal requires review",
      severity: "high",
      reportId: "demo-report-pending",
      metadata: { riskScore: "74" },
    },
    {
      id: "demo-timeline-3",
      type: "workflow_triggered",
      timestamp: new Date(now - 45 * 1000).toISOString(),
      monitorId,
      monitorRequirement: "Alert when competitor SaaS pricing pages change on Pro or Enterprise tiers",
      summary: "Slack + HubSpot workflow triggered for monitor alert",
      metadata: { workflowType: "Slack + HubSpot" },
    },
    {
      id: "demo-timeline-4",
      type: "check_complete",
      timestamp: new Date(now - 3 * 60 * 1000).toISOString(),
      monitorId,
      monitorRequirement: "Alert when competitor SaaS pricing pages change on Pro or Enterprise tiers",
      summary: "Monitor check completed — 1 match from demo evidence.",
      metadata: { provider: "demo", matchedCount: "1" },
    },
  ];
}

export type PresetDemoBundle = {
  monitor: {
    id: string;
    requirement: string;
    category: "pricing";
    minimumSeverity: "high";
    keywords: string[];
    active: boolean;
    createdAt: string;
    alertedSignalIds: string[];
  };
  evidence: string;
  analysis: IntelligenceAnalysis;
  detectedChange: DetectedChange;
  report: ExecutiveIntelligenceReport;
  timeline: MonitorTimelineEvent[];
  signals: IntelligenceSignal[];
};

export function buildPresetDemoBundle(): PresetDemoBundle {
  const monitorId = PRESET_DEMO_MONITOR_ID;
  const requirement =
    "Alert when competitor SaaS pricing pages change on Pro or Enterprise tiers";
  const evidence = buildCurrentEvidence();
  const analysis = buildPresetAnalysis();
  const detectedChange = buildPresetDetectedChange(monitorId);
  const signals = analysis.signals;

  const report = createExecutiveReport({
    requirement,
    analysis,
    matchedSignals: signals,
    evidence,
    provider: "demo",
    detectedChanges: [detectedChange],
    collectionMeta: {
      collectedAt: new Date().toISOString(),
      brightDataMode: "unlocker",
    },
  });

  return {
    monitor: {
      id: monitorId,
      requirement,
      category: "pricing",
      minimumSeverity: "high",
      keywords: ["pricing", "competitor", "pro", "enterprise", "apex"],
      active: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      alertedSignalIds: [],
    },
    evidence,
    analysis,
    detectedChange,
    report,
    timeline: buildPresetTimeline(monitorId),
    signals,
  };
}

export function initializePresetDemoStorage() {
  const bundle = buildPresetDemoBundle();
  seedSnapshot(buildBaselineSnapshot(bundle.monitor.id));
  appendTimelineEvents(bundle.timeline);
  return bundle;
}

export const PRESET_DEMO_MONITOR_REQUIREMENT =
  "Alert when competitor SaaS pricing pages change on Pro or Enterprise tiers";
