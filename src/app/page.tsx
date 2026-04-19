"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Shield, Bell, Search, ChevronRight, ExternalLink,
  RefreshCw, Building2, TrendingUp, AlertTriangle,
  Globe, FileText, User, LogOut, Crown, Zap, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Incident, Severity, SourceType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const REFRESH_INTERVAL = 5 * 60 * 1000;
const INITIAL_LIMIT = 10;
const LOAD_MORE_COUNT = 20;

const SEV_CONFIG: Record<Severity, { pill: string; dot: string; bar: string; glow: string }> = {
  Critical: { pill: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",   dot: "bg-red-400",    bar: "bg-red-500",    glow: "shadow-red-500/20" },
  High:     { pill: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30", dot: "bg-orange-400", bar: "bg-orange-500", glow: "shadow-orange-500/20" },
  Medium:   { pill: "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30", dot: "bg-yellow-400", bar: "bg-yellow-500", glow: "shadow-yellow-500/20" },
  Low:      { pill: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30", dot: "bg-emerald-400", bar: "bg-emerald-500", glow: "shadow-emerald-500/20" },
};

export default function FeedPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(INITIAL_LIMIT);
  const [query, setQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | "All">("All");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = !authLoading && user && user.email;
  const displayedIncidents = filteredIncidents.slice(0, displayedCount);
  const hasMore = filteredIncidents.length > displayedCount;

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchIncidents = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (forceRefresh) params.set("refresh", "true");
      const res = await fetch(`/api/incidents?${params}`);
      const data = await res.json();
      if (data.incidents) { setIncidents(data.incidents); setDisplayedCount(INITIAL_LIMIT); setLastRefresh(new Date()); }
      if (data.isDemoData !== undefined) setIsDemoData(data.isDemoData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    fetchIncidents();
    intervalRef.current = setInterval(() => fetchIncidents(), REFRESH_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchIncidents]);

  useEffect(() => {
    let filtered = [...incidents];
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.companyName.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q)
      );
    }
    if (selectedSeverity !== "All") filtered = filtered.filter(i => i.severity === selectedSeverity);
    setFilteredIncidents(filtered);
  }, [incidents, query, selectedSeverity]);

  const liveCount = filteredIncidents.filter(
    i => Date.now() - new Date(i.discoveredAt).getTime() < 24 * 60 * 60 * 1000
  ).length;

  const stats = {
    critical: incidents.filter(i => i.severity === "Critical").length,
    high: incidents.filter(i => i.severity === "High").length,
    total: incidents.length,
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100">

      {/* ── NAV ── */}
      <nav className="border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">DayZero</span>
            <span className="hidden sm:inline text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full tracking-wider">
              LIVE
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1 text-sm">
            {[["Feed", "/"], ["Companies", "/companies"], ["Alerts", "/alerts"], ["Check Exposure", "/check-exposure"]].map(([label, href]) => (
              <Link key={href} href={href}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
                {label}
              </Link>
            ))}
          </div>

          {/* Auth area */}
          <div className="flex items-center gap-2">
            {authLoading ? (
              <div className="h-8 w-8 rounded-full bg-white/5 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold text-white">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-slate-300 max-w-[90px] truncate hidden sm:block">
                    {user.email.split("@")[0]}
                  </span>
                  {user.subscriptionTier === "pro" && <Crown className="h-3 w-3 text-amber-400" />}
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-52 bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1"
                    >
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-xs text-slate-500">Signed in as</p>
                        <p className="text-sm font-medium text-white truncate">{user.email}</p>
                        {user.subscriptionTier === "pro" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full mt-1">
                            <Crown className="h-2.5 w-2.5" /> PRO
                          </span>
                        )}
                      </div>
                      <Link href="/settings/subscription"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                        onClick={() => setShowUserMenu(false)}>
                        <Crown className="h-4 w-4 text-amber-400" />
                        {user.subscriptionTier === "pro" ? "Pro Plan" : "Upgrade to Pro"}
                      </Link>
                      <button
                        onClick={() => { signOut(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login"
                  className="text-sm font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                  Sign in
                </Link>
                <Link href="/auth/signup"
                  className="text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-all">
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setShowMobileMenu(v => !v)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 bg-current transition-all origin-center ${showMobileMenu ? "rotate-45 translate-y-[7px]" : ""}`} />
                <span className={`block h-0.5 bg-current transition-all ${showMobileMenu ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 bg-current transition-all origin-center ${showMobileMenu ? "-rotate-45 -translate-y-[7px]" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/5 overflow-hidden"
              onClick={() => setShowMobileMenu(false)}
            >
              <div className="px-4 py-3 space-y-1">
                {[["Feed", "/"], ["Companies", "/companies"], ["Alerts", "/alerts"], ["Check Exposure", "/check-exposure"]].map(([label, href]) => (
                  <Link key={href} href={href}
                    className="block px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium">
                    {label}
                  </Link>
                ))}
                {!authLoading && !isAuthenticated && (
                  <Link href="/auth/login"
                    className="block px-3 py-2.5 rounded-xl text-blue-400 hover:bg-blue-500/10 transition-colors text-sm font-medium">
                    Sign In
                  </Link>
                )}
                {!authLoading && isAuthenticated && (
                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── HERO STATS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Threat Intelligence Feed</h1>
            <p className="text-sm text-slate-500 mt-1">Real-time breaches, ransomware & SEC disclosures</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total incidents</p>
            </div>
            <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-4">
              <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
              <p className="text-xs text-slate-500 mt-0.5">Critical</p>
            </div>
            <div className="bg-orange-500/8 border border-orange-500/20 rounded-2xl p-4">
              <p className="text-2xl font-bold text-orange-400">{stats.high}</p>
              <p className="text-xs text-slate-500 mt-0.5">High severity</p>
            </div>
          </div>
        </motion.div>

        {/* ── DEMO BANNER ── */}
        {isDemoData && (
          <div className="flex items-center gap-3 bg-amber-500/8 border border-amber-500/20 rounded-2xl px-4 py-3">
            <Zap className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300">Showing sample data — live sources unavailable right now</p>
          </div>
        )}

        {/* ── LIVE TICKER ── */}
        {liveCount > 0 && (
          <div className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-2xl px-4 py-3">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-red-400" />
            </span>
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-white">{liveCount}</span> incident{liveCount !== 1 ? "s" : ""} reported in the last 24 hours
            </p>
          </div>
        )}

        {/* ── SEARCH + FILTER ── */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search incidents, companies…"
              className="w-full rounded-2xl bg-white/5 text-slate-100 placeholder:text-slate-500 border border-white/8 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 pl-10 pr-4 py-3 text-sm transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["All", "Critical", "High", "Medium", "Low"] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedSeverity === sev
                    ? sev === "All" ? "bg-blue-600 text-white" : SEV_CONFIG[sev].pill + " scale-105"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/8"
                }`}
              >
                {sev}
              </button>
            ))}
            <button
              onClick={() => fetchIncidents(true)}
              disabled={isLoading}
              className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/8 transition-all disabled:opacity-40"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          {lastRefresh && (
            <p className="text-[11px] text-slate-600">Updated {lastRefresh.toLocaleTimeString()}</p>
          )}
        </div>

        {/* ── FEED ── */}
        {isLoading && incidents.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-44 rounded-2xl bg-white/3 animate-pulse" />
            ))}
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-400">No incidents found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedIncidents.map((incident, idx) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.025 }}
              >
                <div className={`group bg-white/3 hover:bg-white/5 border border-white/8 hover:border-white/15 rounded-2xl p-4 transition-all shadow-lg ${SEV_CONFIG[incident.severity].glow}`}>
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-4.5 w-4.5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{incident.companyName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500">
                            {new Date(incident.discoveredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          {incident.sources[0]?.type === "sec_filing" && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/25 px-1.5 py-0.5 rounded-full">
                              <FileText className="h-2.5 w-2.5" /> SEC
                            </span>
                          )}
                          {incident.sources[0]?.type === "news" && (
                            <span className="text-[11px] text-slate-500">{incident.sources[0].sourceName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${SEV_CONFIG[incident.severity].pill}`}>
                      {incident.severity.toUpperCase()}
                    </span>
                  </div>

                  {/* Title */}
                  <p className="mt-3 text-sm font-semibold text-slate-200 leading-snug">{incident.title}</p>

                  {/* Summary */}
                  <p className="mt-1.5 text-sm text-slate-400 leading-relaxed line-clamp-2">{incident.summary}</p>

                  {/* Exposed data tags */}
                  {incident.exposedData.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {incident.exposedData.flatMap(d => d.types).slice(0, 4).map((type, i) => (
                        <span key={i} className="text-[11px] bg-white/5 border border-white/8 text-slate-400 px-2 py-0.5 rounded-full">
                          {type}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Risk bar (pro) */}
                  {user?.subscriptionTier === "pro" && incident.riskScore && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 w-8 shrink-0">Risk</span>
                      <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${SEV_CONFIG[incident.severity].bar}`}
                          style={{ width: `${incident.riskScore.overall}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">{incident.riskScore.overall}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-2">
                      <Link
                        href={`/protect/${encodeURIComponent(incident.companyName)}?exposed=${encodeURIComponent(incident.exposedData.map(e => e.types.join(",")).join(";"))}`}
                        className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1 rounded-full transition-all"
                      >
                        <AlertTriangle className="h-3 w-3" /> Protect
                      </Link>
                      <Link
                        href={`/companies?follow=${encodeURIComponent(incident.companyName)}`}
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2.5 py-1 rounded-full transition-all"
                      >
                        <Bell className="h-3 w-3" /> Alert me
                      </Link>
                    </div>
                    <div className="flex items-center gap-3">
                      {incident.sources[0]?.url && (
                        <a href={incident.sources[0].url} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
                          <ExternalLink className="h-3 w-3" /> Source
                        </a>
                      )}
                      <Link href={`/company/${encodeURIComponent(incident.companyName)}`}
                        className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
                        <Eye className="h-3 w-3" /> Details
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {hasMore && (
              <button
                onClick={() => setDisplayedCount(c => c + LOAD_MORE_COUNT)}
                className="w-full py-3.5 rounded-2xl bg-white/3 hover:bg-white/6 border border-white/8 text-sm font-medium text-slate-400 hover:text-white transition-all"
              >
                Show {Math.min(LOAD_MORE_COUNT, filteredIncidents.length - displayedCount)} more incidents
              </button>
            )}
          </div>
        )}

        {/* ── SOURCES FOOTER ── */}
        <div className="border-t border-white/5 pt-8 pb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Data Sources</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: <FileText className="h-4 w-4 text-purple-400" />, label: "SEC 8-K Filings", desc: "Mandatory cybersecurity disclosures from public companies" },
              { icon: <Globe className="h-4 w-4 text-red-400" />, label: "Dark Web Intel", desc: "Credential leaks from underground forums & marketplaces" },
              { icon: <TrendingUp className="h-4 w-4 text-emerald-400" />, label: "Security News", desc: "BleepingComputer, Krebs, DataBreaches & more" },
            ].map(s => (
              <div key={s.label} className="flex items-start gap-3 bg-white/3 border border-white/8 rounded-2xl p-4">
                <div className="mt-0.5">{s.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{s.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
