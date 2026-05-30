"use client";

import { useEffect, useState } from "react";
import { Building2, Clock3, GitCompareArrows, Radar, Target, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import type { BusinessMetrics } from "@/types/intelligence";

const defaultMetrics: BusinessMetrics = {
  monitoredCompetitors: 3,
  pagesTracked: 3,
  changesThisWeek: 0,
  analystHoursSaved: 0,
  strategicAccountsAffected: 0,
  activeMonitors: 0,
  reportsGenerated: 0,
};

export function BusinessMetricsPanel() {
  const [metrics, setMetrics] = useState<BusinessMetrics>(defaultMetrics);
  const [source, setSource] = useState<"baseline" | "operational">("baseline");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/metrics");
        const data = (await response.json()) as {
          metrics?: BusinessMetrics;
          source?: "baseline" | "operational";
        };
        if (!cancelled && data.metrics) {
          setMetrics(data.metrics);
          setSource(data.source ?? "baseline");
        }
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const interval = window.setInterval(load, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const cards = [
    {
      icon: Target,
      label: "Monitored competitors",
      value: loading ? "--" : String(metrics.monitoredCompetitors),
      trend: source === "operational" ? "Active watchlist" : "Baseline",
      tone: "neutral" as const,
    },
    {
      icon: Radar,
      label: "Pages tracked",
      value: loading ? "--" : String(metrics.pagesTracked),
      trend: loading ? "Syncing" : "Pricing + product URLs",
      tone: "neutral" as const,
    },
    {
      icon: GitCompareArrows,
      label: "Changes this week",
      value: loading ? "--" : String(metrics.changesThisWeek),
      trend: metrics.changesThisWeek ? "Snapshot diffs" : "No diffs yet",
      tone: metrics.changesThisWeek ? ("attention" as const) : ("neutral" as const),
    },
    {
      icon: Clock3,
      label: "Analyst hours saved",
      value: loading ? "--" : String(metrics.analystHoursSaved),
      trend: "~2.5h per detected change",
      tone: metrics.analystHoursSaved ? ("live" as const) : ("neutral" as const),
    },
    {
      icon: Building2,
      label: "Strategic accounts affected",
      value: loading ? "--" : String(metrics.strategicAccountsAffected),
      trend: metrics.strategicAccountsAffected ? "Renewal risk flagged" : "None flagged",
      tone: metrics.strategicAccountsAffected ? ("attention" as const) : ("neutral" as const),
    },
    {
      icon: TrendingUp,
      label: "Reports generated",
      value: loading ? "--" : String(metrics.reportsGenerated),
      trend: `${metrics.activeMonitors} active monitor${metrics.activeMonitors === 1 ? "" : "s"}`,
      tone: metrics.reportsGenerated ? ("live" as const) : ("neutral" as const),
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  );
}
