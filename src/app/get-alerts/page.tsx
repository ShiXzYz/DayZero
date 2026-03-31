"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Shield, Lock, AlertTriangle, Globe, Zap, Activity, ChevronLeft, Loader2 } from "lucide-react";

const ALERT_TOPICS = [
  { label: "Ransomware", icon: <Lock className="h-4 w-4" /> },
  { label: "Data Breaches", icon: <AlertTriangle className="h-4 w-4" /> },
  { label: "Zero-Day Exploits", icon: <Zap className="h-4 w-4" /> },
  { label: "Phishing Campaigns", icon: <Globe className="h-4 w-4" /> },
  { label: "Supply Chain Attacks", icon: <Activity className="h-4 w-4" /> },
  { label: "Credential Leaks", icon: <Shield className="h-4 w-4" /> },
];

const SEVERITY_LEVELS = [
  { label: "Critical only", value: "Critical", desc: "Highest-impact incidents" },
  { label: "High & above", value: "High", desc: "Serious threats" },
  { label: "All incidents", value: "Medium", desc: "Everything reported" },
];

const STORAGE_KEY = "dayzero_user";

export default function GetAlertsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [severity, setSeverity] = useState("High");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUserId(userData.userId);
        setEmail(userData.email || "");
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const toggleTopic = (label: string) => {
    setSelectedTopics(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );
  };

  const handleSubmit = async () => {
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email: email.trim(),
          topics: selectedTopics,
          severityThreshold: severity,
          enableEmail: true,
          enablePush: false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setSubmitted(true);
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
        {!submitted ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
                <Bell className="h-7 w-7 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Set Up Breach Alerts</h1>
              <p className="mt-2 text-slate-400">
                Choose what you care about. Get notified the moment it&apos;s reported.
              </p>
            </div>

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

            <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-white mb-1">Alert threshold</h2>
                <p className="text-xs text-slate-500 mb-4">Only notify me for incidents at or above:</p>
                <div className="space-y-2">
                  {SEVERITY_LEVELS.map(level => (
                    <button
                      key={level.label}
                      onClick={() => setSeverity(level.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all border ${
                        severity === level.value
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

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!email.trim() || isLoading}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-semibold disabled:opacity-40"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subscribing...
                </span>
              ) : (
                "Enable Alerts"
              )}
            </Button>

            <p className="text-xs text-slate-600 text-center">
              DayZero does not sell or share your email. Alerts are based on publicly disclosed incidents only.
              You can unsubscribe at any time
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
                We&apos;ll notify <span className="text-white font-medium">{email}</span> when relevant incidents are reported.
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
                Alert threshold: <span className="text-slate-300">{severity} & above</span>
              </p>

              <Link href="/">
                <Button className="mt-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 w-full">
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
