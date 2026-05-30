"use client";

import { MultiMarketChart } from "@/components/dashboard/multi-market-chart";
import { ProviderUsageChart } from "@/components/dashboard/provider-usage-chart";

export function IntelligenceCharts() {
  return (
    <div id="market" className="scroll-mt-28 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <MultiMarketChart />
      <ProviderUsageChart />
    </div>
  );
}
