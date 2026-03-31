import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { v4 as uuidv4 } from "uuid";

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

    const snapshot = await adminDb
      .collection("follows")
      .where("userId", "==", userId)
      .get();

    const follows = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ follows });
  } catch (error) {
    console.error("Error fetching follows:", error);
    return NextResponse.json(
      { error: "Failed to fetch follows" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, companyId, companyName, notifyNewIncidents, notifyRiskIncrease } = await request.json();

    if (!userId || !companyId) {
      return NextResponse.json(
        { error: "User ID and Company ID are required" },
        { status: 400 }
      );
    }

    const existingQuery = await adminDb
      .collection("follows")
      .where("userId", "==", userId)
      .where("companyId", "==", companyId)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return NextResponse.json({
        follow: { id: existingQuery.docs[0].id, ...existingQuery.docs[0].data() },
        isNew: false,
      });
    }

    const followId = uuidv4();
    const follow = {
      id: followId,
      userId,
      companyId,
      companyName: companyName || "",
      createdAt: new Date().toISOString(),
      notifyNewIncidents: notifyNewIncidents !== false,
      notifyRiskIncrease: notifyRiskIncrease !== false,
    };

    await adminDb.collection("follows").doc(followId).set(follow);

    return NextResponse.json({ follow, isNew: true });
  } catch (error) {
    console.error("Error creating follow:", error);
    return NextResponse.json(
      { error: "Failed to follow company" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followId = searchParams.get("followId");
    const userId = searchParams.get("userId");
    const companyId = searchParams.get("companyId");

    if (!followId && (!userId || !companyId)) {
      return NextResponse.json(
        { error: "Follow ID or User ID + Company ID are required" },
        { status: 400 }
      );
    }

    if (followId) {
      await adminDb.collection("follows").doc(followId).delete();
    } else if (userId && companyId) {
      const snapshot = await adminDb
        .collection("follows")
        .where("userId", "==", userId)
        .where("companyId", "==", companyId)
        .get();

      for (const doc of snapshot.docs) {
        await doc.ref.delete();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting follow:", error);
    return NextResponse.json(
      { error: "Failed to unfollow company" },
      { status: 500 }
    );
  }
}
