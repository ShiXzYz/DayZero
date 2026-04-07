import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";
import { aggregateIncidents, MOCK_INCIDENTS } from "@/lib/sources";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const companyName = searchParams.get("companyName");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "50");
    const refresh = searchParams.get("refresh") === "true";

    const supabase = getSupabaseClient();
    let aggregationResult;
    let isDemoData = true;
    let sourceErrors: string[] = [];

    if (!supabase) {
      console.log("Supabase not configured, using mock data");
      return NextResponse.json({ 
        incidents: MOCK_INCIDENTS,
        isDemoData: true,
        sourceErrors: ["Database not configured. Showing demo incidents."],
      });
    }

    try {
      aggregationResult = await aggregateIncidents();
      isDemoData = aggregationResult.isMockData;
      sourceErrors = aggregationResult.sourceErrors;

      if ((refresh || !companyId) && !aggregationResult.isMockData) {
        for (const incident of aggregationResult.incidents.slice(0, 100)) {
          try {
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
          } catch (insertError) {
            console.error("Error inserting incident:", insertError);
          }
        }
      }
    } catch (aggError) {
      console.error("Aggregation error:", aggError);
      aggregationResult = { incidents: [], isMockData: true, sourceErrors: ["Live data unavailable."] };
      isDemoData = true;
    }

    try {
      let queryBuilder = supabase
        .from("incidents")
        .select("*")
        .order("discovered_at", { ascending: false })
        .limit(limit);

      if (companyId) {
        queryBuilder = queryBuilder.eq("company_id", companyId);
      }

      if (!companyId && companyName) {
        queryBuilder = queryBuilder.ilike("company_name", `%${companyName}%`);
      }

      const { data: incidents, error: queryError } = await queryBuilder;

      if (queryError) {
        console.error("Query error:", queryError);
      } else if (incidents && incidents.length > 0) {
        const formattedIncidents = incidents.map(incident => ({
          id: incident.id,
          companyId: incident.company_id,
          companyName: incident.company_name,
          companyDomain: incident.company_domain,
          title: incident.title,
          summary: incident.summary,
          description: incident.description,
          severity: incident.severity,
          status: incident.status,
          sources: incident.sources,
          exposedData: incident.exposed_data,
          discoveredAt: incident.discovered_at,
          breachDate: incident.breach_date,
          updatedAt: incident.updated_at,
        }));

        return NextResponse.json({ 
          incidents: formattedIncidents,
          isDemoData: false,
          sourceErrors: [],
        });
      }
    } catch (dbError) {
      console.error("Database query error:", dbError);
    }

    return NextResponse.json({ 
      incidents: MOCK_INCIDENTS,
      isDemoData: true,
      sourceErrors: ["No data in database. Showing demo incidents."],
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
    const {
      companyId,
      title,
      summary,
      description,
      severity,
      sources,
      exposedData,
    } = body;

    if (!title || !summary) {
      return NextResponse.json(
        { error: "Title and summary are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { 
          incident: {
            id: uuidv4(),
            title,
            summary,
            isDemo: true,
          },
          isNew: true,
          isDemo: true,
        },
        { status: 200 }
      );
    }

    const incidentId = uuidv4();

    const { data, error } = await supabase
      .from("incidents")
      .insert({
        id: incidentId,
        company_id: companyId || null,
        company_name: "",
        company_domain: "",
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
      return NextResponse.json(
        { error: "Failed to create incident" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      incident: {
        id: data.id,
        ...data,
      },
      isNew: true,
    });
  } catch (error) {
    console.error("Error creating incident:", error);
    return NextResponse.json(
      { error: "Failed to create incident" },
      { status: 500 }
    );
  }
}
