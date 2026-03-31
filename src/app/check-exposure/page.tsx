"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Shield, ChevronLeft, CheckCircle, Info, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Breach } from "@/types";
import { getSeverityColor, getSeverityDot } from "@/lib/risk-score";
import { getSeverityFromData } from "@/lib/hibp";

const COMMON_SERVICES = [
  "LinkedIn",
  "Adobe",
  "Dropbox",
  "Canva",
  "Twitter",
  "Facebook",
  "Yahoo",
  "MyFitnessPal",
  "Zynga",
  "Neopets",
];

export default function CheckExposurePage() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breaches, setBreaches] = useState<Breach[]>([]);
  const [showAllBreaches, setShowAllBreaches] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch("/api/breaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: query.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to check breaches");
      }

      setBreaches(data.breaches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setBreaches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceClick = async (serviceName: string) => {
    setQuery(serviceName);
    setIsLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch("/api/breaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `${serviceName.toLowerCase()}@example.com` }),
      });

      const data = await res.json();
      setBreaches(data.breaches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setBreaches([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <Search className="h-7 w-7 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Check Company Exposure</h1>
          <p className="mt-2 text-slate-400 text-sm max-w-md mx-auto">
            Search publicly disclosed breach records by email address.
            Understand what was exposed and what steps to take.
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">
            DayZero surfaces information from publicly available breach disclosures including Have I Been Pwned database.
            No personal data is ever collected or stored.
          </p>
        </div>

        <Card className="bg-slate-900 border border-slate-700 rounded-2xl mb-6">
          <CardContent className="p-5">
            <label className="text-sm font-medium text-slate-300 block mb-2">Search by email address</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setSearched(false); }}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="you@example.com"
                className="w-full rounded-xl bg-slate-950 text-slate-100 placeholder:text-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 pr-4 py-3 text-sm"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!query.trim() || isLoading}
              className="w-full mt-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </span>
              ) : (
                "Search Public Disclosures"
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="mb-6">
          <p className="text-xs text-slate-500 mb-3">Popular services to check:</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_SERVICES.map(service => (
              <button
                key={service}
                onClick={() => handleServiceClick(service)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {searched && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {breaches.length > 0 ? (
              <>
                <p className="text-sm text-slate-400">
                  Found <span className="text-white font-medium">{breaches.length}</span> breach{breaches.length !== 1 ? "es" : ""}
                </p>
                {breaches.slice(0, showAllBreaches ? breaches.length : 5).map((breach, i) => {
                  const severity = getSeverityFromData(breach.dataClasses);
                  
                  return (
                    <Card key={`${breach.id}-${i}`} className="bg-slate-900 border border-slate-700 rounded-2xl">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white">{breach.title}</p>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSeverityColor(severity)}`}>
                                {severity}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{breach.domain} · {breach.breachDate}</p>
                          </div>
                          <div className={`h-2.5 w-2.5 rounded-full ${getSeverityDot(severity)}`} />
                        </div>

                        <p className="text-sm text-slate-300 mb-3">{breach.description}</p>

                        <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 mb-3">
                          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Data Exposed</p>
                          <div className="flex flex-wrap gap-1.5">
                            {breach.dataClasses.map(dataClass => (
                              <span key={dataClass} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                {dataClass}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-blue-950/40 border border-blue-800/30 rounded-lg px-3 py-2">
                          <p className="text-xs text-blue-400 mb-1 font-medium uppercase tracking-wider">Recommended Action</p>
                          <p className="text-xs text-blue-200">
                            {breach.dataClasses.includes("Passwords")
                              ? "Change your password immediately and enable two-factor authentication."
                              : breach.dataClasses.includes("Credit cards")
                              ? "Monitor your statements for unauthorized charges and consider a credit freeze."
                              : "Review your account settings and monitor for suspicious activity."}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {breaches.length > 5 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAllBreaches(!showAllBreaches)}
                    className="w-full rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    {showAllBreaches ? "Show Less" : `Show All ${breaches.length} Breaches`}
                  </Button>
                )}
              </>
            ) : (
              <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
                  <p className="text-white font-medium">No public disclosures found</p>
                  <p className="text-sm text-slate-400 mt-1">
                    No breach records for <span className="text-slate-300 font-medium">{query}</span> in our database.
                  </p>
                  <p className="text-xs text-slate-600 mt-3">
                    This does not guarantee no breach has occurred — only that none has been publicly disclosed.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-900/50 border border-slate-800 rounded-2xl">
              <CardContent className="p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Stay ahead of future incidents</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Create a free account to monitor your email and get instant alerts when new breaches are reported.
                  </p>
                  <Link href="/">
                    <button className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      Get started →
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
