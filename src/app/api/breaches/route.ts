import { NextRequest, NextResponse } from "next/server";
import { checkBreaches, getBreachByName } from "@/lib/hibp";
import { calculateRiskScore } from "@/lib/risk-score";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const breaches = await checkBreaches(email);
    const riskScore = calculateRiskScore(breaches);

    if (userId) {
      const userRef = adminDb.collection("users").doc(userId);
      await userRef.update({
        lastChecked: new Date().toISOString(),
        breachCount: breaches.length,
        riskScore: riskScore.total,
        updatedAt: new Date().toISOString(),
      });

      for (const breach of breaches) {
        const existingQuery = await adminDb
          .collection("userBreaches")
          .where("userId", "==", userId)
          .where("breach.id", "==", breach.id)
          .limit(1)
          .get();

        if (existingQuery.empty) {
          await adminDb.collection("userBreaches").add({
            userId: userId,
            breach: breach,
            addedDate: new Date().toISOString(),
            isResolved: false,
          });

          await adminDb.collection("alerts").add({
            userId: userId,
            type: "new_breach",
            title: "New Breach Detected",
            message: `${breach.title} has exposed your data. Take action to secure your accounts.`,
            severity: "High",
            relatedBreachId: breach.id,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({
      breachCount: breaches.length,
      riskScore: riskScore,
      breaches: breaches,
    });
  } catch (error) {
    console.error("Error checking breaches:", error);
    return NextResponse.json(
      { error: "Failed to check breaches" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (name) {
      const breach = await getBreachByName(name);
      if (!breach) {
        return NextResponse.json(
          { error: "Breach not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ breach });
    }

    return NextResponse.json(
      { error: "Breach name is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching breach:", error);
    return NextResponse.json(
      { error: "Failed to fetch breach data" },
      { status: 500 }
    );
  }
}
