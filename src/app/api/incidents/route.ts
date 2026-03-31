import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
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

    if (refresh || !companyId) {
      const incidents = await aggregateIncidents();
      
      for (const incident of incidents.slice(0, 100)) {
        const existingQuery = await adminDb
          .collection("incidents")
          .where("title", "==", incident.title)
          .limit(1)
          .get();

        if (existingQuery.empty) {
          await adminDb.collection("incidents").add({
            ...incident,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    let incidentsQuery = adminDb
      .collection("incidents")
      .orderBy("discoveredAt", "desc")
      .limit(limit);

    if (companyId) {
      incidentsQuery = adminDb
        .collection("incidents")
        .where("companyId", "==", companyId)
        .orderBy("discoveredAt", "desc")
        .limit(limit);
    }

    const snapshot = await incidentsQuery.get();
    
    let incidents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (severity) {
      incidents = incidents.filter(i => 
        (i as { severity?: string }).severity === severity
      );
    }

    if (status) {
      incidents = incidents.filter(i => 
        (i as { status?: string }).status === status
      );
    }

    if (source) {
      incidents = incidents.filter(i => {
        const sources = (i as { sources?: Array<{ type: string }> }).sources || [];
        return sources.some(s => s.type === source);
      });
    }

    return NextResponse.json({ incidents });
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

    const incidentId = uuidv4();
    const incident = {
      id: incidentId,
      companyId: companyId || null,
      title,
      summary,
      description: description || "",
      severity: severity || "Medium",
      status: "investigating",
      sources: sources || [],
      exposedData: exposedData || [],
      discoveredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection("incidents").doc(incidentId).set(incident);

    return NextResponse.json({ incident, isNew: true });
  } catch (error) {
    console.error("Error creating incident:", error);
    return NextResponse.json(
      { error: "Failed to create incident" },
      { status: 500 }
    );
  }
}
