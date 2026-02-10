"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldCheck, Bell, Search } from "lucide-react";
import { motion } from "framer-motion";

type Breach = {
  company: string;
  date: string;
  data: string;
  severity: "Low" | "Medium" | "High";
  action: string;
  industry?: string;
};

const INDUSTRIES = ["All", "Tech", "Finance", "Retail", "Healthcare", "Social Media"];

const MOCK_BREACHES: Breach[] = [
  {
    company: "Discord",
    date: "Mar 18, 2025",
    data: "Email addresses, IP metadata",
    severity: "Medium",
    action: "Change your password and enable 2FA",
    industry: "Social Media"
  },
  {
    company: "Dropbox",
    date: "Nov 2, 2024",
    data: "Email addresses, hashed passwords",
    severity: "High",
    action: "Change password immediately",
    industry: "Tech"
  },
  {
    company: "Canva",
    date: "Jul 9, 2023",
    data: "Usernames, emails",
    severity: "Low",
    action: "No immediate action required",
    industry: "Tech"
  },
  {
    company: "Chase Bank",
    date: "Feb 5, 2026",
    data: "Customer account numbers",
    severity: "High",
    action: "Contact your bank immediately",
    industry: "Finance"
  },
  {
    company: "Target",
    date: "Jan 28, 2026",
    data: "Payment card data, addresses",
    severity: "High",
    action: "Check credit report and enable fraud alerts",
    industry: "Retail"
  },
  {
    company: "CVS Health",
    date: "Jan 15, 2026",
    data: "Patient names, medical info",
    severity: "High",
    action: "Monitor health records for unauthorized access",
    industry: "Healthcare"
  }
];

export default function DayZeroPrototype() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Breach[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState("All");

  const handleSearch = () => {
    let filtered = MOCK_BREACHES.filter(breach =>
      breach.company.toLowerCase().includes(query.toLowerCase())
    );
    if (selectedIndustry !== "All") {
      filtered = filtered.filter(breach => breach.industry === selectedIndustry);
    }
    setResults(filtered);
  };

  const scrollToSearch = () => {
    const searchSection = document.getElementById("search-section");
    searchSection?.scrollIntoView({ behavior: "smooth" });
  };

  const severityColor = (level: Breach["severity"]) => {
    if (level === "High") return "text-red-400";
    if (level === "Medium") return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center mt-20"
      >
        <h1 className="text-5xl font-bold tracking-tight text-white">DayZero</h1>
        <p className="mt-4 text-xl text-slate-300">
          Your early warning system for online breaches.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={scrollToSearch}
            className="rounded-2xl px-6 bg-blue-600 hover:bg-blue-500 text-slate-100 font-medium py-2 transition-all"
          >
            Check Your Exposure
          </button>
          <Link href="/get-alerts">
            <Button variant="outline" className="rounded-2xl px-6 text-black">
              Get Alerts
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto mt-32 grid md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
            <h3 className="mt-4 text-xl font-semibold text-white">Breach Happens</h3>
            <p className="mt-2 text-slate-400">
              A company discloses a security incident to regulators.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <Search className="h-8 w-8 text-blue-400" />
            <h3 className="mt-4 text-xl font-semibold text-white">DayZero Detects</h3>
            <p className="mt-2 text-slate-400">
              We normalize public breach disclosures across jurisdictions.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <Bell className="h-8 w-8 text-green-400" />
            <h3 className="mt-4 text-xl font-semibold text-white">You’re Alerted</h3>
            <p className="mt-2 text-slate-400">
              You get clear, actionable alerts — not legal jargon.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breach lookup */}
      <div id="search-section" className="max-w-3xl mx-auto mt-32">
        <Card className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold text-white">Search Breaches</h2>
            <p className="text-slate-400 mt-2">
              Try searching: Discord, Dropbox, Canva
            </p>
            <div className="mt-4 flex gap-2">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Search company name"
                className="flex-1 rounded-xl bg-slate-950 text-slate-100 placeholder:text-slate-500 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-2"
              />
              <Button onClick={handleSearch} className="rounded-xl bg-blue-600 hover:bg-blue-500">Search</Button>
            </div>

            {/* Industry Filters */}
            <div className="mt-6">
              <p className="text-sm font-medium text-slate-300 mb-3">Filter by Industry</p>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map(industry => (
                  <button
                    key={industry}
                    onClick={() => setSelectedIndustry(industry)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedIndustry === industry
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {results.length === 0 && query && (
                <p className="text-slate-400">No reported breaches found.</p>
              )}

              {results.map((breach, idx) => (
                <div key={idx} className="rounded-xl bg-slate-950/70 border border-slate-700 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white">{breach.company}</p>
                      {breach.industry && <p className="text-xs text-slate-400 mt-1">{breach.industry}</p>}
                    </div>
                    <span className={`text-sm font-medium ${severityColor(breach.severity)}`}>
                      {breach.severity} impact
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">Reported: {breach.date}</p>
                  <p className="text-sm text-slate-300 mt-2">Data affected: {breach.data}</p>
                  <p className="text-sm mt-2 text-blue-400">Recommended action: {breach.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Disclosures Feed */}
      <div className="max-w-3xl mx-auto mt-16">
        <h2 className="text-2xl font-semibold text-white mb-4">Recent Breach Disclosures</h2>
        <div className="space-y-3">
          {MOCK_BREACHES.slice(0, 4).map((breach, idx) => (
            <div key={idx} className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 hover:bg-slate-900/70 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-white">{breach.company}</p>
                  <p className="text-xs text-slate-400 mt-1">{breach.industry} • {breach.date}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  breach.severity === "High" ? "bg-red-500/20 text-red-300" :
                  breach.severity === "Medium" ? "bg-yellow-500/20 text-yellow-300" :
                  "bg-green-500/20 text-green-300"
                }`}>
                  {breach.severity}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-2">{breach.data}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="max-w-4xl mx-auto text-center mt-40 mb-20"
      >
        <ShieldCheck className="h-12 w-12 mx-auto text-green-400" />
        <h2 className="text-3xl font-bold mt-6 text-white">Security starts on Day Zero</h2>
        <p className="mt-4 text-slate-400">
          Don’t find out months later. Be informed the moment trust breaks.
        </p>
        <Link href="/join-waitlist">
          <Button className="mt-8 rounded-2xl px-8 py-6 text-lg bg-green-600 hover:bg-green-500">
            Join the Waitlist
          </Button>
        </Link>
      </motion.div>
      {/* Privacy Footer */}
      <div className="max-w-4xl mx-auto text-center mt-20 pb-10 border-t border-slate-700 pt-10">
        <p className="text-sm text-slate-500">DayZero does not collect or store personal data</p>
      </div>    </div>
  );
}
