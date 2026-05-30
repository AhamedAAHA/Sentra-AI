import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { getTimelineForApi } from "@/lib/monitor-timeline";
import {
  changesThisWeek,
  getServerChanges,
  loadDetectedChanges,
} from "@/services/change-detection";
import { presetCompetitors } from "@/lib/demo/preset-scenario";

export const runtime = "nodejs";

const HOURS_SAVED_PER_CHANGE = 2.5;

export async function GET() {
  try {
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;

    const timeline = getTimelineForApi(auth.user.id);
    const allChanges = [
      ...getServerChanges("global", auth.user.id),
      ...loadDetectedChanges(),
    ];
    const uniqueChanges = allChanges.filter(
      (change, index, arr) => arr.findIndex((item) => item.id === change.id) === index,
    );
    const weeklyChanges = changesThisWeek(uniqueChanges);
    const changeEvents = timeline.filter((event) => event.type === "change_detected");
    const reportEvents = timeline.filter((event) => event.type === "report_generated");
    const monitorIds = new Set(timeline.map((event) => event.monitorId).filter(Boolean));

    const affectedAccounts = new Set<string>();
    timeline.forEach((event) => {
      event.affectedAccounts?.forEach((account) => affectedAccounts.add(account));
    });
    changeEvents.forEach((event) => {
      event.affectedAccounts?.forEach((account) => affectedAccounts.add(account));
    });

    const pagesTracked = Math.max(
      presetCompetitors.length,
      new Set(uniqueChanges.map((change) => change.sourceUrl)).size || 3,
    );

    return NextResponse.json({
      metrics: {
        monitoredCompetitors: Math.max(presetCompetitors.length, monitorIds.size || 3),
        pagesTracked,
        changesThisWeek: Math.max(weeklyChanges, changeEvents.length),
        analystHoursSaved: Math.round(Math.max(weeklyChanges, changeEvents.length) * HOURS_SAVED_PER_CHANGE),
        strategicAccountsAffected: Math.max(affectedAccounts.size, changeEvents.length ? 3 : 0),
        activeMonitors: Math.max(monitorIds.size, 1),
        reportsGenerated: reportEvents.length,
      },
      source: timeline.length ? "operational" : "baseline",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Metrics unavailable.",
        metrics: {
          monitoredCompetitors: 3,
          pagesTracked: 3,
          changesThisWeek: 0,
          analystHoursSaved: 0,
          strategicAccountsAffected: 0,
          activeMonitors: 0,
          reportsGenerated: 0,
        },
        source: "baseline",
      },
      { status: 500 },
    );
  }
}
