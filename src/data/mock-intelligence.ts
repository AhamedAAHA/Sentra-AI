import type { IntelligenceAnalysis, IntelligenceSignal } from "@/types/intelligence";

export const signalStream: IntelligenceSignal[] = [
  {
    id: "sig-001",
    title: "Tesla adjusted Model Y leasing incentives in California",
    source: "Bright Data SERP + pricing monitor",
    summary: "Detected a 7.8% effective discount increase across regional landing pages.",
    category: "pricing",
    severity: "high",
    confidence: 0.91,
    timestamp: "3 min ago",
  },
  {
    id: "sig-002",
    title: "AI infrastructure hiring spike in Singapore",
    source: "Hiring signal crawler",
    summary: "32 new roles posted by funded AI startups across inference, MLOps, and sales engineering.",
    category: "hiring",
    severity: "medium",
    confidence: 0.86,
    timestamp: "11 min ago",
  },
  {
    id: "sig-003",
    title: "Negative sentiment lift around cloud billing",
    source: "Social mention monitor",
    summary: "Complaint volume rose 18% after new enterprise pricing screenshots circulated.",
    category: "sentiment",
    severity: "critical",
    confidence: 0.88,
    timestamp: "18 min ago",
  },
  {
    id: "sig-004",
    title: "Competitor launched autonomous procurement agent",
    source: "Website diff + press monitor",
    summary: "New product copy emphasizes workflow automation and invoice intelligence.",
    category: "competitor",
    severity: "high",
    confidence: 0.94,
    timestamp: "24 min ago",
  },
];

export const demoAnalysis: IntelligenceAnalysis = {
  summary:
    "Sentra detected fast-moving pricing, hiring, and sentiment shifts across the live web. The strongest opportunity is to position autonomous monitoring around cost control and competitive response speed.",
  risks: [
    "Competitor messaging is converging on autonomous agent workflows.",
    "Pricing volatility may trigger procurement scrutiny in enterprise accounts.",
    "Negative sentiment around cloud billing could bleed into adjacent AI platform narratives.",
  ],
  opportunities: [
    "Launch a pricing intelligence briefing for strategic accounts.",
    "Target Singapore AI infrastructure startups with partnership outreach.",
    "Publish trust content around transparent usage controls and alert governance.",
  ],
  recommendations: [
    "Open a critical watchlist for Tesla pricing and adjacent EV incentives.",
    "Brief sales leadership with a competitor battlecard within 24 hours.",
    "Escalate cloud billing sentiment to product marketing for counter-positioning.",
  ],
  confidenceScore: 0.89,
  signals: signalStream,
};
