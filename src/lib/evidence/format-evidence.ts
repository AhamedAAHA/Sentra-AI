/** Turn Bright Data / SERP payloads into readable UI excerpts (never raw HTTP JSON). */

const TECHNICAL_PATTERN =
  /content-type|cross-origin-opener|report-to|x-frame-options|permissions-policy|set-cookie|"headers"\s*:|"status"\s*:\s*\d{3}/i;

function stripMarkdownSections(raw: string) {
  return raw.replace(/^###\s+[^\n]+\n/gm, "").trim();
}

function tryParseJson(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}

function collectSnippets(value: unknown, out: string[], depth = 0) {
  if (depth > 6 || out.length >= 8) return;

  if (typeof value === "string") {
    const text = value.trim();
    if (text.length >= 24 && text.length <= 600 && !TECHNICAL_PATTERN.test(text)) {
      out.push(text);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectSnippets(item, out, depth + 1);
    return;
  }

  if (!value || typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  const preferredKeys = ["description", "snippet", "text", "body", "content", "title", "link", "url"];

  for (const key of preferredKeys) {
    if (key in record) collectSnippets(record[key], out, depth + 1);
  }

  for (const [key, nested] of Object.entries(record)) {
    if (preferredKeys.includes(key)) continue;
    if (/organic|result|item|snippet|answer|news|web|data/i.test(key)) {
      collectSnippets(nested, out, depth + 1);
    }
  }
}

function pickBestSnippet(snippets: string[], hint?: string) {
  const unique = Array.from(new Set(snippets.map((s) => s.replace(/\s+/g, " ").trim()))).filter(Boolean);
  if (!unique.length) return "";

  if (hint) {
    const lowerHint = hint.toLowerCase().slice(0, 32);
    const match = unique.find((snippet) => snippet.toLowerCase().includes(lowerHint));
    if (match) return match.slice(0, 280);
  }

  const readable = unique.find(
    (snippet) =>
      snippet.length >= 40 &&
      snippet.length <= 320 &&
      !TECHNICAL_PATTERN.test(snippet) &&
      /[a-z]/i.test(snippet),
  );

  return (readable ?? unique.find((snippet) => !TECHNICAL_PATTERN.test(snippet)) ?? unique[0]).slice(0, 280);
}

export function looksLikeTechnicalPayload(text: string) {
  return TECHNICAL_PATTERN.test(text) || /^[\[{]/.test(text.trim());
}

/** Human-readable excerpt for evidence cards and claim verification. */
export function formatEvidenceExcerpt(evidence: string, options?: { hint?: string; fallback?: string }) {
  const fallback = options?.fallback?.trim();
  if (fallback && fallback.length >= 20 && !looksLikeTechnicalPayload(fallback)) {
    return fallback.slice(0, 280);
  }

  const cleaned = stripMarkdownSections(evidence);
  const parsed = tryParseJson(cleaned);
  if (parsed) {
    const snippets: string[] = [];
    collectSnippets(parsed, snippets);
    const fromJson = pickBestSnippet(snippets, options?.hint);
    if (fromJson) return fromJson;
  }

  const lines = cleaned
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 24 && !TECHNICAL_PATTERN.test(line) && !/^[\[{]/.test(line));

  if (lines.length) {
    return pickBestSnippet(lines, options?.hint);
  }

  const prose = cleaned
    .replace(/[{[\]}"]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (prose.length >= 40 && !looksLikeTechnicalPayload(prose)) {
    return prose.slice(0, 280);
  }

  return fallback?.slice(0, 280) || "Live web evidence collected — open the source link for full details.";
}

export function formatEvidenceTitle(signalTitle: string, signalSource: string) {
  const title = signalTitle.trim();
  const source = signalSource.trim();
  if (title && title !== source) return title;
  return source || title || "Collected signal";
}
