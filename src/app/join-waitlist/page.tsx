"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function JoinWaitlistPage() {
  const [joined, setJoined] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <Card className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl">
        <CardContent className="p-6 text-center">
          <ShieldCheck className="h-10 w-10 text-green-400 mx-auto" />
          <h1 className="text-2xl font-bold mt-4 text-white">Join the DayZero Waitlist</h1>
          <p className="text-slate-400 mt-2">Be first to know when real-time breach alerts go live.</p>

          {!joined ? (
            <>
              <input placeholder="Your email" className="w-full mt-6 rounded-xl bg-slate-950 text-slate-100 border border-slate-600 px-4 py-2" />
              <Button onClick={() => setJoined(true)} className="w-full mt-4 rounded-xl bg-green-600">Join Waitlist</Button>
            </>
          ) : (
            <p className="mt-6 text-green-400">You’re on the list — position #214 🎉</p>
          )}

          <Link href="/" className="block text-sm text-slate-400 mt-6">← Back to home</Link>
        </CardContent>
      </Card>
    </div>
  );
}
