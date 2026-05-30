"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, FileCheck2, Radar, ShieldAlert } from "lucide-react";
import { LandingAuthLink } from "@/components/landing/landing-auth-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SENTRA_HOME } from "@/lib/landing/auth-links";
import { cn } from "@/lib/utils";

const HeroVisual = dynamic(
  () => import("@/components/landing/hero-visual").then((module) => module.HeroVisual),
  { ssr: false },
);

const cards = [
  { icon: Radar, label: "Monitor", value: "Scheduled", detail: "cron checks + manual Check now" },
  { icon: ShieldAlert, label: "Verify", value: "Source", detail: "claim-level evidence checks" },
  { icon: FileCheck2, label: "Report", value: "Board", detail: "executive action briefings" },
];

function HeroCallout({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 backdrop-blur-[6px] sm:px-4 sm:py-3.5",
        className,
      )}
      data-float
    >
      {children}
    </div>
  );
}

function HeroVisualLayer({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      <HeroVisual />
      <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-sentra-ink to-transparent sm:w-1/3 lg:w-2/5" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-sentra-ink to-transparent sm:h-20" />
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-sentra-ink/80 to-transparent" />

      <HeroCallout className="absolute left-[4%] top-[10%] w-[min(13.5rem,74%)] sm:left-[6%] sm:top-[12%] sm:w-52">
        <p className="text-[0.6rem] uppercase tracking-[0.26em] text-cyan-100/60 sm:text-[0.65rem]">
          Monitor workflow
        </p>
        <p className="mt-1.5 text-lg font-semibold text-white sm:mt-2 sm:text-xl">Live watch</p>
        <p className="mt-0.5 text-[0.65rem] leading-4 text-white/50 sm:text-xs">
          competitors, pricing, hiring, sentiment
        </p>
      </HeroCallout>

      <HeroCallout className="absolute right-[4%] top-[18%] w-[min(10rem,58%)] sm:right-[6%] sm:top-[20%] sm:w-44">
        <p className="text-[0.65rem] text-white/60 sm:text-xs">Evidence</p>
        <p className="mt-1 text-base font-semibold leading-snug text-white sm:text-lg">SERP + Unlocker</p>
        <p className="mt-0.5 text-[0.6rem] leading-4 text-white/45 sm:text-[0.65rem]">
          Live vs Sample labeled in the product
        </p>
      </HeroCallout>

      <HeroCallout className="absolute bottom-[8%] left-[4%] right-[4%] sm:bottom-[10%] sm:left-auto sm:right-[6%] sm:w-[min(18rem,84%)]">
        <p className="text-[0.6rem] uppercase tracking-[0.26em] text-violet-100/60 sm:text-[0.65rem]">
          Executive report
        </p>
        <p className="mt-1.5 text-[0.65rem] leading-5 text-white/70 sm:mt-2 sm:text-xs">
          Pricing pressure verified. Recommended action: brief strategic accounts and prepare retention
          offers.
        </p>
      </HeroCallout>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36 lg:pb-20 lg:pt-40">
      <HeroVisualLayer className="hidden lg:block lg:inset-y-6 lg:left-[38%] lg:right-[-6%] xl:inset-y-10 xl:left-[40%] xl:right-[-4%]" />

      <div className="container relative z-10 flex flex-col gap-12 lg:gap-14 xl:gap-16">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[0.92fr_1.08fr] xl:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex flex-col items-start text-left lg:max-w-[34rem] xl:max-w-[36rem]"
          >
            <Badge variant="cyan" className="mb-6">
              Autonomous intelligence command center
            </Badge>

            <h1 className="max-w-[18ch] text-balance font-display text-[clamp(2.85rem,5.2vw,5.75rem)] font-bold leading-[1.04] tracking-[-0.025em] text-white xl:max-w-[20ch]">
              <span className="premium-gradient-text">
                Monitor competitors, verify evidence, and brief leaders automatically
              </span>
            </h1>

            <p className="type-body-lg mt-5 max-w-[48ch] text-pretty text-white/62 lg:mt-6">
              Sentra AI turns live web signals into verified intelligence reports with risk scoring,
              source evidence, action plans, and executive briefings for fast-moving teams.
            </p>

            <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center">
              <Button asChild size="lg" variant="neon" className="w-full sm:w-auto">
                <LandingAuthLink href={SENTRA_HOME}>
                  Launch workspace <ArrowRight className="h-5 w-5" />
                </LandingAuthLink>
              </Button>
              <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto">
                <LandingAuthLink href="/reports">View reports</LandingAuthLink>
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="relative mx-auto aspect-[5/6] w-full max-w-[400px] sm:aspect-[4/5] sm:max-w-[440px] lg:min-h-[480px] lg:max-w-none xl:min-h-[520px]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.1 }}
          >
            <HeroVisualLayer className="lg:hidden" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 grid gap-3 sm:grid-cols-3 sm:gap-4"
        >
          {cards.map((card) => (
            <Card key={card.label} className="flex h-full flex-col p-4 sm:p-5" data-float>
              <card.icon className="mb-3 h-5 w-5 text-sentra-cyan sm:mb-4" />
              <p className="text-[0.65rem] uppercase tracking-[0.28em] text-white/35 sm:text-xs">{card.label}</p>
              <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">{card.value}</p>
              <p className="mt-1 text-sm leading-6 text-white/50">{card.detail}</p>
            </Card>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
