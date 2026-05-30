"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ProductStatus = {
  id: string;
  label: string;
  ready: boolean;
  message: string;
};

async function fetchProductStatuses(): Promise<ProductStatus[]> {
  const response = await fetch("/api/health/bright-data");
  const data = (await response.json()) as { products?: ProductStatus[] };
  return data.products ?? [];
}

export function BrightDataControlCenter() {
  const [products, setProducts] = useState<ProductStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProductStatuses()
      .then((next) => {
        if (!cancelled) setProducts(next);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load Bright Data product status.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh(showSpinner: boolean) {
    if (showSpinner) setLoading(true);
    try {
      setProducts(await fetchProductStatuses());
    } catch {
      toast.error("Could not load Bright Data product status.");
    } finally {
      setLoading(false);
    }
  }

  async function probeProduct(id: string) {
    setProbing(id);
    try {
      const response = await fetch(`/api/health/bright-data?probe=${id}`);
      const data = (await response.json()) as {
        probe?: Record<string, { ok: boolean; message: string }>;
      };
      const result = data.probe?.[id];
      if (result?.ok) toast.success(result.message);
      else toast.message(result?.message ?? "Probe completed with issues");
      await refresh(false);
    } catch {
      toast.error("Probe request failed.");
    } finally {
      setProbing(null);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Bright Data control center</p>
          <p className="mt-1 text-xs leading-5 text-white/45">
            SERP, Web Unlocker, Scraper, Scraping Browser, MCP, and optional Scraper Studio collector.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => void refresh(true)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="https://brightdata.com/cp/zones" target="_blank" rel="noreferrer">
              Control panel <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{product.label}</p>
              <p className="mt-0.5 text-xs text-white/45">{product.message}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={product.ready ? "success" : "risk"}>
                {product.ready ? "Ready" : "Setup needed"}
              </Badge>
              {(product.id === "serp" || product.id === "mcp") && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={probing === product.id}
                  onClick={() => void probeProduct(product.id)}
                >
                  {probing === product.id ? "Testing…" : "Test"}
                </Button>
              )}
            </div>
          </div>
        ))}
        {!products.length && !loading && (
          <p className="text-sm text-white/50">No product status returned. Check vault keys.</p>
        )}
      </div>
    </div>
  );
}
