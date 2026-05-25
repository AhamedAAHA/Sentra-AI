"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  trend: string;
};

export function MetricCard({ icon: Icon, label, value, trend }: MetricCardProps) {
  return (
    <motion.div whileHover={{ y: -6, scale: 1.015 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
      <Card className="p-5" glow>
        <div className="flex items-start justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/10 text-sentra-cyan">
            <Icon className="h-5 w-5" />
          </span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
            {trend}
          </span>
        </div>
        <p className="mt-8 text-sm uppercase tracking-[0.24em] text-white/35">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      </Card>
    </motion.div>
  );
}
