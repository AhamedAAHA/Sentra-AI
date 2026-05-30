"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";

type ProviderRow = {
  id: string;
  label: string;
  color: string;
  requestsToday: number;
  budgetUnits: number;
  usagePercent: number;
  detail: string;
  live: boolean;
};

type UsagePayload = {
  providers: ProviderRow[];
  updatedAt: string;
};

const POLL_MS = 30_000;

export function ProviderUsageChart() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<UsagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/usage/providers", { cache: "no-store" });
      const payload = (await response.json()) as UsagePayload & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not load provider usage.");
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load provider usage.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(interval);
  }, [load]);

  const chartData =
    data?.providers.map((provider) => ({
      name: provider.label,
      usage: provider.usagePercent,
      color: provider.color,
      detail: provider.detail,
    })) ?? [];

  return (
    <Card className="p-6" glow>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-white/35">Provider credits</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Usage today</h3>
          <p className="mt-1 text-sm text-white/45">
            Bright Data balance from API · others from Sentra call counts vs daily budget
          </p>
        </div>
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
          {loading ? "Loading…" : error ? "Offline" : "Live · 30s"}
        </span>
      </div>

      {data?.providers.length ? (
        <ul className="mb-4 space-y-1.5 text-xs text-white/50">
          {data.providers.map((provider) => (
            <li key={provider.id} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: provider.color }} />
              <span className="font-medium text-white/80">{provider.label}</span>
              <span>— {provider.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="h-80">
        {error ? (
          <div className="flex h-full items-center justify-center rounded-3xl border border-rose-300/20 bg-rose-400/10 px-4 text-center text-sm text-rose-100">
            {error}
          </div>
        ) : mounted && chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.38)"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={52}
              />
              <YAxis
                stroke="rgba(255,255,255,0.38)"
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(8, 12, 28, 0.95)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "18px",
                  color: "white",
                  fontSize: 12,
                }}
                formatter={(value, _name, item) => [
                  `${Number(value).toFixed(1)}% used`,
                  (item.payload as { detail?: string }).detail ?? "",
                ]}
              />
              <Bar dataKey="usage" radius={[10, 10, 4, 4]} maxBarSize={48}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full animate-pulse rounded-3xl bg-white/[0.04]" />
        )}
      </div>
    </Card>
  );
}
