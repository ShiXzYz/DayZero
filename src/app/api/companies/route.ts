import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const industry = searchParams.get("industry");
    const limit = parseInt(searchParams.get("limit") || "20");

    const supabase = getSupabaseClient();
    
    let queryBuilder = supabase
      .from("companies")
      .select("*")
      .limit(limit);

    if (query) {
      queryBuilder = queryBuilder.ilike("name", `%${query}%`);
    }

    if (industry) {
      queryBuilder = queryBuilder.eq("industry", industry);
    }

    const { data: companies, error } = await queryBuilder;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch companies" },
        { status: 500 }
      );
    }

    return NextResponse.json({ companies: companies || [] });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
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
