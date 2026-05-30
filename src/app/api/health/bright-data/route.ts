import { NextResponse } from "next/server";
import { ensurePlatformSecrets } from "@/lib/secrets/platform-secrets";
import { getBrightDataProductStatuses } from "@/lib/bright-data/config";
import { collectWebIntelligence } from "@/services/bright-data";
import { isBrightDataMcpConfigured, mcpSearchEngine } from "@/services/bright-data-mcp";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await ensurePlatformSecrets();
  const { searchParams } = new URL(request.url);
  const probe = searchParams.get("probe");

  const products = await getBrightDataProductStatuses();

  if (!probe) {
    return NextResponse.json({ products });
  }

  const results: Record<string, { ok: boolean; message: string }> = {};

  if (probe === "serp" || probe === "all") {
    try {
      const evidence = await collectWebIntelligence({
        query: "Sentra GTM connectivity test",
        mode: "serp",
      });
      results.serp = {
        ok: evidence.provider === "bright-data",
        message:
          evidence.provider === "bright-data"
            ? "SERP collection succeeded"
            : "SERP returned sample fallback — configure zones",
      };
    } catch (error) {
      results.serp = {
        ok: false,
        message: error instanceof Error ? error.message : "SERP probe failed",
      };
    }
  }

  if (probe === "mcp" || probe === "all") {
    try {
      if (!isBrightDataMcpConfigured()) {
        results.mcp = { ok: false, message: "MCP not configured" };
      } else {
        const text = await mcpSearchEngine("Sentra AI GTM test");
        results.mcp = {
          ok: Boolean(text && text.length > 20),
          message: text ? "MCP search_engine returned data" : "MCP returned empty response",
        };
      }
    } catch (error) {
      results.mcp = {
        ok: false,
        message: error instanceof Error ? error.message : "MCP probe failed",
      };
    }
  }

  return NextResponse.json({ products, probe: results });
}
