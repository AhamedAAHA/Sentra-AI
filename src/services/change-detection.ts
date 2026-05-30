import type {
  BrightDataCollectionMode,
  DetectedChange,
  IntelligenceSignal,
  PageSnapshot,
  Severity,
} from "@/types/intelligence";

const SNAPSHOTS_KEY = "sentra-page-snapshots";
const CHANGES_KEY = "sentra-detected-changes";

const PRICE_PATTERN = /\$[\d,]+(?:\.\d{2})?/g;
const PLAN_PRICE_PATTERN =
  /([A-Z][A-Za-z0-9\s&.-]{2,40}?)\s+(?:plan|tier|package|edition)[:\s-]*(\$[\d,]+(?:\.\d{2})?)/gi;
const NAMED_PRICE_PATTERN = /([A-Z][A-Za-z0-9\s&.-]{2,30}?)\s+(Pro|Enterprise|Starter|Business|Growth|Team)\s*[:\s-]*(\$[\d,]+(?:\.\d{2})?)/gi;

function hashContent(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(36)}`;
}

function extractUrls(evidence: string): string[] {
  return Array.from(evidence.matchAll(/https?:\/\/[^\s"',)\\]+/gi)).map((match) => match[0]);
}

function inferBrightDataMode(evidence: string, index: number): BrightDataCollectionMode | undefined {
  const sections = evidence.split(/###\s+/);
  const section = sections[index + 1] ?? sections[sections.length - 1] ?? "";
  const modeMatch = section.match(/\((serp|unlocker|scraper|browser|mcp)\)/i);
  return modeMatch ? (modeMatch[1].toLowerCase() as BrightDataCollectionMode) : undefined;
}

export function extractStructuredFields(evidence: string): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const match of evidence.matchAll(PLAN_PRICE_PATTERN)) {
    const key = `${match[1].trim()} plan`.replace(/\s+/g, " ");
    fields[key] = match[2];
  }

  for (const match of evidence.matchAll(NAMED_PRICE_PATTERN)) {
    const key = `${match[1].trim()} ${match[2]}`.replace(/\s+/g, " ");
    fields[key] = match[3];
  }

  const urls = extractUrls(evidence);
  urls.forEach((url, index) => {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      const hostSection = evidence.split(url)[1]?.slice(0, 600) ?? "";
      const prices = hostSection.match(PRICE_PATTERN) ?? evidence.match(PRICE_PATTERN) ?? [];
      if (prices[0]) {
        fields[`${host} pricing`] = prices[0];
      }
      if (prices[1]) {
        fields[`${host} enterprise pricing`] = prices[1];
      }
      void index;
    } catch {
      // skip invalid URLs
    }
  });

  if (!Object.keys(fields).length) {
    const prices = evidence.match(PRICE_PATTERN) ?? [];
    prices.slice(0, 5).forEach((price, index) => {
      fields[`extracted_price_${index + 1}`] = price;
    });
  }

  return fields;
}

function severityForChange(field: string, oldValue: string, newValue: string): Severity {
  const oldNum = parseFloat(oldValue.replace(/[^0-9.]/g, ""));
  const newNum = parseFloat(newValue.replace(/[^0-9.]/g, ""));
  if (!Number.isNaN(oldNum) && !Number.isNaN(newNum) && oldNum > 0) {
    const pct = ((newNum - oldNum) / oldNum) * 100;
    if (pct >= 25) return "critical";
    if (pct >= 15) return "high";
    if (pct >= 5) return "medium";
  }
  if (/pricing|plan|tier/i.test(field)) return "high";
  return "medium";
}

function impactForChange(field: string, oldValue: string, newValue: string): string {
  const oldNum = parseFloat(oldValue.replace(/[^0-9.]/g, ""));
  const newNum = parseFloat(newValue.replace(/[^0-9.]/g, ""));
  if (!Number.isNaN(oldNum) && !Number.isNaN(newNum) && oldNum > 0) {
    const pct = Math.round(((newNum - oldNum) / oldNum) * 100);
    const direction = pct >= 0 ? "increase" : "decrease";
    return `${field} moved ${direction} by ${Math.abs(pct)}% — review competitive positioning and account renewals.`;
  }
  return `${field} changed from ${oldValue} to ${newValue} — validate against procurement and sales battlecards.`;
}

function categoryForField(field: string): IntelligenceSignal["category"] {
  if (/pricing|plan|tier|\$/i.test(field)) return "pricing";
  if (/competitor|rival/i.test(field)) return "competitor";
  return "market";
}

export function loadSnapshots(): PageSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(SNAPSHOTS_KEY) || "[]") as PageSnapshot[];
  } catch {
    return [];
  }
}

export function saveSnapshots(snapshots: PageSnapshot[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots.slice(0, 200)));
}

export function loadDetectedChanges(): DetectedChange[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(CHANGES_KEY) || "[]") as DetectedChange[];
  } catch {
    return [];
  }
}

export function saveDetectedChanges(changes: DetectedChange[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHANGES_KEY, JSON.stringify(changes.slice(0, 100)));
}

/** In-memory store for server-side snapshot persistence between checks */
const serverSnapshots = new Map<string, PageSnapshot[]>();
const serverChanges = new Map<string, DetectedChange[]>();

function snapshotKey(monitorId: string, userId?: string) {
  return userId ? `${userId}:${monitorId}` : monitorId;
}

export function getServerSnapshots(monitorId: string, userId?: string): PageSnapshot[] {
  return serverSnapshots.get(snapshotKey(monitorId, userId)) ?? [];
}

export function setServerSnapshots(monitorId: string, snapshots: PageSnapshot[], userId?: string) {
  serverSnapshots.set(snapshotKey(monitorId, userId), snapshots.slice(0, 50));
}

export function getServerChanges(monitorId: string, userId?: string): DetectedChange[] {
  return serverChanges.get(snapshotKey(monitorId, userId)) ?? [];
}

export function appendServerChanges(monitorId: string, changes: DetectedChange[], userId?: string) {
  const key = snapshotKey(monitorId, userId);
  const current = serverChanges.get(key) ?? [];
  serverChanges.set(key, [...changes, ...current].slice(0, 100));
}

export function compareSnapshots(
  previous: PageSnapshot | undefined,
  current: PageSnapshot,
  monitorId?: string,
): DetectedChange[] {
  if (!previous) return [];

  const changes: DetectedChange[] = [];
  const allKeys = new Set([...Object.keys(previous.fields), ...Object.keys(current.fields)]);

  for (const field of allKeys) {
    const oldValue = previous.fields[field];
    const newValue = current.fields[field];
    if (!oldValue || !newValue || oldValue === newValue) continue;

    changes.push({
      id: crypto.randomUUID(),
      monitorId,
      field,
      oldValue,
      newValue,
      sourceUrl: current.url,
      detectedAt: current.collectedAt,
      impact: impactForChange(field, oldValue, newValue),
      severity: severityForChange(field, oldValue, newValue),
      category: categoryForField(field),
    });
  }

  return changes;
}

export function changeToSignal(change: DetectedChange): IntelligenceSignal {
  return {
    id: `change-${change.id}`,
    title: `${change.field} changed from ${change.oldValue} to ${change.newValue}`,
    source: change.sourceUrl,
    summary: change.impact,
    category: change.category,
    severity: change.severity,
    confidence: 0.94,
    timestamp: new Date(change.detectedAt).toLocaleString(),
    changeId: change.id,
    oldValue: change.oldValue,
    newValue: change.newValue,
    sourceUrl: change.sourceUrl,
  };
}

export type ChangeDetectionResult = {
  snapshot: PageSnapshot;
  previousSnapshot?: PageSnapshot;
  changes: DetectedChange[];
  changeSignals: IntelligenceSignal[];
};

export function runChangeDetection({
  monitorId,
  evidence,
  targetUrl,
  userId,
  persistLocally = false,
}: {
  monitorId?: string;
  evidence: string;
  targetUrl?: string | null;
  userId?: string;
  persistLocally?: boolean;
}): ChangeDetectionResult {
  const urls = extractUrls(evidence);
  const url = targetUrl ?? urls[0] ?? "https://competitor.example/pricing";
  const fields = extractStructuredFields(evidence);
  const collectedAt = new Date().toISOString();
  const brightDataMode = inferBrightDataMode(evidence, 0);

  const snapshot: PageSnapshot = {
    id: crypto.randomUUID(),
    monitorId,
    url,
    collectedAt,
    contentHash: hashContent(evidence),
    fields,
    rawExcerpt: evidence.slice(0, 800),
    brightDataMode,
  };

  let previousSnapshots: PageSnapshot[] = [];
  if (typeof window !== "undefined" && persistLocally) {
    previousSnapshots = loadSnapshots().filter((item) =>
      monitorId ? item.monitorId === monitorId : item.url === url,
    );
  } else if (monitorId) {
    previousSnapshots = getServerSnapshots(monitorId, userId).filter((item) => item.url === url);
  }

  const previousSnapshot = previousSnapshots[0];
  const changes = compareSnapshots(previousSnapshot, snapshot, monitorId);

  if (typeof window !== "undefined" && persistLocally) {
    const all = loadSnapshots().filter((item) => item.id !== snapshot.id);
    saveSnapshots([snapshot, ...all]);
    if (changes.length) {
      saveDetectedChanges([...changes, ...loadDetectedChanges()]);
    }
  } else if (monitorId) {
    setServerSnapshots(monitorId, [snapshot, ...previousSnapshots], userId);
    if (changes.length) appendServerChanges(monitorId, changes, userId);
  }

  return {
    snapshot,
    previousSnapshot,
    changes,
    changeSignals: changes.map(changeToSignal),
  };
}

export function seedSnapshot(snapshot: PageSnapshot) {
  if (typeof window !== "undefined") {
    const all = loadSnapshots().filter((item) => item.id !== snapshot.id);
    saveSnapshots([snapshot, ...all]);
    return;
  }
  if (snapshot.monitorId) {
    const existing = getServerSnapshots(snapshot.monitorId);
    setServerSnapshots(snapshot.monitorId, [snapshot, ...existing]);
  }
}

export function changesThisWeek(changes: DetectedChange[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return changes.filter((change) => new Date(change.detectedAt).getTime() >= weekAgo).length;
}
