"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Bell, Users, Activity, ChevronLeft, CheckCircle, Loader2 } from "lucide-react";

const FEATURES = [
  {
    icon: <Bell className="h-4 w-4 text-blue-400" />,
    label: "Real-time breach alerts",
    desc: "Notified the moment a disclosure is filed",
  },
  {
    icon: <Users className="h-4 w-4 text-purple-400" />,
    label: "Community intelligence",
    desc: "Insights from security professionals",
  },
  {
    icon: <Activity className="h-4 w-4 text-green-400" />,
    label: "Live incident feed",
    desc: "Follow threats as they evolve",
  },
  {
    icon: <Shield className="h-4 w-4 text-yellow-400" />,
    label: "Personalized follow lists",
    desc: "Track the companies and topics you care about",
  },
];

const ROLES = [
  "Security Professional",
  "IT / Systems Admin",
  "Business Owner / Executive",
  "Developer / Engineer",
  "Researcher / Academic",
  "Journalist / Media",
  "General Consumer",
  "Other",
];

export default function JoinWaitlistPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [joined, setJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role, isWaitlist: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join waitlist");
      }

      setJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-2xl mx-auto mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        {!joined ? (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
                <Shield className="h-7 w-7 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Join the DayZero Waitlist</h1>
              <p className="mt-2 text-slate-400 text-sm max-w-md mx-auto">
                Be among the first to access real-time cybersecurity intelligence.
                Early members get priority access and help shape the platform.
              </p>
            </div>

            <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
              <CardContent className="p-5">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-4">What you&apos;ll get</p>
                <div className="space-y-3">
                  {FEATURES.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                        {f.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{f.label}</p>
                        <p className="text-xs text-slate-500">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl bg-slate-950 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-2.5 text-sm placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1.5">
                    Your role <span className="text-slate-600 font-normal">(optional)</span>
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-2.5 text-sm"
                  >
                    <option value="">Select your role…</option>
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleJoin}
                  disabled={!email.trim() || isLoading}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 font-semibold disabled:opacity-40"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Joining...
                    </span>
                  ) : (
                    "Join Waitlist"
                  )}
                </Button>
              </CardContent>
            </Card>

            <p className="text-xs text-slate-600 text-center">
              We&apos;ll only use your email to notify you about early access. No spam, no data selling.
              Unsubscribe anytime.
            </p>
          </div>
        ) : (
          <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">You&apos;re on the list</h2>
              <p className="mt-2 text-slate-400 text-sm">
                We&apos;ll notify <span className="text-white font-medium">{email}</span> when early access opens.
              </p>

              <div className="mt-6 bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-400">#{Math.floor(Math.random() * 500) + 100}</p>
                    <p className="text-xs text-slate-500">Your position</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-purple-400">2.4k+</p>
                    <p className="text-xs text-slate-500">Total signups</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-400">Q2 2026</p>
                    <p className="text-xs text-slate-500">Launch window</p>
                  </div>
                </div>
              </div>

              <Link href="/">
                <Button className="mt-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 w-full">
                  Explore DayZero
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
