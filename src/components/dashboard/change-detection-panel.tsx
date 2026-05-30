"use client";

import { ExternalLink, GitCompareArrows } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DetectedChange } from "@/types/intelligence";

type ChangeDetectionPanelProps = {
  changes: DetectedChange[];
  className?: string;
};

export function ChangeDetectionPanel({ changes, className }: ChangeDetectionPanelProps) {
  if (!changes.length) return null;

  return (
    <Card className={className} glow>
      <div className="flex items-center gap-3 p-5 md:p-6 pb-0">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-300/10 text-sentra-cyan">
          <GitCompareArrows className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-white/35">Snapshot diff</p>
          <h3 className="text-xl font-semibold text-white">Detected changes</h3>
        </div>
        <Badge variant="cyan" className="ml-auto">
          {changes.length} change{changes.length === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="grid gap-3 p-5 md:p-6">
        {changes.map((change) => (
          <div key={change.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={change.severity === "critical" || change.severity === "high" ? "risk" : "default"}>
                {change.severity}
              </Badge>
              <Badge variant="default">{change.category}</Badge>
              <span className="text-xs text-white/38">
                {new Date(change.detectedAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-white">
              {change.field} changed from {change.oldValue} to {change.newValue}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/55">{change.impact}</p>
            <a
              href={change.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-100/75 hover:text-cyan-100"
            >
              {change.sourceUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
    </Card>
  );
}
