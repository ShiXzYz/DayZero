import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getSupabaseClient } from "@/lib/supabase/admin";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@dayzero.io";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

export async function POST(request: NextRequest) {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 503 });
    }

    const { userId, title, body, url, tag } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Missing userId, title, or body" }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("[push/send] Supabase error:", error);
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscriptions for user" });
    }

    const payload = JSON.stringify({ title, body, url: url || "/alerts", tag: tag || "dayzero-alert" });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };
        try {
          await webpush.sendNotification(pushSub, payload);
        } catch (err: unknown) {
          // Remove expired/invalid subscriptions
          if (err && typeof err === "object" && "statusCode" in err) {
            const statusCode = (err as { statusCode: number }).statusCode;
            if (statusCode === 410 || statusCode === 404) {
              await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            }
          }
          throw err;
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ sent, total: subscriptions.length });
  } catch (error) {
    console.error("[push/send] Error:", error);
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}
