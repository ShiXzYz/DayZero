import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/admin";
import { aggregateIncidents } from "@/lib/sources";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const industry = searchParams.get("industry");
    const limit = parseInt(searchParams.get("limit") || "50");

    const incidentsResult = await aggregateIncidents();
    const incidents = incidentsResult.incidents;

    const companyMap = new Map<string, any>();
    for (const incident of incidents) {
      const name = incident.companyName;
      if (!companyMap.has(name)) {
        const domain = name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
        companyMap.set(name, {
          id: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          name,
          domain,
          industry: "Technology",
          isPublic: true,
          incidentCount: 1
        });
      } else {
        companyMap.get(name).incidentCount++;
      }
    }

    let companies = Array.from(companyMap.values())
      .sort((a, b) => b.incidentCount - a.incidentCount);

    if (query) {
      companies = companies.filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.domain.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    if (industry) {
      companies = companies.filter(c => c.industry === industry);
    }

    return NextResponse.json({ 
      companies: companies.slice(0, limit),
      totalCount: companyMap.size
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies", companies: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, domain, ticker, industry, size, isPublic } = body;

    if (!name || !domain) {
      return NextResponse.json(
        { error: "Name and domain are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.error("[API /companies POST] Supabase not configured");
      return NextResponse.json({
        error: "Database not configured",
        isConfigured: false,
      }, { status: 503 });
    }
    
    const { data: existing } = await supabase
      .from("companies")
      .select("id, *")
      .eq("domain", domain.toLowerCase())
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({
        company: existing,
        isNew: false,
      });
    }

    const { data: company, error } = await supabase
      .from("companies")
      .insert({
        name,
        domain: domain.toLowerCase(),
        ticker: ticker || null,
        industry: industry || "Technology",
        size: size || "medium",
        is_public: isPublic || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create company" },
        { status: 500 }
      );
    }

    return NextResponse.json({ company, isNew: true });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
