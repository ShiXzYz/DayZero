"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function CheckExposurePage() {
  const [email, setEmail] = useState("");
  const [checked, setChecked] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-2xl mx-auto mt-24">
        <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
          <CardContent className="p-6">
            <ShieldAlert className="h-10 w-10 text-red-400" />
            <h1 className="text-3xl font-bold mt-4 text-white">Check Your Exposure</h1>
            <p className="text-slate-400 mt-2">Enter an email to see if it appears in known breach disclosures.</p>

            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-6 w-full rounded-xl bg-slate-950 text-slate-100 border border-slate-600 px-4 py-3"
            />

            <Button onClick={() => setChecked(true)} className="mt-4 w-full bg-blue-600">
              Scan for Breaches
            </Button>

            {checked && (
              <div className="mt-6 text-slate-300">
                <p>No direct breaches found for <span className="font-semibold">{email || "this email"}</span>.</p>
                <p className="text-sm text-slate-400 mt-2">This is mock data for demo purposes.</p>
              </div>
            )}

            <Link href="/">
              <Button variant="outline" className="mt-6 w-full text-black">← Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
