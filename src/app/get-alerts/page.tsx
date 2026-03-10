"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Shield, Lock, AlertTriangle, Globe, Zap, Activity, ChevronLeft } from "lucide-react";

const ALERT_TOPICS = [
  { label: "Ransomware", icon: <Lock className="h-4 w-4" /> },
  { label: "Data Breaches", icon: <AlertTriangle className="h-4 w-4" /> },
  { label: "Zero-Day Exploits", icon: <Zap className="h-4 w-4" /> },
  { label: "Phishing Campaigns", icon: <Globe className="h-4 w-4" /> },
  { label: "Supply Chain Attacks", icon: <Activity className="h-4 w-4" /> },
  { label: "Credential Leaks", icon: <Shield className="h-4 w-4" /> },
];

const SEVERITY_LEVELS = [
  { label: "Critical only", desc: "Highest-impact incidents" },
  { label: "High & above", desc: "Serious threats" },
  { label: "All incidents", desc: "Everything reported" },
];

export default function GetAlertsPage() {
  const [email, setEmail] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [severity, setSeverity] = useState("High & above");
  const [submitted, setSubmitted] = useState(false);

  const toggleTopic = (label: string) => {
    setSelectedTopics(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );
  };

  const handleSubmit = () => {
    if (email.trim()) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Nav */}
      <div className="max-w-2xl mx-auto mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to DayZero
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        {!submitted ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
                <Bell className="h-7 w-7 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Set Up Breach Alerts</h1>
              <p className="mt-2 text-slate-400">
                Choose what you care about. Get notified the moment it's reported.
              </p>
            </div>

            {/* Email */}
            <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
              <CardContent className="p-5">
                <label className="text-sm font-medium text-slate-300 block mb-2">Your email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl bg-slate-950 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-2.5 text-sm placeholder:text-slate-500"
                />
              </CardContent>
            </Card>

            {/* Topics */}
            <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-white mb-1">Follow threat categories</h2>
                <p className="text-xs text-slate-500 mb-4">Select the types of incidents you want to be alerted about.</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALERT_TOPICS.map(topic => (
                    <button
                      key={topic.label}
                      onClick={() => toggleTopic(topic.label)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border ${
                        selectedTopics.includes(topic.label)
                          ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                      }`}
                    >
                      {topic.icon} {topic.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Severity */}
            <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-white mb-1">Alert threshold</h2>
                <p className="text-xs text-slate-500 mb-4">Only notify me for incidents at or above:</p>
                <div className="space-y-2">
                  {SEVERITY_LEVELS.map(level => (
                    <button
                      key={level.label}
                      onClick={() => setSeverity(level.label)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all border ${
                        severity === level.label
                          ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <span className="font-medium">{level.label}</span>
                      <span className="text-xs opacity-70">{level.desc}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSubmit}
              disabled={!email.trim()}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-semibold disabled:opacity-40"
            >
              Enable Alerts
            </Button>

            <p className="text-xs text-slate-600 text-center">
              DayZero does not sell or share your email. Alerts are based on publicly disclosed incidents only.
              You can unsubscribe at any time.
            </p>
          </div>
        ) : (
          <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
                <Bell className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Alerts enabled</h2>
              <p className="mt-2 text-slate-400 text-sm">
                We'll notify <span className="text-white font-medium">{email}</span> when relevant incidents are reported.
              </p>

              {selectedTopics.length > 0 && (
                <div className="mt-5 bg-slate-950 border border-slate-800 rounded-xl p-4 text-left">
                  <p className="text-xs text-slate-500 mb-2 font-medium">FOLLOWING</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTopics.map(t => (
                      <span key={t} className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-5 text-xs text-slate-500">
                Alert threshold: <span className="text-slate-300">{severity}</span>
              </p>

              <Link href="/">
                <Button className="mt-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 w-full">
                  Back to Feed
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
