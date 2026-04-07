import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/admin";

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

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ follows: [], error: "Database not configured" });
    }

    const { data: follows, error } = await supabase
      .from("follows")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch follows", follows: [] },
        { status: 500 }
      );
    }

    const formattedFollows = (follows || []).map(follow => ({
      id: follow.id,
      userId: follow.user_id,
      companyId: follow.company_id,
      companyName: follow.company_name,
      notifyNewIncidents: follow.notify_new_incidents,
      notifyRiskIncrease: follow.notify_risk_increase,
      createdAt: follow.created_at,
    }));

    return NextResponse.json({ follows: formattedFollows });
  } catch (error) {
    console.error("Error fetching follows:", error);
    return NextResponse.json(
      { error: "Failed to fetch follows", follows: [] },
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

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const { data: existing } = await supabase
      .from("follows")
      .select("id, *")
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({
        follow: {
          id: existing.id,
          userId: existing.user_id,
          companyId: existing.company_id,
          companyName: existing.company_name,
        },
        isNew: false,
      });
    }

    const { data: follow, error } = await supabase
      .from("follows")
      .insert({
        user_id: userId,
        company_id: companyId,
        company_name: companyName || "",
        notify_new_incidents: notifyNewIncidents !== false,
        notify_risk_increase: notifyRiskIncrease !== false,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to follow company" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      follow: {
        id: follow.id,
        userId: follow.user_id,
        companyId: follow.company_id,
        companyName: follow.company_name,
      },
      isNew: true,
    });
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

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    if (followId) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("id", followId);

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json(
          { error: "Failed to unfollow company" },
          { status: 500 }
        );
      }
    } else if (userId && companyId) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("user_id", userId)
        .eq("company_id", companyId);

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json(
          { error: "Failed to unfollow company" },
          { status: 500 }
        );
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
