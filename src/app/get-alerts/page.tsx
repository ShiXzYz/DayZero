"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export default function GetAlertsPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <Card className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl">
        <CardContent className="p-6">
          <Bell className="h-10 w-10 text-blue-400 mx-auto" />
          <h1 className="text-2xl font-bold text-center mt-4 text-white">Get Breach Alerts</h1>
          <p className="text-slate-400 text-center mt-2">We’ll notify you when a service you use reports a breach.</p>

          {!submitted ? (
            <>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full mt-6 rounded-xl bg-slate-950 border border-slate-600 px-4 py-2"
              />
              <Button onClick={() => setSubmitted(true)} className="w-full mt-4 rounded-xl bg-blue-600">Enable Alerts</Button>
            </>
          ) : (
            <p className="mt-6 text-green-400 text-center">Alerts enabled for {email}</p>
          )}

          <Link href="/" className="block text-center text-sm text-slate-400 mt-6">← Back to DayZero</Link>
        </CardContent>
      </Card>
    </div>
  );
}
