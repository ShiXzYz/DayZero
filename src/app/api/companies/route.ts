import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/admin";

const POPULAR_COMPANIES = [
  { id: "1", name: "Microsoft", domain: "microsoft.com", industry: "Technology", is_public: true },
  { id: "2", name: "Google", domain: "google.com", industry: "Technology", is_public: true },
  { id: "3", name: "Amazon", domain: "amazon.com", industry: "Retail", is_public: true },
  { id: "4", name: "Apple", domain: "apple.com", industry: "Technology", is_public: true },
  { id: "5", name: "Meta", domain: "meta.com", industry: "Technology", is_public: true },
  { id: "6", name: "Netflix", domain: "netflix.com", industry: "Technology", is_public: true },
  { id: "7", name: "JPMorgan Chase", domain: "jpmorganchase.com", industry: "Finance", is_public: true },
  { id: "8", name: "Walmart", domain: "walmart.com", industry: "Retail", is_public: true },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const industry = searchParams.get("industry");
    const limit = parseInt(searchParams.get("limit") || "20");

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.warn("[API /companies GET] Supabase not configured, using demo data");
      let companies = POPULAR_COMPANIES;
      if (query) {
        companies = companies.filter(c => 
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.domain.toLowerCase().includes(query.toLowerCase())
        );
      }
      if (industry) {
        companies = companies.filter(c => c.industry === industry);
      }
      return NextResponse.json({ companies: companies.slice(0, limit), isDemo: true });
    }
    
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
        { companies: POPULAR_COMPANIES, error: error.message, isDemo: true },
        { status: 200 }
      );
    }

    return NextResponse.json({ companies: companies || POPULAR_COMPANIES });
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
