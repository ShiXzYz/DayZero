import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const industry = searchParams.get("industry");
    const limit = parseInt(searchParams.get("limit") || "20");

    let snapshot;
    
    if (query) {
      const startAt = query.toLowerCase();
      const endAt = query.toLowerCase() + "\uf8ff";
      snapshot = await adminDb
        .collection("companies")
        .orderBy("name")
        .startAt(startAt)
        .endAt(endAt)
        .limit(limit)
        .get();
    } else {
      snapshot = await adminDb
        .collection("companies")
        .limit(limit)
        .get();
    }
    
    let companies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (industry) {
      companies = companies.filter(c => 
        (c as { industry?: string }).industry?.toLowerCase() === industry.toLowerCase()
      );
    }

    return NextResponse.json({ companies });
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

    const existingQuery = await adminDb
      .collection("companies")
      .where("domain", "==", domain.toLowerCase())
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return NextResponse.json({
        company: { id: existingQuery.docs[0].id, ...existingQuery.docs[0].data() },
        isNew: false,
      });
    }

    const companyId = uuidv4();
    const company = {
      id: companyId,
      name,
      domain: domain.toLowerCase(),
      ticker: ticker || null,
      industry: industry || "Technology",
      size: size || "medium",
      isPublic: isPublic || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection("companies").doc(companyId).set(company);

    return NextResponse.json({ company, isNew: true });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
