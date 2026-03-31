import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    let query = adminDb
      .collection("alerts")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc");

    if (unreadOnly) {
      query = query.where("isRead", "==", false);
    }

    const snapshot = await query.limit(50).get();

    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, type, title, message, severity, relatedBreachId } = await request.json();

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const alert = {
      userId,
      type,
      title,
      message,
      severity: severity || "Medium",
      relatedBreachId: relatedBreachId || null,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("alerts").add(alert);

    return NextResponse.json({
      id: docRef.id,
      ...alert,
    });
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { alertId, isRead } = await request.json();

    if (!alertId) {
      return NextResponse.json(
        { error: "Alert ID is required" },
        { status: 400 }
      );
    }

    await adminDb.collection("alerts").doc(alertId).update({
      isRead: isRead !== undefined ? isRead : true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("alertId");

    if (!alertId) {
      return NextResponse.json(
        { error: "Alert ID is required" },
        { status: 400 }
      );
    }

    await adminDb.collection("alerts").doc(alertId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json(
      { error: "Failed to delete alert" },
      { status: 500 }
    );
  }
}
