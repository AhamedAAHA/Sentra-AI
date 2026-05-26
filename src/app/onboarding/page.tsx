"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BellRing,
  Bot,
  CheckCircle2,
  DatabaseZap,
  LayoutDashboard,
  Radar,
  ScanSearch,
  Settings,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ParticleField } from "@/components/shared/particle-field";
import { toast } from "sonner";
import { getBrowserClient, isBrowserSupabaseConfigured } from "@/lib/supabase/client";

const guideSections = [
  {
    icon: LayoutDashboard,
    title: "Read the dashboard",
    description: "Start with live signal velocity, market movement, current risk, and active briefings.",
    href: "/dashboard",
  },
  {
    icon: Bot,
    title: "Ask Sentra",
    description: "Use chat for live-web research, competitor analysis, summaries, and voice responses.",
    href: "/chat?prompt=Summarize%20current%20market%20risks",
  },
  {
    icon: BellRing,
    title: "Create monitors",
    description: "Describe what you care about in plain language. AI turns it into watch rules and alerts.",
    href: "/alerts",
  },
  {
    icon: ScanSearch,
    title: "Investigate evidence",
    description: "Use AI Analyst and Visual Forensics when a signal needs deeper review or image-based context.",
    href: "/analyst",
  },
];

const quickStart = [
  "Connect Bright Data and OpenAI keys in Settings or .env.local.",
  "Ask one live market question in chat.",
  "Create one monitor for a competitor, pricing change, or risk signal.",
  "Open the first alert report and review the AI assistant summary.",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [brightDataReady, setBrightDataReady] = useState(false);
  const [openAiReady, setOpenAiReady] = useState(false);

  useEffect(() => {
    fetch("/api/health/integrations")
      .then((response) => response.json())
      .then((data) => {
        setBrightDataReady(Boolean(data?.brightData?.ready));
        setOpenAiReady(Boolean(data?.openai?.ready ?? data?.openAI?.ready));
      })
      .catch(() => {
        setBrightDataReady(false);
        setOpenAiReady(false);
      });
  }, []);

  async function completeOnboarding() {
    if (isBrowserSupabaseConfigured()) {
      const supabase = getBrowserClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from("profiles")
            .update({ onboarding_completed: true })
            .eq("id", user.id);
          if (error) {
            toast.error("Could not save onboarding progress.", { description: error.message });
            return;
          }
        }
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen">
      <ParticleField />
      <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="p-6 md:p-8" glow>
            <Badge variant="violet">New user guide</Badge>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Welcome to Sentra AI
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/58">
              This guide shows the fastest path from a new account to useful intelligence:
              connect sources, ask Sentra, create monitors, and review alert reports.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button variant="neon" size="lg" onClick={completeOnboarding}>
                Enter dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                  Configure integrations
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="p-6" glow>
            <p className="text-sm uppercase tracking-[0.24em] text-white/35">Setup status</p>
            <div className="mt-5 grid gap-3">
              <StatusRow ready={brightDataReady} label="Bright Data" description="Live web evidence and signal collection" />
              <StatusRow ready={openAiReady} label="OpenAI" description="Chat, monitor intent, and alert summaries" />
              <StatusRow ready label="Workspace" description="Dashboard, chat, alerts, and analyst tools" />
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {guideSections.map((section) => (
            <Card key={section.title} className="p-5" glow>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/10 text-sentra-cyan">
                <section.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-white">{section.title}</h2>
              <p className="mt-2 min-h-20 text-sm leading-6 text-white/55">{section.description}</p>
              <Link href={section.href} className="mt-4 inline-flex items-center gap-2 text-sm text-sentra-cyan hover:text-white">
                Open
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          ))}
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-6" glow>
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-sentra-cyan" />
              <h2 className="text-xl font-semibold text-white">First 10 minutes</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {quickStart.map((item, index) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-cyan-100">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-white/62">{item}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6" glow>
            <div className="flex items-center gap-3">
              <Radar className="h-5 w-5 text-sentra-cyan" />
              <h2 className="text-xl font-semibold text-white">Example monitor prompts</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {[
                "Alert me when Tesla pricing incentives change.",
                "Tell me if a competitor launches an autonomous procurement product.",
                "Watch for negative sentiment about enterprise cloud billing.",
                "Monitor AI infrastructure hiring spikes in Singapore.",
              ].map((prompt) => (
                <Link
                  key={prompt}
                  href={`/alerts?guidePrompt=${encodeURIComponent(prompt)}`}
                  className="sentra-focus rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-6 text-white/62 transition hover:border-cyan-200/30 hover:text-white"
                >
                  {prompt}
                </Link>
              ))}
            </div>
          </Card>
        </section>

        <div className="mt-8 flex justify-center">
          <Button variant="neon" size="lg" onClick={completeOnboarding}>
            Finish guide and enter Sentra
          </Button>
        </div>
      </div>
    </main>
  );
}

function StatusRow({
  ready,
  label,
  description,
}: {
  ready: boolean;
  label: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      {ready ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
      ) : (
        <DatabaseZap className="mt-0.5 h-5 w-5 shrink-0 text-sentra-cyan" />
      )}
      <div className="min-w-0">
        <p className="font-medium text-white">{label}</p>
        <p className="mt-1 text-sm leading-5 text-white/45">{description}</p>
      </div>
    </div>
  );
}
