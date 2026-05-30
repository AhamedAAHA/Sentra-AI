import type { MonitorTimelineEvent, Severity } from "@/types/intelligence";

const TIMELINE_KEY = "sentra-monitor-timeline";

const serverTimeline = new Map<string, MonitorTimelineEvent[]>();

function timelineKey(userId?: string) {
  return userId ?? "local";
}

export function loadTimelineEvents(): MonitorTimelineEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(TIMELINE_KEY) || "[]") as MonitorTimelineEvent[];
  } catch {
    return [];
  }
}

export function saveTimelineEvents(events: MonitorTimelineEvent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TIMELINE_KEY, JSON.stringify(events.slice(0, 200)));
}

export function getServerTimeline(userId?: string): MonitorTimelineEvent[] {
  return serverTimeline.get(timelineKey(userId)) ?? [];
}

export function appendTimelineEvent(event: Omit<MonitorTimelineEvent, "id" | "timestamp"> & { timestamp?: string }, userId?: string) {
  const full: MonitorTimelineEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: event.timestamp ?? new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    saveTimelineEvents([full, ...loadTimelineEvents()]);
  }

  const key = timelineKey(userId);
  serverTimeline.set(key, [full, ...getServerTimeline(userId)].slice(0, 200));
  return full;
}

export function appendTimelineEvents(events: Array<Omit<MonitorTimelineEvent, "id" | "timestamp"> & { timestamp?: string }>, userId?: string) {
  return events.map((event) => appendTimelineEvent(event, userId));
}

export function recordCheckComplete({
  monitorId,
  monitorRequirement,
  matchedCount,
  provider,
  userId,
}: {
  monitorId: string;
  monitorRequirement: string;
  matchedCount: number;
  provider: string;
  userId?: string;
}) {
  return appendTimelineEvent(
    {
      type: "check_complete",
      monitorId,
      monitorRequirement,
      summary: `Monitor check completed — ${matchedCount} match${matchedCount === 1 ? "" : "es"} from ${provider === "bright-data" ? "live Bright Data" : "demo evidence"}.`,
      metadata: { provider, matchedCount: String(matchedCount) },
    },
    userId,
  );
}

export function recordChangeDetected({
  monitorId,
  monitorRequirement,
  field,
  oldValue,
  newValue,
  sourceUrl,
  severity,
  changeId,
  affectedAccounts,
  userId,
}: {
  monitorId?: string;
  monitorRequirement?: string;
  field: string;
  oldValue: string;
  newValue: string;
  sourceUrl: string;
  severity: Severity;
  changeId: string;
  affectedAccounts?: string[];
  userId?: string;
}) {
  return appendTimelineEvent(
    {
      type: "change_detected",
      monitorId,
      monitorRequirement,
      summary: `${field} changed from ${oldValue} to ${newValue}`,
      severity,
      changeId,
      affectedAccounts,
      metadata: { sourceUrl, oldValue, newValue, field },
    },
    userId,
  );
}

export function recordReportGenerated({
  monitorId,
  monitorRequirement,
  reportId,
  verdict,
  riskScore,
  userId,
}: {
  monitorId?: string;
  monitorRequirement: string;
  reportId: string;
  verdict: string;
  riskScore: number;
  userId?: string;
}) {
  return appendTimelineEvent(
    {
      type: "report_generated",
      monitorId,
      monitorRequirement,
      reportId,
      summary: verdict,
      severity: riskScore >= 80 ? "critical" : riskScore >= 65 ? "high" : "medium",
      metadata: { riskScore: String(riskScore) },
    },
    userId,
  );
}

export function recordWorkflowTriggered({
  monitorId,
  monitorRequirement,
  workflowType,
  userId,
}: {
  monitorId?: string;
  monitorRequirement: string;
  workflowType: string;
  userId?: string;
}) {
  return appendTimelineEvent(
    {
      type: "workflow_triggered",
      monitorId,
      monitorRequirement,
      summary: `${workflowType} workflow triggered for monitor alert`,
      metadata: { workflowType },
    },
    userId,
  );
}

export function getTimelineForApi(userId?: string): MonitorTimelineEvent[] {
  const server = getServerTimeline(userId);
  if (server.length) return server;
  return loadTimelineEvents();
}
