import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";
import { aggregateIncidents } from "@/lib/sources";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "50");
    const refresh = searchParams.get("refresh") === "true";

    const supabase = getSupabaseClient();

    if (refresh || !companyId) {
      const incidents = await aggregateIncidents();
      
      for (const incident of incidents.slice(0, 100)) {
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
    }

    let queryBuilder = supabase
      .from("incidents")
      .select("*")
      .order("discovered_at", { ascending: false })
      .limit(limit);

    if (companyId) {
      queryBuilder = queryBuilder.eq("company_id", companyId);
    }

    const { data: incidents, error } = await queryBuilder;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch incidents" },
        { status: 500 }
      );
    }

    let formattedIncidents = (incidents || []).map(incident => ({
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

    if (severity) {
      formattedIncidents = formattedIncidents.filter(i => i.severity === severity);
    }

    if (status) {
      formattedIncidents = formattedIncidents.filter(i => i.status === status);
    }

    if (source) {
      formattedIncidents = formattedIncidents.filter(i =>
        i.sources?.some((s: { type: string }) => s.type === source)
      );
    }

    return NextResponse.json({ incidents: formattedIncidents });
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 }
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
