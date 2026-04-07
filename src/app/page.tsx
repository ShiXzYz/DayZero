"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Bell,
  Search,
  ChevronRight,
  ExternalLink,
  Filter,
  RefreshCw,
  Building2,
  TrendingUp,
  AlertTriangle,
  Globe,
  FileText,
  Info,
  User,
  LogOut,
  Crown,
} from "lucide-react";
import { motion } from "framer-motion";
import { Incident, Severity, SourceType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const REFRESH_INTERVAL = 5 * 60 * 1000;

const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "bg-red-500/20 text-red-300 border-red-500/30",
  High: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Low: "bg-green-500/20 text-green-300 border-green-500/30",
};

const SEVERITY_DOTS: Record<Severity, string> = {
  Critical: "bg-red-400",
  High: "bg-orange-400",
  Medium: "bg-yellow-400",
  Low: "bg-green-400",
};

const SOURCE_ICONS: Record<SourceType, React.ReactNode> = {
  sec_filing: <FileText className="h-3.5 w-3.5" />,
  dark_web: <Globe className="h-3.5 w-3.5" />,
  hibp: <AlertTriangle className="h-3.5 w-3.5" />,
  news: <Building2 className="h-3.5 w-3.5" />,
  manual: <Shield className="h-3.5 w-3.5" />,
};



const INITIAL_LIMIT = 10;
const LOAD_MORE_COUNT = 30;

export default function FeedPage() {
  const { user, signOut } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(INITIAL_LIMIT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | "All">("All");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAuthenticated = user && user.email;
  const displayedIncidents = filteredIncidents.slice(0, displayedCount);
  const hasMore = filteredIncidents.length > displayedCount;

  const fetchIncidents = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (forceRefresh) params.set("refresh", "true");
      params.set("limit", "100");

      const res = await fetch(`/api/incidents?${params}`);
      const data = await res.json();

      if (data.incidents) {
        setIncidents(data.incidents);
        setDisplayedCount(INITIAL_LIMIT);
        setLastRefresh(new Date());
      }
      if (data.isDemoData !== undefined) {
        setIsDemoData(data.isDemoData);
      }
      if (data.sourceErrors) {
        setSourceErrors(data.sourceErrors);
      }
    } catch (error) {
      console.error("Error fetching incidents:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = () => {
    setDisplayedCount(prev => prev + LOAD_MORE_COUNT);
  };

  useEffect(() => {
    fetchIncidents();
    
    intervalRef.current = setInterval(() => {
      fetchIncidents();
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchIncidents]);

  useEffect(() => {
    filterIncidents();
  }, [incidents, query, selectedSeverity]);

  const filterIncidents = () => {
    let filtered = [...incidents];

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        i =>
          i.title.toLowerCase().includes(lowerQuery) ||
          i.companyName.toLowerCase().includes(lowerQuery) ||
          i.summary.toLowerCase().includes(lowerQuery)
      );
    }

    if (selectedSeverity !== "All") {
      filtered = filtered.filter(i => i.severity === selectedSeverity);
    }

    setFilteredIncidents(filtered);
  };

  const liveIncidents = filteredIncidents.filter(
    i => new Date(i.discoveredAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white tracking-tight">DayZero</span>
            <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
              LIVE
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link href="/" className="text-white hover:text-white transition-colors">Feed</Link>
            <Link href="/companies" className="hover:text-white transition-colors">Companies</Link>
            <Link href="/alerts" className="hover:text-white transition-colors">Alerts</Link>
            <Link href="/check-exposure" className="hover:text-white transition-colors">Check Exposure</Link>
            {user?.subscriptionTier !== "free" && (
              <Link href="/settings/subscription" className="hover:text-white transition-colors text-amber-400">Pro</Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-300 max-w-[120px] truncate">{user?.email?.split("@")[0]}</span>
                  {user?.subscriptionTier !== "free" && (
                    <Crown className="h-3.5 w-3.5 text-amber-400" />
                  )}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-lg py-1">
                    <Link
                      href="/settings/subscription"
                      className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Crown className="inline h-3.5 w-3.5 mr-2 text-amber-400" />
                      {user?.subscriptionTier === "pro" ? "Pro Plan" : user?.subscriptionTier === "enterprise" ? "Enterprise Plan" : "Upgrade to Pro"}
                    </Link>
                    <button
                      onClick={() => { signOut(); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button size="sm" variant="ghost" className="rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-xs px-3">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs px-4">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">
            Cybersecurity Incident Feed
          </h1>
          <p className="mt-2 text-slate-400 max-w-xl">
            Real-time monitoring of breaches, ransomware attacks, and security incidents
            from SEC filings, dark web intelligence, and security news.
          </p>
        </motion.div>

        {isDemoData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-900/20 border border-amber-700/30 rounded-xl px-4 py-3 mb-6 flex items-center gap-3"
          >
            <Info className="h-4 w-4 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-300 font-medium">Demo Data</p>
              <p className="text-xs text-amber-400/70">
                No live data available. Showing sample incidents for demonstration.
              </p>
            </div>
          </motion.div>
        )}

        {sourceErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3 mb-6"
          >
            <p className="text-sm text-red-300 font-medium mb-1">Data Source Errors</p>
            {sourceErrors.map((error, i) => (
              <p key={i} className="text-xs text-red-400/70">{error}</p>
            ))}
          </motion.div>
        )}

        {liveIncidents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 mb-6 flex items-center gap-3"
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">Live</span>
            </div>
            <p className="text-sm text-slate-300 truncate">
              <span className="font-semibold text-white">{liveIncidents[0]?.companyName}</span>
              {" — "}
              {liveIncidents[0]?.title}
            </p>
          </motion.div>
        )}

        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search incidents, companies, or keywords..."
              className="w-full rounded-xl bg-slate-900 text-slate-100 placeholder:text-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 pr-4 py-2.5 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Filter className="h-4 w-4" />
              <span className="text-xs">Severity:</span>
            </div>
            {(["All", "Critical", "High", "Medium", "Low"] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedSeverity === sev
                    ? sev === "All"
                      ? "bg-blue-600 text-white"
                      : SEVERITY_COLORS[sev]
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                }`}
              >
                {sev}
              </button>
            ))}

            <div className="flex-1" />

            <button
              onClick={() => fetchIncidents(true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {lastRefresh && (
            <p className="text-xs text-slate-600">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>

        {isLoading && incidents.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredIncidents.length === 0 ? (
          <Card className="bg-slate-900 border-slate-700 rounded-2xl">
            <CardContent className="p-8 text-center">
              <Shield className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-white font-medium">No incidents found</p>
              <p className="text-sm text-slate-400 mt-1">
                Try adjusting your filters or refresh to get the latest data.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayedIncidents.map((incident, idx) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="bg-slate-900 border border-slate-700 rounded-2xl hover:border-slate-600 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white">{incident.companyName}</span>
                            {incident.sources[0]?.type === "sec_filing" && (
                              <span className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full">
                                <FileText className="h-2.5 w-2.5" /> SEC 8-K
                              </span>
                            )}
                            {incident.sources[0]?.type === "dark_web" && (
                              <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded-full">
                                <Globe className="h-2.5 w-2.5" /> Dark Web
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">
                              {new Date(incident.discoveredAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-slate-700">·</span>
                            <div className="flex items-center gap-1">
                              {SOURCE_ICONS[incident.sources[0]?.type || "manual"]}
                              <span className="text-xs text-slate-500">{incident.sources[0]?.sourceName}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${SEVERITY_COLORS[incident.severity]}`}>
                        {incident.severity}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${SEVERITY_DOTS[incident.severity]}`} />
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        {incident.title}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">{incident.summary}</p>

                    {incident.exposedData.length > 0 && (
                      <div className="mt-3 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Data Exposed</p>
                        <div className="flex flex-wrap gap-1.5">
                          {incident.exposedData.flatMap(d => d.types).slice(0, 5).map((type, i) => (
                            <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Confidence: {Math.round((incident.sources[0]?.confidence || 0) * 100)}%</span>
                        {user?.subscriptionTier !== "free" && incident.riskScore && (
                          <span className={`flex items-center gap-1.5 ${
                            incident.riskScore.label === "Critical" ? "text-red-400" :
                            incident.riskScore.label === "High" ? "text-orange-400" :
                            incident.riskScore.label === "Medium" ? "text-yellow-400" :
                            "text-green-400"
                          }`}>
                            <span className="font-medium">Risk:</span>
                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  incident.riskScore.label === "Critical" ? "bg-red-500" :
                                  incident.riskScore.label === "High" ? "bg-orange-500" :
                                  incident.riskScore.label === "Medium" ? "bg-yellow-500" :
                                  "bg-green-500"
                                }`}
                                style={{ width: `${incident.riskScore.overall}%` }}
                              />
                            </div>
                            <span className="font-medium">{incident.riskScore.overall}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {incident.sources[0]?.url && (
                          <a
                            href={incident.sources[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                          >
                            Source <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <Link
                          href={`/company/${encodeURIComponent(incident.companyName)}`}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                        >
                          Details <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>

                    {user?.subscriptionTier !== "free" && (
                      <div className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
                        <Link
                          href={`/company/${encodeURIComponent(incident.companyName)}`}
                          className="flex-1 text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg px-3 py-2 text-center font-medium transition-colors"
                        >
                          View Company
                        </Link>
                        <Link
                          href={`/companies?follow=${encodeURIComponent(incident.companyName)}`}
                          className="flex-1 text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30 rounded-lg px-3 py-2 text-center font-medium transition-colors"
                        >
                          Get alerts
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="h-4 w-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Show More ({Math.min(LOAD_MORE_COUNT, filteredIncidents.length - displayedCount)} more)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-800 bg-slate-900/50 mt-12">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-white mb-6">Data Sources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-purple-400" />
                <span className="font-medium text-white">SEC 8-K Filings</span>
              </div>
              <p className="text-xs text-slate-400">
                Mandatory disclosures from publicly traded companies within 4 business days of material incidents.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-red-400" />
                <span className="font-medium text-white">Dark Web Intelligence</span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time monitoring of credential leaks and breach data from underground forums and marketplaces.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <span className="font-medium text-white">Security News</span>
              </div>
              <p className="text-xs text-slate-400">
                Aggregated reports from DataBreaches.net, BleepingComputer, Krebs on Security, and more.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
