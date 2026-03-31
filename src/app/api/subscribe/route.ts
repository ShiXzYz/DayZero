import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { userId, email, topics, severityThreshold, enableEmail, enablePush, fcmToken } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "User ID and email are required" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      notificationPreferences: {
        email: enableEmail !== false,
        push: enablePush === true,
        severityThreshold: severityThreshold || "High",
        topics: topics || [],
      },
      updatedAt: new Date().toISOString(),
    };

    if (fcmToken) {
      updateData.fcmToken = fcmToken;
    }

    await userRef.update(updateData);

    const subscriptionId = uuidv4();
    await adminDb.collection("subscriptions").doc(subscriptionId).set({
      id: subscriptionId,
      userId,
      email,
      topics: topics || [],
      severityThreshold: severityThreshold || "High",
      enableEmail: enableEmail !== false,
      enablePush: enablePush === true,
      fcmToken: fcmToken || null,
      createdAt: new Date().toISOString(),
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      subscriptionId,
      message: "Notification preferences updated successfully",
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
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

    const subscriptionsQuery = await adminDb
      .collection("subscriptions")
      .where("userId", "==", userId)
      .where("isActive", "==", true)
      .get();

    if (subscriptionsQuery.empty) {
      return NextResponse.json({ subscriptions: [] });
    }

    const subscriptions = subscriptionsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get("subscriptionId");

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    await adminDb.collection("subscriptions").doc(subscriptionId).update({
      isActive: false,
      unsubscribedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 }
    );
  }
}
