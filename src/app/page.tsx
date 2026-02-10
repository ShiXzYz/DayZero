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
};

const MOCK_BREACHES: Breach[] = [
  {
    company: "Discord",
    date: "Mar 18, 2025",
    data: "Email addresses, IP metadata",
    severity: "Medium",
    action: "Change your password and enable 2FA"
  },
  {
    company: "Dropbox",
    date: "Nov 2, 2024",
    data: "Email addresses, hashed passwords",
    severity: "High",
    action: "Change password immediately"
  },
  {
    company: "Canva",
    date: "Jul 9, 2023",
    data: "Usernames, emails",
    severity: "Low",
    action: "No immediate action required"
  }
];

export default function DayZeroPrototype() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Breach[]>([]);

  const handleSearch = () => {
    const filtered = MOCK_BREACHES.filter(breach =>
      breach.company.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
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
          <Link href="/check-exposure">
            <Button className="rounded-2xl px-6 bg-blue-600 hover:bg-blue-500">Check Your Exposure</Button>
          </Link>
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
      <div className="max-w-3xl mx-auto mt-32">
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

            <div className="mt-6 space-y-4">
              {results.length === 0 && query && (
                <p className="text-slate-400">No reported breaches found.</p>
              )}

              {results.map((breach, idx) => (
                <div key={idx} className="rounded-xl bg-slate-950/70 border border-slate-700 p-4">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-white">{breach.company}</p>
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
    </div>
  );
}
