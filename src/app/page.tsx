"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Bell,
  Search,
  Shield,
  Activity,
  Users,
  TrendingUp,
  Zap,
  Lock,
  Globe,
  ChevronRight,
  Radio,
} from "lucide-react";
import { motion } from "framer-motion";

type Severity = "Critical" | "High" | "Medium" | "Low";

type Incident = {
  id: number;
  company: string;
  handle: string;
  type: string;
  summary: string;
  data: string;
  severity: Severity;
  action: string;
  industry: string;
  timestamp: string;
  followers: number;
  updates: number;
  isLive?: boolean;
};

type Topic = {
  label: string;
  icon: React.ReactNode;
  count: string;
};

const TOPICS: Topic[] = [
  { label: "Ransomware", icon: <Lock className="h-4 w-4" />, count: "2.4k" },
  { label: "Data Leaks", icon: <AlertTriangle className="h-4 w-4" />, count: "5.1k" },
  { label: "Zero-Days", icon: <Zap className="h-4 w-4" />, count: "891" },
  { label: "Phishing", icon: <Globe className="h-4 w-4" />, count: "3.7k" },
  { label: "Supply Chain", icon: <Activity className="h-4 w-4" />, count: "612" },
];

const INDUSTRIES = ["All", "Tech", "Finance", "Retail", "Healthcare", "Government", "Social Media"];

const MOCK_INCIDENTS: Incident[] = [
  {
    id: 1,
    company: "Synapse Cloud",
    handle: "@synapsecloud",
    type: "Ransomware",
    summary: "LockBit affiliate encrypts corporate file servers. Customer data may be exfiltrated prior to encryption. Investigation ongoing.",
    data: "Employee PII, internal documents, customer contracts",
    severity: "Critical",
    action: "Rotate all credentials. Notify affected customers. Contact CISA if you are a US-based entity.",
    industry: "Tech",
    timestamp: "2 min ago",
    followers: 8312,
    updates: 14,
    isLive: true,
  },
  {
    id: 2,
    company: "Meridian Health",
    handle: "@meridianhealth",
    type: "Data Breach",
    summary: "Unauthorized access to patient portal database exposed protected health information for an estimated 1.2 million patients.",
    data: "Names, DOB, SSNs, medical record numbers, insurance IDs",
    severity: "Critical",
    action: "Monitor credit reports. Contact Meridian's breach hotline. Consider placing a credit freeze.",
    industry: "Healthcare",
    timestamp: "41 min ago",
    followers: 19400,
    updates: 27,
    isLive: true,
  },
  {
    id: 3,
    company: "Vortex Payments",
    handle: "@vortexpay",
    type: "Card Skimming",
    summary: "Malicious JavaScript injected into checkout pages across 340 merchant sites. Card data captured at point of entry.",
    data: "Payment card numbers, CVV, billing addresses",
    severity: "High",
    action: "Check statements for unauthorized charges. Request new card from your bank.",
    industry: "Finance",
    timestamp: "3 hr ago",
    followers: 5890,
    updates: 9,
  },
  {
    id: 4,
    company: "Discord",
    handle: "@discord",
    type: "API Abuse",
    summary: "Third-party bot developer's compromised token used to scrape public and semi-public user metadata via Discord's API.",
    data: "Usernames, email addresses, IP metadata",
    severity: "Medium",
    action: "Enable 2FA. Review authorized applications in account settings.",
    industry: "Social Media",
    timestamp: "1 day ago",
    followers: 44200,
    updates: 33,
  },
  {
    id: 5,
    company: "GovID Portal",
    handle: "@govidportal",
    type: "Credential Stuffing",
    summary: "Automated attack using previously leaked credentials gains access to state government identity verification portal.",
    data: "Driver's license numbers, passport data, login timestamps",
    severity: "High",
    action: "Change password immediately. Report unauthorized access to your state DMV.",
    industry: "Government",
    timestamp: "2 days ago",
    followers: 12700,
    updates: 19,
  },
  {
    id: 6,
    company: "Shopify Partners",
    handle: "@shopifypartners",
    type: "Supply Chain",
    summary: "A compromised third-party plugin distributed via Shopify's app store contained a data-harvesting payload affecting ~1,800 stores.",
    data: "Merchant customer emails, order history, partial payment info",
    severity: "High",
    action: "Audit installed apps. Remove flagged plugin immediately. Notify affected customers.",
    industry: "Retail",
    timestamp: "3 days ago",
    followers: 7600,
    updates: 11,
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

const severityDot = (level: Severity) => {
  const map: Record<Severity, string> = {
    Critical: "bg-red-400",
    High: "bg-orange-400",
    Medium: "bg-yellow-400",
    Low: "bg-green-400",
  };
  return map[level];
};

export default function DayZeroHome() {
  const [query, setQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);

  const toggleFollow = (label: string) => {
    setFollowedTopics(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );
  };

  const filteredIncidents = MOCK_INCIDENTS.filter(incident => {
    const matchesQuery =
      query === "" ||
      incident.company.toLowerCase().includes(query.toLowerCase()) ||
      incident.type.toLowerCase().includes(query.toLowerCase()) ||
      incident.summary.toLowerCase().includes(query.toLowerCase());
    const matchesIndustry =
      selectedIndustry === "All" || incident.industry === selectedIndustry;
    return matchesQuery && matchesIndustry;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white tracking-tight">DayZero</span>
            <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
              LIVE
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#feed" className="hover:text-white transition-colors">Feed</a>
            <a href="#trending" className="hover:text-white transition-colors">Trending</a>
            <Link href="/check-exposure" className="hover:text-white transition-colors">Check Exposure</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/get-alerts">
              <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs px-4">
                <Bell className="h-3.5 w-3.5 mr-1.5" /> Get Alerts
              </Button>
            </Link>
            <Link href="/join-waitlist">
              <Button size="sm" variant="outline" className="rounded-xl text-slate-300 border-slate-600 hover:bg-slate-800 text-xs px-4">
                Join Waitlist
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Main Feed */}
        <div>
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white leading-tight">
              The cybersecurity incident feed<br />
              <span className="text-blue-400">built for speed.</span>
            </h1>
            <p className="mt-3 text-slate-400 max-w-xl">
              Follow breaches, vulnerabilities, and incidents as they unfold — not days later.
              DayZero surfaces public disclosures and community intel in one real-time stream.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/check-exposure">
                <Button className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5">
                  <Search className="h-4 w-4 mr-2" /> Check Your Exposure
                </Button>
              </Link>
              <Link href="/get-alerts">
                <Button variant="outline" className="rounded-xl border-slate-600 text-slate-300 hover:bg-slate-800 px-5">
                  <Bell className="h-4 w-4 mr-2" /> Set Up Alerts
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Live ticker */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">Live</span>
            </div>
            <p className="text-sm text-slate-300 truncate">
              <span className="font-semibold text-white">Synapse Cloud</span> — Active ransomware incident confirmed. LockBit affiliate involvement suspected. &nbsp;|&nbsp;
              <span className="font-semibold text-white">Meridian Health</span> — 1.2M patient records exposed. HHS notification filed.
            </p>
          </div>

          {/* Search + Filter */}
          <div id="feed" className="mb-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search incidents, companies, or threat types…"
                className="w-full rounded-xl bg-slate-900 text-slate-100 placeholder:text-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map(industry => (
                <button
                  key={industry}
                  onClick={() => setSelectedIndustry(industry)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedIndustry === industry
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
                >
                  {industry}
                </button>
              ))}
            </div>
          </div>

          {/* Incident Feed */}
          <div className="space-y-4">
            {filteredIncidents.length === 0 && (
              <p className="text-slate-500 text-sm py-8 text-center">No incidents match your search.</p>
            )}
            {filteredIncidents.map((incident, idx) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="bg-slate-900 border border-slate-700 rounded-2xl hover:border-slate-600 transition-all">
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <Shield className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">{incident.company}</span>
                            <span className="text-slate-500 text-xs">{incident.handle}</span>
                            {incident.isLive && (
                              <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded-full">
                                <Radio className="h-2.5 w-2.5" /> LIVE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">{incident.timestamp}</span>
                            <span className="text-slate-700">·</span>
                            <span className="text-xs text-slate-500">{incident.industry}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${severityBadge(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </div>

                    {/* Type tag */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${severityDot(incident.severity)}`} />
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{incident.type}</span>
                    </div>

                    {/* Summary */}
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">{incident.summary}</p>

                    {/* Data affected */}
                    <div className="mt-3 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Data Exposed</p>
                      <p className="text-xs text-slate-300">{incident.data}</p>
                    </div>

                    {/* Recommended action */}
                    <div className="mt-3 bg-blue-950/40 border border-blue-800/30 rounded-lg px-3 py-2">
                      <p className="text-xs text-blue-400 font-medium uppercase tracking-wider mb-1">Recommended Action</p>
                      <p className="text-xs text-blue-200">{incident.action}</p>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {incident.followers.toLocaleString()} following</span>
                        <span className="flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> {incident.updates} updates</span>
                      </div>
                      <button className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                        Follow <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Stats */}
          <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" /> Platform Activity
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Active Incidents", value: "24", color: "text-red-400" },
                  { label: "Resolved Today", value: "7", color: "text-green-400" },
                  { label: "Organizations Tracked", value: "1.2k", color: "text-blue-400" },
                  { label: "Community Members", value: "38k", color: "text-purple-400" },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-950/50 rounded-xl p-3 text-center">
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending Topics */}
          <Card id="trending" className="bg-slate-900 border border-slate-700 rounded-2xl">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" /> Trending Topics
              </h3>
              <div className="space-y-2">
                {TOPICS.map(topic => (
                  <div key={topic.label} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="text-slate-500">{topic.icon}</span>
                      {topic.label}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{topic.count}</span>
                      <button
                        onClick={() => toggleFollow(topic.label)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                          followedTopics.includes(topic.label)
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        {followedTopics.includes(topic.label) ? "Following" : "Follow"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alert CTA */}
          <Card className="bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-800/40 rounded-2xl">
            <CardContent className="p-5 text-center">
              <Bell className="h-8 w-8 text-blue-400 mx-auto" />
              <h3 className="mt-3 text-sm font-semibold text-white">Never miss a breach</h3>
              <p className="mt-1.5 text-xs text-slate-400">
                Follow companies and topics to get instant alerts when incidents are reported.
              </p>
              <Link href="/get-alerts">
                <Button className="mt-4 w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-sm">
                  Set Up Alerts
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <p className="text-xs text-slate-600 leading-relaxed">
            DayZero aggregates publicly disclosed cybersecurity incidents from regulatory filings,
            official company statements, and reputable security publications. This platform does not
            handle personal data. All breach data is sourced from public records only.
          </p>
        </aside>
      </div>

      {/* How it works */}
      <div className="border-t border-slate-800 bg-slate-900/50 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-white text-center mb-10">How DayZero works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Globe className="h-7 w-7 text-blue-400" />,
                title: "Public sources, monitored 24/7",
                desc: "We track regulatory filings, official disclosures, CVE databases, and vetted security publications around the clock.",
              },
              {
                icon: <Activity className="h-7 w-7 text-yellow-400" />,
                title: "Incidents normalized instantly",
                desc: "Raw disclosures are structured into clear, readable summaries — no legal jargon, no buried details.",
              },
              {
                icon: <Bell className="h-7 w-7 text-green-400" />,
                title: "You're notified first",
                desc: "Follow the companies, industries, and threat types you care about. Get alerts the moment something relevant happens.",
              },
            ].map((item, i) => (
              <Card key={i} className="bg-slate-900 border border-slate-700 rounded-2xl">
                <CardContent className="p-6">
                  {item.icon}
                  <h3 className="mt-4 font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="max-w-3xl mx-auto text-center px-6 py-24"
      >
        <Shield className="h-12 w-12 mx-auto text-blue-400" />
        <h2 className="text-3xl font-bold mt-6 text-white">Security awareness starts on Day Zero</h2>
        <p className="mt-4 text-slate-400">
          Don't find out about a breach weeks later in an email. Be informed the moment it happens.
        </p>
        <Link href="/join-waitlist">
          <Button className="mt-8 rounded-2xl px-10 py-6 text-base bg-blue-600 hover:bg-blue-500">
            Join the Waitlist
          </Button>
        </Link>
      </motion.div>

      {/* Footer */}
      <div className="border-t border-slate-800 py-8 text-center">
        <p className="text-xs text-slate-600">
          DayZero — Cybersecurity incident awareness platform. All data is sourced from publicly available information.
          DayZero does not collect, store, or sell personal data.
        </p>
      </div>
    </div>
  );
}
