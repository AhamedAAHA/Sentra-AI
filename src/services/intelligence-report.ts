import type {
  BrightDataCollectionMode,
  ClaimSourceRecord,
  ClaimVerificationStatus,
  DetectedChange,
  EvidenceSource,
  ExecutiveIntelligenceReport,
  IntelligenceAnalysis,
  IntelligenceSignal,
  VerifiedClaim,
} from "@/types/intelligence";

const severityScore: Record<IntelligenceSignal["severity"], number> = {
  low: 30,
  medium: 52,
  high: 74,
  critical: 92,
};

function hostFromSource(source: string) {
  const url = source.match(/https?:\/\/[^\s)]+/i)?.[0];
  if (!url) return undefined;

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function evidenceUrlFromRaw(raw: string, index: number) {
  const urls = Array.from(raw.matchAll(/https?:\/\/[^\s"',)\\]+/gi)).map((match) => match[0]);
  return urls[index];
}

function inferBrightDataMode(evidence: string, index: number): BrightDataCollectionMode | undefined {
  const sections = evidence.split(/###\s+/);
  const section = sections[index + 1] ?? sections[sections.length - 1] ?? "";
  const modeMatch = section.match(/\((serp|unlocker|scraper|browser|mcp)\)/i);
  return modeMatch ? (modeMatch[1].toLowerCase() as BrightDataCollectionMode) : undefined;
}

function excerptForSignal(signal: IntelligenceSignal, evidence: string): string {
  const url = signal.sourceUrl ?? evidenceUrlFromRaw(evidence, 0);
  if (url) {
    const afterUrl = evidence.split(url)[1]?.slice(0, 400);
    if (afterUrl?.trim()) return afterUrl.trim().slice(0, 280);
  }

  const titleIndex = evidence.toLowerCase().indexOf(signal.title.toLowerCase().slice(0, 24));
  if (titleIndex >= 0) {
    return evidence.slice(titleIndex, titleIndex + 280).trim();
  }

  return evidence.slice(0, 280).trim();
}

function claimStatusFromEvidence(
  signal: IntelligenceSignal,
  excerpt: string,
  url?: string,
): ClaimVerificationStatus {
  const hasUrl = Boolean(url);
  const hasExcerpt = excerpt.length >= 40;
  const hasChangeValues =
    Boolean(signal.oldValue && signal.newValue) &&
    (excerpt.includes(signal.oldValue!.replace("$", "")) ||
      excerpt.includes(signal.newValue!.replace("$", "")));

  if (hasUrl && hasExcerpt && (hasChangeValues || signal.confidence >= 0.85)) {
    return "evidence-backed";
  }
  if (hasUrl || hasExcerpt || signal.confidence >= 0.68) {
    return "partial";
  }
  return "unsupported";
}

function buildEvidenceSources(
  signals: IntelligenceSignal[],
  evidence: string,
  provider: ExecutiveIntelligenceReport["provider"],
  collectionMeta?: { collectedAt?: string; brightDataMode?: BrightDataCollectionMode },
): EvidenceSource[] {
  const sourceMap = new Map<string, EvidenceSource>();
  const collectedAt = collectionMeta?.collectedAt ?? new Date().toISOString();

  signals.forEach((signal, index) => {
    const url = signal.sourceUrl ?? evidenceUrlFromRaw(evidence, index);
    const brightDataMode = collectionMeta?.brightDataMode ?? inferBrightDataMode(evidence, index);
    const publisher = hostFromSource(signal.source) ?? (provider === "bright-data" ? "Collected web evidence" : signal.source);
    const id = `source-${index + 1}`;
    const key = `${publisher}-${url ?? signal.source}`;
    if (sourceMap.has(key)) return;

    sourceMap.set(key, {
      id,
      title: signal.source,
      url,
      publisher,
      freshness: signal.timestamp || "latest collected run",
      reliability: provider === "bright-data" ? Math.min(96, Math.round(signal.confidence * 100 + 5)) : 72,
      claimSupported: signal.title,
      collectedAt,
      brightDataMode,
      excerpt: excerptForSignal(signal, evidence),
    });
  });

  if (!sourceMap.size) {
    sourceMap.set("demo-evidence", {
      id: "source-1",
      title: provider === "bright-data" ? "Collected web evidence" : "Demo intelligence stream",
      publisher: provider === "bright-data" ? "Bright Data" : "Sentra demo dataset",
      freshness: "current run",
      reliability: provider === "bright-data" ? 82 : 58,
      claimSupported: "Monitor requirement requires further corroboration.",
      collectedAt,
      brightDataMode: collectionMeta?.brightDataMode,
      excerpt: evidence.slice(0, 280),
    });
  }

  return Array.from(sourceMap.values()).slice(0, 6);
}

function findSourceForSignal(
  signal: IntelligenceSignal,
  sources: EvidenceSource[],
  evidence: string,
  index: number,
): EvidenceSource {
  const signalUrl = signal.sourceUrl ?? evidenceUrlFromRaw(evidence, index);
  if (signalUrl) {
    const byUrl = sources.find((source) => source.url === signalUrl);
    if (byUrl) return byUrl;
  }
  return sources[index % sources.length] ?? sources[0];
}

function buildEvidenceBackedClaims(
  signals: IntelligenceSignal[],
  sources: EvidenceSource[],
  evidence: string,
  collectionMeta?: { collectedAt?: string; brightDataMode?: BrightDataCollectionMode },
): VerifiedClaim[] {
  const collectedAt = collectionMeta?.collectedAt ?? new Date().toISOString();

  if (!signals.length) {
    const fallbackSource = sources[0];
    return [
      {
        id: "claim-1",
        claim: "No matching signal crossed the configured monitor threshold.",
        status: "partial",
        confidence: 52,
        sourceIds: fallbackSource ? [fallbackSource.id] : [],
        sourceRecords: fallbackSource
          ? [
              {
                sourceId: fallbackSource.id,
                url: fallbackSource.url,
                excerpt: fallbackSource.excerpt ?? evidence.slice(0, 200),
                collectedAt,
                brightDataMode: fallbackSource.brightDataMode,
                verificationStatus: "partial",
              },
            ]
          : [],
      },
    ];
  }

  return signals.slice(0, 5).map((signal, index) => {
    const source = findSourceForSignal(signal, sources, evidence, index);
    const excerpt = excerptForSignal(signal, evidence);
    const status = claimStatusFromEvidence(signal, excerpt, source.url);
    const sourceRecord: ClaimSourceRecord = {
      sourceId: source.id,
      url: source.url ?? signal.sourceUrl,
      excerpt,
      collectedAt,
      brightDataMode: source.brightDataMode ?? collectionMeta?.brightDataMode,
      verificationStatus: status,
    };

    return {
      id: `claim-${index + 1}`,
      claim: signal.oldValue && signal.newValue
        ? `${signal.title}: ${signal.oldValue} → ${signal.newValue}`
        : `${signal.title}: ${signal.summary}`,
      status,
      confidence: Math.round(signal.confidence * 100),
      sourceIds: [source.id],
      sourceRecords: [sourceRecord],
    };
  });
}

export function createExecutiveReport({
  requirement,
  analysis,
  matchedSignals,
  evidence,
  provider,
  detectedChanges,
  collectionMeta,
}: {
  requirement: string;
  analysis: IntelligenceAnalysis;
  matchedSignals: IntelligenceSignal[];
  evidence: string;
  provider: ExecutiveIntelligenceReport["provider"];
  detectedChanges?: DetectedChange[];
  collectionMeta?: { collectedAt?: string; brightDataMode?: BrightDataCollectionMode };
}): ExecutiveIntelligenceReport {
  const signals = matchedSignals.length ? matchedSignals : analysis.signals;
  const sources = buildEvidenceSources(signals, evidence, provider, collectionMeta);
  const claims = buildEvidenceBackedClaims(signals, sources, evidence, collectionMeta);
  const topSignal = matchedSignals[0] ?? analysis.signals[0];
  const riskScore = Math.max(
    Math.round((analysis.confidenceScore || 0.65) * 100),
    topSignal ? severityScore[topSignal.severity] : 42,
  );
  const confidence = Math.round(
    Math.min(0.98, Math.max(0.45, analysis.confidenceScore || topSignal?.confidence || 0.62)) * 100,
  );
  const unsupportedCount = claims.filter((claim) => claim.status === "unsupported").length;
  const partialCount = claims.filter((claim) => claim.status === "partial").length;
  const hallucinationRisk =
    provider === "demo" || unsupportedCount ? "high" : partialCount > claims.length / 2 ? "medium" : "low";

  const changeSummary =
    detectedChanges?.length &&
    ` Snapshot diff detected ${detectedChanges.length} change${detectedChanges.length === 1 ? "" : "s"} since the last collection.`;

  return {
    id: crypto.randomUUID(),
    monitorRequirement: requirement,
    generatedAt: new Date().toISOString(),
    provider,
    verdict: matchedSignals.length
      ? `${matchedSignals.length} monitored signal${matchedSignals.length === 1 ? "" : "s"} require review`
      : "No monitored signal crossed the action threshold",
    riskScore,
    confidence,
    situation: matchedSignals.length
      ? `${analysis.summary}${changeSummary || ""} The strongest matching signal is "${topSignal.title}".`
      : `${analysis.summary} No collected signal fully matched the configured threshold yet.`,
    impact: detectedChanges?.[0]
      ? detectedChanges[0].impact
      : matchedSignals.length
        ? `Potential impact is concentrated around ${topSignal.category} with ${topSignal.severity} severity.`
        : "Impact remains watchlist-level until stronger corroborated evidence appears.",
    actionPlan: (analysis.recommendations.length ? analysis.recommendations : [
      "Validate the collected evidence with a human owner.",
      "Keep the monitor active until the signal stabilizes.",
      "Prepare a stakeholder update if the risk score rises.",
    ]).slice(0, 5),
    watchItems: [
      ...analysis.risks.slice(0, 3),
      ...analysis.opportunities.slice(0, 2).map((item) => `Opportunity: ${item}`),
    ].slice(0, 5),
    evidenceSources: sources,
    verifiedClaims: claims,
    observedFacts: matchedSignals.slice(0, 4).map((signal) =>
      signal.oldValue && signal.newValue
        ? `${signal.title} (${signal.oldValue} → ${signal.newValue})`
        : signal.summary,
    ),
    forecasts: analysis.opportunities.slice(0, 3),
    hallucinationRisk,
    detectedChanges,
  };
}
