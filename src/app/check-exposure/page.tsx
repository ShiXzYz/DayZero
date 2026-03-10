"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Shield, ChevronLeft, AlertTriangle, CheckCircle, Info } from "lucide-react";

type Severity = "Critical" | "High" | "Medium" | "Low";

type Breach = {
  company: string;
  date: string;
  type: string;
  data: string;
  severity: Severity;
  action: string;
};

// This is mock/demo data for demonstration purposes only.
// No real breach lookup is performed. No email data is stored or transmitted.
const MOCK_BREACH_RESULTS: Breach[] = [
  {
    company: "Vortex Payments",
    date: "Jan 2026",
    type: "Card Skimming",
    data: "Payment card data, billing addresses",
    severity: "High",
    action: "Check your bank statements for unauthorized charges. Request a new card.",
  },
  {
    company: "ShopStyle",
    date: "Aug 2024",
    type: "Data Breach",
    data: "Email addresses, purchase history",
    severity: "Medium",
    action: "Monitor for phishing attempts using your email address.",
  },
];

const severityBadge = (level: Severity) => {
  const map: Record<Severity, string> = {
    Critical: "bg-red-500/20 text-red-300 border border-red-500/30",
    High: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
    Medium: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    Low: "bg-green-500/20 text-green-300 border border-green-500/30",
  };
  return map[level];
};

export default function CheckExposurePage() {
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState(false);
  const [searchType, setSearchType] = useState<"company" | "email">("company");

  const handleCheck = () => {
    if (query.trim()) setChecked(true);
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

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <Search className="h-7 w-7 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Check Exposure</h1>
          <p className="mt-2 text-slate-400 text-sm max-w-md mx-auto">
            Search known public breach disclosures by company name. Understand what was exposed and what to do next.
          </p>
        </div>

        {/* Disclaimer banner */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">
            DayZero searches only publicly disclosed breach records from regulatory filings and official company statements.
            No personal data is collected, stored, or transmitted by this tool. Email lookups are for demo purposes only.
          </p>
        </div>

        {/* Search type toggle */}
        <div className="flex gap-2 mb-4">
          {(["company", "email"] as const).map(type => (
            <button
              key={type}
              onClick={() => { setSearchType(type); setChecked(false); setQuery(""); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                searchType === type
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {type === "company" ? "Search by Company" : "Check Email (Demo)"}
            </button>
          ))}
        </div>

        {/* Search card */}
        <Card className="bg-slate-900 border border-slate-700 rounded-2xl mb-6">
          <CardContent className="p-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setChecked(false); }}
                onKeyDown={e => e.key === "Enter" && handleCheck()}
                placeholder={
                  searchType === "company"
                    ? "Company name (e.g. Discord, Dropbox…)"
                    : "your@email.com (demo only — no real lookup)"
                }
                className="w-full rounded-xl bg-slate-950 text-slate-100 placeholder:text-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 pr-4 py-3 text-sm"
              />
            </div>
            <Button
              onClick={handleCheck}
              disabled={!query.trim()}
              className="w-full mt-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40"
            >
              Search Disclosures
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {checked && (
          <div className="space-y-4">
            {searchType === "company" ? (
              <>
                {MOCK_BREACH_RESULTS.some(b =>
                  b.company.toLowerCase().includes(query.toLowerCase())
                ) ? (
                  MOCK_BREACH_RESULTS.filter(b =>
                    b.company.toLowerCase().includes(query.toLowerCase())
                  ).map((breach, i) => (
                    <Card key={i} className="bg-slate-900 border border-slate-700 rounded-2xl">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-white">{breach.company}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{breach.type} · {breach.date}</p>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${severityBadge(breach.severity)}`}>
                            {breach.severity}
                          </span>
                        </div>
                        <div className="mt-3 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
                          <p className="text-xs text-slate-500 mb-1 font-medium">DATA EXPOSED</p>
                          <p className="text-xs text-slate-300">{breach.data}</p>
                        </div>
                        <div className="mt-2 bg-blue-950/40 border border-blue-800/30 rounded-lg px-3 py-2">
                          <p className="text-xs text-blue-400 mb-1 font-medium">RECOMMENDED ACTION</p>
                          <p className="text-xs text-blue-200">{breach.action}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
                      <p className="text-white font-medium">No public disclosures found</p>
                      <p className="text-sm text-slate-400 mt-1">
                        No breach records for <span className="text-slate-300 font-medium">{query}</span> in our public disclosure database.
                      </p>
                      <p className="text-xs text-slate-600 mt-3">
                        This does not guarantee no breach has occurred — only that none has been publicly disclosed.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
                  <p className="text-white font-medium">Demo mode</p>
                  <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                    Email-based exposure lookup is a demo feature. DayZero does not perform real-time email breach lookups
                    or store any email addresses entered here.
                  </p>
                  <p className="text-xs text-slate-600 mt-3">
                    For real breach monitoring, services like HaveIBeenPwned (haveibeenpwned.com) provide email lookup using k-anonymity.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Shield tip */}
            <Card className="bg-slate-900/50 border border-slate-800 rounded-2xl">
              <CardContent className="p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Stay ahead of future breaches</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Set up alerts to be notified the moment a company you use reports an incident.
                  </p>
                  <Link href="/get-alerts">
                    <button className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      Set up alerts →
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
