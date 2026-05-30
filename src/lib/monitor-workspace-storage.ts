import { PRESET_DEMO_MONITOR_ID } from "@/lib/demo/preset-scenario";
import type { DetectedChange, ExecutiveIntelligenceReport, IntelligenceSignal } from "@/types/intelligence";

const MONITORS_KEY = "sentra-monitors";
const REPORTS_KEY = "sentra-intelligence-reports";
const SIGNALS_KEY = "sentra-monitor-signals-by-id";
const CHANGES_KEY = "sentra-detected-changes";
const SNAPSHOTS_KEY = "sentra-page-snapshots";
const TIMELINE_KEY = "sentra-monitor-timeline";

export type PersistedMonitor = {
  id: string;
  requirement: string;
  searchQuery?: string;
  plainSummary?: string;
  category: string;
  minimumSeverity: string;
  active: boolean;
  createdAt: string;
  lastCheckedAt?: string;
  lastMatchedCount?: number;
  lastSignalCount?: number;
  lastSummary?: string;
  lastSearchQuery?: string;
  lastMatchTitle?: string;
  lastProvider?: string;
  keywords?: string[];
  targetUrl?: string;
  alertedSignalIds: string[];
};

function isDemoChange(change: DetectedChange) {
  if (change.monitorId === PRESET_DEMO_MONITOR_ID) return true;
  if (/apexanalytics|dataforge\.com|insightpro\.ai/i.test(change.sourceUrl ?? "")) return true;
  if (/apexanalytics/i.test(change.field)) return true;
  return false;
}

function isDemoTimelineEvent(event: { monitorId?: string; summary?: string; metadata?: Record<string, string> }) {
  if (event.monitorId === PRESET_DEMO_MONITOR_ID) return true;
  if (/apexanalytics/i.test(event.summary ?? "")) return true;
  const url = event.metadata?.sourceUrl ?? "";
  if (/apexanalytics/i.test(url)) return true;
  return false;
}

/** Remove preset demo artifacts so Detected changes shows live monitor data only. */
export function purgeDemoMonitorArtifacts() {
  if (typeof window === "undefined") return;

  try {
    const changes = JSON.parse(window.localStorage.getItem(CHANGES_KEY) || "[]") as DetectedChange[];
    const liveChanges = changes.filter((change) => !isDemoChange(change));
    if (liveChanges.length !== changes.length) {
      window.localStorage.setItem(CHANGES_KEY, JSON.stringify(liveChanges));
    }

    const timeline = JSON.parse(window.localStorage.getItem(TIMELINE_KEY) || "[]") as Array<{
      monitorId?: string;
      summary?: string;
      metadata?: Record<string, string>;
    }>;
    const liveTimeline = timeline.filter((event) => !isDemoTimelineEvent(event));
    if (liveTimeline.length !== timeline.length) {
      window.localStorage.setItem(TIMELINE_KEY, JSON.stringify(liveTimeline));
    }

    const snapshots = JSON.parse(window.localStorage.getItem(SNAPSHOTS_KEY) || "[]") as Array<{
      id?: string;
      monitorId?: string;
      contentHash?: string;
    }>;
    const liveSnapshots = snapshots.filter(
      (snapshot) =>
        snapshot.monitorId !== PRESET_DEMO_MONITOR_ID &&
        snapshot.contentHash !== "demo-baseline" &&
        snapshot.id !== "demo-baseline-snapshot",
    );
    if (liveSnapshots.length !== snapshots.length) {
      window.localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(liveSnapshots));
    }

    const monitors = JSON.parse(window.localStorage.getItem(MONITORS_KEY) || "[]") as PersistedMonitor[];
    const liveMonitors = monitors.filter((monitor) => monitor.id !== PRESET_DEMO_MONITOR_ID);
    if (liveMonitors.length !== monitors.length) {
      window.localStorage.setItem(MONITORS_KEY, JSON.stringify(liveMonitors));
    }
  } catch {
    // Ignore corrupt storage.
  }
}

export function loadPersistedMonitors(): PersistedMonitor[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(MONITORS_KEY) || "[]") as PersistedMonitor[];
  } catch {
    return [];
  }
}

export function savePersistedMonitors(monitors: PersistedMonitor[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MONITORS_KEY, JSON.stringify(monitors));
}

export function mergeMonitorsWithLocal<T extends { id: string }>(remote: T[], local: PersistedMonitor[]): Array<T & Partial<PersistedMonitor>> {
  const localById = new Map(local.map((monitor) => [monitor.id, monitor]));
  return remote.map((monitor) => {
    const saved = localById.get(monitor.id);
    if (!saved) return monitor as T & Partial<PersistedMonitor>;
    return { ...monitor, ...saved, id: monitor.id };
  });
}

export function loadReportsByMonitorIdFromStorage(monitors: PersistedMonitor[]): Record<string, ExecutiveIntelligenceReport> {
  if (typeof window === "undefined") return {};
  try {
    const reports = JSON.parse(window.localStorage.getItem(REPORTS_KEY) || "[]") as ExecutiveIntelligenceReport[];
    const sorted = [...reports].sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
    );
    const map: Record<string, ExecutiveIntelligenceReport> = {};
    for (const monitor of monitors) {
      const match = sorted.find((report) => report.monitorRequirement === monitor.requirement);
      if (match) map[monitor.id] = match;
    }
    return map;
  } catch {
    return {};
  }
}

export function saveReportForMonitor(report: ExecutiveIntelligenceReport) {
  if (typeof window === "undefined") return;
  try {
    const current = JSON.parse(window.localStorage.getItem(REPORTS_KEY) || "[]") as ExecutiveIntelligenceReport[];
    const next = [report, ...current.filter((item) => item.id !== report.id)].slice(0, 50);
    window.localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
  } catch {
    window.localStorage.setItem(REPORTS_KEY, JSON.stringify([report]));
  }
}

export function loadMonitorSignalsMap(): Record<string, IntelligenceSignal[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(SIGNALS_KEY) || "{}") as Record<string, IntelligenceSignal[]>;
  } catch {
    return {};
  }
}

export function saveMonitorSignals(monitorId: string, signals: IntelligenceSignal[]) {
  if (typeof window === "undefined") return;
  const map = loadMonitorSignalsMap();
  map[monitorId] = signals.slice(0, 24);
  window.localStorage.setItem(SIGNALS_KEY, JSON.stringify(map));
}

export function flattenMonitorSignals(map: Record<string, IntelligenceSignal[]>) {
  const seen = new Set<string>();
  const flat: IntelligenceSignal[] = [];
  for (const signals of Object.values(map)) {
    for (const signal of signals) {
      if (seen.has(signal.id)) continue;
      seen.add(signal.id);
      flat.push(signal);
    }
  }
  return flat.sort((a, b) => {
    const ta = Date.parse(a.timestamp) || 0;
    const tb = Date.parse(b.timestamp) || 0;
    return tb - ta;
  });
}

export function loadLiveDetectedChanges(): DetectedChange[] {
  if (typeof window === "undefined") return [];
  try {
    const changes = JSON.parse(window.localStorage.getItem(CHANGES_KEY) || "[]") as DetectedChange[];
    return changes.filter((change) => !isDemoChange(change));
  } catch {
    return [];
  }
}

export function appendLiveDetectedChanges(incoming: DetectedChange[]) {
  if (typeof window === "undefined" || !incoming.length) return;
  const liveIncoming = incoming.filter((change) => !isDemoChange(change));
  if (!liveIncoming.length) return;

  const current = loadLiveDetectedChanges();
  const seen = new Set(current.map((change) => change.id));
  const merged = [...liveIncoming.filter((change) => !seen.has(change.id)), ...current].slice(0, 100);
  window.localStorage.setItem(CHANGES_KEY, JSON.stringify(merged));
}
