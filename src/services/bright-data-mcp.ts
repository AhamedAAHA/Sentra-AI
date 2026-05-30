import { getPlatformEnv } from "@/lib/secrets/platform-secrets";
import { isBrightDataMcpEnabled } from "@/lib/bright-data/config";

type McpJsonRpcResponse = {
  jsonrpc?: string;
  id?: number;
  result?: {
    content?: Array<{ type?: string; text?: string }>;
    structuredContent?: unknown;
  };
  error?: { message?: string; code?: number };
};

let mcpSessionId: string | null = null;
let mcpInitialized = false;

function getMcpBaseUrl() {
  const custom = getPlatformEnv("BRIGHT_DATA_MCP_URL")?.trim();
  const base = custom || "https://mcp.brightdata.com/mcp";
  const apiKey = getPlatformEnv("BRIGHT_DATA_API_KEY");
  if (!apiKey) return null;
  const url = new URL(base);
  url.searchParams.set("token", apiKey);
  const groups = getPlatformEnv("BRIGHT_DATA_MCP_GROUPS");
  if (groups) url.searchParams.set("groups", groups);
  return url.toString();
}

function parseMcpBody(text: string): McpJsonRpcResponse | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed) as McpJsonRpcResponse;
    } catch {
      return null;
    }
  }

  const lines = trimmed.split("\n");
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]?.trim();
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (payload === "[DONE]") continue;
    try {
      return JSON.parse(payload) as McpJsonRpcResponse;
    } catch {
      continue;
    }
  }
  return null;
}

function extractMcpText(response: McpJsonRpcResponse | null) {
  if (!response?.result?.content?.length) {
    if (response?.result?.structuredContent) {
      return JSON.stringify(response.result.structuredContent).slice(0, 8000);
    }
    return null;
  }
  return response.result.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .filter(Boolean)
    .join("\n")
    .slice(0, 8000);
}

async function mcpJsonRpc(method: string, params?: Record<string, unknown>) {
  const url = getMcpBaseUrl();
  if (!url) return null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (mcpSessionId) headers["mcp-session-id"] = mcpSessionId;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
    signal: AbortSignal.timeout(55_000),
  });

  const sessionHeader = response.headers.get("mcp-session-id");
  if (sessionHeader) mcpSessionId = sessionHeader;

  const text = await response.text();
  const parsed = parseMcpBody(text);
  if (parsed?.error) {
    throw new Error(parsed.error.message ?? `MCP error ${parsed.error.code ?? ""}`);
  }
  return parsed;
}

async function ensureMcpSession() {
  if (mcpInitialized) return;
  await mcpJsonRpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "sentra-ai", version: "1.0.0" },
  });
  await mcpJsonRpc("notifications/initialized", {});
  mcpInitialized = true;
}

export function isBrightDataMcpConfigured() {
  return Boolean(getPlatformEnv("BRIGHT_DATA_API_KEY")) && isBrightDataMcpEnabled();
}

export async function mcpSearchEngine(query: string) {
  if (!isBrightDataMcpConfigured()) return null;
  await ensureMcpSession();
  const response = await mcpJsonRpc("tools/call", {
    name: "search_engine",
    arguments: {
      query,
      engine: "google",
      country: "us",
    },
  });
  return extractMcpText(response);
}

export async function mcpScrapeMarkdown(url: string) {
  if (!isBrightDataMcpConfigured()) return null;
  await ensureMcpSession();
  const response = await mcpJsonRpc("tools/call", {
    name: "scrape_as_markdown",
    arguments: { url },
  });
  return extractMcpText(response);
}

export async function collectMcpGtmEvidence(query: string, targetUrl?: string) {
  const chunks: string[] = [];

  try {
    const search = await mcpSearchEngine(query);
    if (search) chunks.push(`[MCP search_engine]\n${search}`);
  } catch (error) {
    console.warn("MCP search_engine failed", error);
  }

  if (targetUrl) {
    try {
      const scrape = await mcpScrapeMarkdown(targetUrl);
      if (scrape) chunks.push(`[MCP scrape_as_markdown: ${targetUrl}]\n${scrape}`);
    } catch (error) {
      console.warn("MCP scrape_as_markdown failed", error);
    }
  }

  if (!chunks.length) return null;

  return {
    provider: "bright-data" as const,
    collectionMode: "mcp" as const,
    query,
    evidence: chunks.join("\n\n").slice(0, 12_000),
  };
}

export function resetMcpSessionForTests() {
  mcpSessionId = null;
  mcpInitialized = false;
}
