"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Bell, Users, Activity, ChevronLeft, CheckCircle } from "lucide-react";

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

export default function JoinWaitlistPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    if (email.trim()) setJoined(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Nav */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to DayZero
          </Link>
        </div>

        {!joined ? (
          <div className="space-y-6">
            {/* Header */}
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

            {/* Feature list */}
            <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
              <CardContent className="p-5">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-4">What you'll get</p>
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

            {/* Form */}
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
                    <option>Security Professional</option>
                    <option>IT / Systems Admin</option>
                    <option>Business Owner / Executive</option>
                    <option>Developer / Engineer</option>
                    <option>Researcher / Academic</option>
                    <option>Journalist / Media</option>
                    <option>General Consumer</option>
                    <option>Other</option>
                  </select>
                </div>
                <Button
                  onClick={handleJoin}
                  disabled={!email.trim()}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 font-semibold disabled:opacity-40"
                >
                  Join Waitlist
                </Button>
              </CardContent>
            </Card>

            <p className="text-xs text-slate-600 text-center">
              We'll only use your email to notify you about early access. No spam, no data selling.
              Unsubscribe anytime.
            </p>
          </div>
        ) : (
          <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">You're on the list</h2>
              <p className="mt-2 text-slate-400 text-sm">
                We'll notify <span className="text-white font-medium">{email}</span> when early access opens.
              </p>

              <div className="mt-6 bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-400">214</p>
                    <p className="text-xs text-slate-500">Your position</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-purple-400">38k</p>
                    <p className="text-xs text-slate-500">Total signups</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-400">Soon</p>
                    <p className="text-xs text-slate-500">Launch window</p>
                  </div>
                </div>
              </div>

              <Link href="/">
                <Button className="mt-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 w-full">
                  Explore the Live Feed
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
