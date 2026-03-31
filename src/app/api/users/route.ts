import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { checkBreaches } from "@/lib/hibp";
import { calculateRiskScore } from "@/lib/risk-score";

function hashEmail(email: string): string {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const emailHash = hashEmail(email);
    const userId = uuidv4();

    const existingQuery = await adminDb
      .collection("users")
      .where("emailHash", "==", emailHash)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      const existingUser = existingQuery.docs[0];
      const breaches = await checkBreaches(email);
      const riskScore = calculateRiskScore(breaches);

      return NextResponse.json({
        userId: existingUser.id,
        isNew: false,
        email: email,
        breachCount: breaches.length,
        riskScore: riskScore.total,
        message: "Welcome back! Your risk profile has been updated.",
      });
    }

    const breaches = await checkBreaches(email);
    const riskScore = calculateRiskScore(breaches);

    const userDoc = {
      id: userId,
      email: email,
      emailHash: emailHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      riskScore: riskScore.total,
      breachCount: breaches.length,
      lastChecked: new Date().toISOString(),
      notificationPreferences: {
        email: true,
        push: false,
        severityThreshold: "High",
        topics: [],
      },
    };

    await adminDb.collection("users").doc(userId).set(userDoc);

    for (const breach of breaches) {
      const userBreachDoc = {
        userId: userId,
        breach: breach,
        addedDate: new Date().toISOString(),
        isResolved: false,
      };
      await adminDb.collection("userBreaches").add(userBreachDoc);
    }

    return NextResponse.json({
      userId: userId,
      isNew: true,
      email: email,
      breachCount: breaches.length,
      riskScore: riskScore.total,
      breaches: breaches.map(b => ({ id: b.id, name: b.name, title: b.title })),
      message: breaches.length > 0
        ? `Found ${breaches.length} breach${breaches.length > 1 ? "es" : ""} associated with this email.`
        : "No breaches found. We'll continue monitoring.",
    });
  } catch (error) {
    console.error("Error creating/fetching user:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const breachesQuery = await adminDb
      .collection("userBreaches")
      .where("userId", "==", userId)
      .get();

    const breaches = breachesQuery.docs.map(doc => doc.data().breach);

    return NextResponse.json({
      user: userData,
      breaches: breaches,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
