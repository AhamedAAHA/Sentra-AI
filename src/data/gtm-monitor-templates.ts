export type GtmMonitorTemplate = {
  id: string;
  title: string;
  category: "competitor" | "pricing" | "hiring" | "market" | "risk";
  requirement: string;
  hint?: string;
};

export const gtmMonitorTemplates: GtmMonitorTemplate[] = [
  {
    id: "competitor-launch",
    title: "Competitor product launches",
    category: "competitor",
    requirement:
      "Alert when direct competitors announce new products, major feature releases, or strategic partnerships that affect our GTM positioning.",
    hint: "Add a competitor HTTPS URL for Web Unlocker checks.",
  },
  {
    id: "pricing-shift",
    title: "Pricing & packaging changes",
    category: "pricing",
    requirement:
      "Monitor competitor pricing pages, plan tiers, discounts, and packaging changes across enterprise and self-serve offers.",
    hint: "Paste pricing page URL for Unlocker + Scraper extraction.",
  },
  {
    id: "hiring-surge",
    title: "Hiring & GTM expansion signals",
    category: "hiring",
    requirement:
      "Track hiring spikes, new sales leadership roles, and GTM job postings that indicate expansion into our target segments.",
  },
  {
    id: "market-sentiment",
    title: "Market sentiment & reviews",
    category: "market",
    requirement:
      "Watch customer sentiment, review site narratives, and social chatter about competitors in our category.",
  },
  {
    id: "risk-regulatory",
    title: "Regulatory & risk signals",
    category: "risk",
    requirement:
      "Monitor regulatory actions, security incidents, and compliance news affecting vendors in our competitive set.",
  },
];
