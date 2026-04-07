import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { aggregateIncidents, MOCK_INCIDENTS } from "@/lib/sources";
import { getSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "50");
    const refresh = searchParams.get("refresh") === "true";

    console.log("=== /api/incidents ===");
    console.log("Fetching live incidents from SEC EDGAR and news feeds...");

    const aggregationResult = await aggregateIncidents();
    
    console.log(`Found ${aggregationResult.incidents.length} incidents`);
    console.log(`isMockData: ${aggregationResult.isMockData}`);

    let incidents = aggregationResult.incidents;

    const supabase = getSupabaseClient();
    
    if (supabase && (refresh || companyId)) {
      try {
        for (const incident of incidents.slice(0, 50)) {
          const { data: existing } = await supabase
            .from("incidents")
            .select("id")
            .eq("title", incident.title)
            .limit(1)
            .single();

          if (!existing) {
            await supabase.from("incidents").insert({
              id: uuidv4(),
              company_id: incident.companyId || null,
              company_name: incident.companyName,
              company_domain: incident.companyDomain,
              title: incident.title,
              summary: incident.summary,
              description: incident.description,
              severity: incident.severity,
              status: incident.status,
              sources: incident.sources,
              exposed_data: incident.exposedData,
              discovered_at: incident.discoveredAt,
              breach_date: incident.breachDate || null,
            });
          }
        }
      } catch (dbError) {
        console.error("Database sync error (non-fatal):", dbError);
      }
    }

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, summary, description, severity, sources, exposedData } = body;

    if (!title || !summary) {
      return NextResponse.json({ error: "Title and summary are required" }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({
        incident: { id: uuidv4(), title, summary, isDemo: true },
        isNew: true,
        isDemo: true,
      });
    }

    const { data, error } = await supabase
      .from("incidents")
      .insert({
        id: uuidv4(),
        title,
        summary,
        description: description || "",
        severity: severity || "Medium",
        status: "investigating",
        sources: sources || [],
        exposed_data: exposedData || [],
        discovered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Failed to create incident" }, { status: 500 });
    }

    return NextResponse.json({ incident: data, isNew: true });
  } catch (error) {
    console.error("Error creating incident:", error);
    return NextResponse.json({ error: "Failed to create incident" }, { status: 500 });
  }
}
