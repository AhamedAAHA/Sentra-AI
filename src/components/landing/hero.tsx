"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Activity, ShieldAlert, TrendingUp } from "lucide-react";
import { AiOrb } from "@/components/shared/ai-orb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const cards = [
  { icon: TrendingUp, label: "Market pulse", value: "+31%", detail: "AI infra demand" },
  { icon: ShieldAlert, label: "Risk radar", value: "14", detail: "critical shifts" },
  { icon: Activity, label: "Live signals", value: "8.2k", detail: "sources scanned" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-36 md:pb-32 md:pt-44">
      <div className="container grid items-center gap-14 lg:grid-cols-[1.04fr_0.96fr]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Badge variant="cyan" className="mb-6">
            Live web intelligence for autonomous enterprises
          </Badge>
          <h1 className="max-w-5xl text-5xl font-semibold tracking-[-0.06em] text-white md:text-7xl xl:text-8xl">
            <span className="premium-gradient-text">
              Transform the Live Web into Autonomous Enterprise Intelligence
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/65 md:text-xl">
            Sentra AI uses Bright Data, OpenAI, and real-time web intelligence to help
            enterprises monitor competitors, risks, market signals, and opportunities
            autonomously.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" variant="neon">
              <Link href="/dashboard">
                Enter Sentra OS <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/chat">Ask the AI analyst</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {cards.map((card) => (
              <Card key={card.label} className="p-4" data-float>
                <card.icon className="mb-4 h-5 w-5 text-sentra-cyan" />
                <p className="text-xs uppercase tracking-[0.3em] text-white/35">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
                <p className="text-sm text-white/50">{card.detail}</p>
              </Card>
            ))}
          </div>
        </motion.div>
        <motion.div
          className="relative min-h-[540px]"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.1 }}
        >
          <div className="absolute inset-0 grid place-items-center">
            <AiOrb size="lg" />
          </div>
          <Card className="absolute left-0 top-8 w-64 p-5" data-float glow>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-100/60">Bright Data</p>
            <p className="mt-3 text-2xl font-semibold text-white">19,482</p>
            <p className="text-sm text-white/50">web signals enriched this hour</p>
          </Card>
          <Card className="absolute bottom-16 right-0 w-72 p-5" data-float glow>
            <p className="text-xs uppercase tracking-[0.3em] text-violet-100/60">OpenAI analysis</p>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Pricing pressure detected. Recommended action: launch competitive retention
              briefing for strategic accounts.
            </p>
          </Card>
          <Card className="absolute right-10 top-16 w-52 p-5" data-float>
            <p className="text-sm text-white/60">Confidence</p>
            <p className="mt-2 text-4xl font-semibold text-white">94%</p>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div className="h-2 w-[94%] rounded-full bg-gradient-to-r from-sentra-cyan to-sentra-violet" />
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
