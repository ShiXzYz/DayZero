import { NextRequest, NextResponse } from "next/server";
import { aggregateIncidents, MOCK_INCIDENTS } from "@/lib/sources";
import { clearCache, getCacheStats } from "@/lib/cache/incidents";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "50");
    const refresh = searchParams.get("refresh") === "true";
    const clearCacheParam = searchParams.get("clearCache") === "true";

    if (clearCacheParam) {
      clearCache();
    }

    console.log("=== /api/incidents ===");
    console.log(`Cache stats:`, getCacheStats());

    const aggregationResult = await aggregateIncidents();
    
    console.log(`Found ${aggregationResult.incidents.length} incidents`);
    console.log(`isMockData: ${aggregationResult.isMockData}`);

    let incidents = aggregationResult.incidents;

    if (severity) {
      incidents = incidents.filter(i => i.severity === severity);
    }

    if (status) {
      incidents = incidents.filter(i => i.status === status);
    }

    if (source) {
      incidents = incidents.filter(i =>
        i.sources?.some((s: { type: string }) => s.type === source)
      );
    }

    incidents = incidents.slice(0, limit);

    return NextResponse.json({ 
      incidents,
      isDemoData: aggregationResult.isMockData,
      sourceErrors: aggregationResult.sourceErrors,
      cacheStats: getCacheStats(),
    });
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      { 
        incidents: MOCK_INCIDENTS,
        isDemoData: true,
        sourceErrors: ["An error occurred. Showing demo incidents."],
      },
      { status: 200 }
    );
  }
}
