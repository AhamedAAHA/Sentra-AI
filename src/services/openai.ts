import OpenAI from "openai";
import { demoAnalysis } from "@/data/mock-intelligence";
import type { IntelligenceAnalysis } from "@/types/intelligence";

const SYSTEM_PROMPT = `You are Sentra AI, an enterprise intelligence analyst.
Analyze live web evidence from Bright Data and user context.
Return concise boardroom-ready intelligence with:
- executive summary
- risks
- opportunities
- recommendations
- confidence score
Use a premium enterprise tone and never invent exact sources that were not provided.`;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function generateEnterpriseAnalysis(
  query: string,
  webEvidence: string,
): Promise<IntelligenceAnalysis> {
  const client = getOpenAIClient();
  if (!client) {
    return {
      ...demoAnalysis,
      summary: `${demoAnalysis.summary} Demo analysis generated for: "${query}".`,
    };
  }

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Query: ${query}\n\nBright Data evidence:\n${webEvidence}\n\nReturn JSON with keys: summary, risks, opportunities, recommendations, confidenceScore.`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return demoAnalysis;

  const parsed = JSON.parse(content) as Omit<IntelligenceAnalysis, "signals">;
  return {
    ...parsed,
    signals: demoAnalysis.signals,
  };
}

export async function generateChatResponse(message: string, webEvidence: string) {
  const analysis = await generateEnterpriseAnalysis(message, webEvidence);
  return `## Enterprise Intelligence Brief\n\n${analysis.summary}\n\n**Risks**\n${analysis.risks
    .map((risk) => `- ${risk}`)
    .join("\n")}\n\n**Opportunities**\n${analysis.opportunities
    .map((opportunity) => `- ${opportunity}`)
    .join("\n")}\n\n**Recommended actions**\n${analysis.recommendations
    .map((recommendation) => `- ${recommendation}`)
    .join("\n")}\n\nConfidence score: **${Math.round(analysis.confidenceScore * 100)}%**`;
}
