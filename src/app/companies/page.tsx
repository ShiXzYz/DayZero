"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Search, ChevronRight, Building2, Plus, Bell, Check, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Company, Follow } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradePrompt, FreeLimitBadge } from "@/components/UpgradePrompt";

const INDUSTRIES = ["All", "Technology", "Finance", "Healthcare", "Retail", "Energy", "Government", "Telecommunications"];

const INDUSTRY_COLORS: Record<string, string> = {
  Technology: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Finance: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Healthcare: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  Retail: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  Energy: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  Government: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  Telecommunications: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
};

export default function CompaniesPage() {
  const { user, loading } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [followedCompanies, setFollowedCompanies] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [followingId, setFollowingId] = useState<string | null>(null);
  const [showLimitUpgrade, setShowLimitUpgrade] = useState(false);

  const maxFollows = user?.maxCompanyFollows || 3;
  const isPro = user?.subscriptionTier === "pro";

  useEffect(() => {
    if (loading) return;

    const companiesP = fetch("/api/companies?limit=100")
      .then(r => r.json())
      .then(data => { if (data.companies) setCompanies(data.companies); })
      .catch(console.error);

    const followsP = user?.id && user?.email
      ? fetch(`/api/follow?userId=${user.id}`)
          .then(r => r.json())
          .then(data => { if (data.follows) setFollowedCompanies(new Set(data.follows.map((f: Follow) => f.companyId))); })
          .catch(console.error)
      : Promise.resolve();

    Promise.all([companiesP, followsP]).finally(() => setIsLoading(false));
  }, [user?.id, user?.email, loading]);

  const handleFollow = async (company: Company) => {
    if (!user?.id || !user?.email) { alert("Please sign in to follow companies"); return; }
    const isFollowed = followedCompanies.has(company.id);
    if (!isFollowed && !isPro && followedCompanies.size >= maxFollows) { setShowLimitUpgrade(true); return; }

    setFollowingId(company.id);
    try {
      if (isFollowed) {
        await fetch(`/api/follow?userId=${user.id}&companyId=${company.id}`, { method: "DELETE" });
        setFollowedCompanies(prev => { const n = new Set(prev); n.delete(company.id); return n; });
      } else {
        await fetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, companyId: company.id, companyName: company.name }),
        });
        setFollowedCompanies(prev => new Set(prev).add(company.id));
      }
    } catch (e) { console.error(e); }
    finally { setFollowingId(null); }
  };

  const filtered = companies.filter(c => {
    const matchQ = !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.domain.toLowerCase().includes(query.toLowerCase());
    const matchI = selectedIndustry === "All" || c.industry === selectedIndustry;
    return matchQ && matchI;
  });

  const followedList = companies.filter(c => followedCompanies.has(c.id));

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100">

      {/* NAV */}
      <nav className="border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">DayZero</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {[["Feed", "/"], ["Companies", "/companies"], ["Alerts", "/alerts"], ["Check Exposure", "/check-exposure"]].map(([label, href]) => (
              <Link key={href} href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${href === "/companies" ? "text-white bg-white/8" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                {label}
              </Link>
            ))}
          </div>
          <Link href="/alerts"
            className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-all">
            <Bell className="h-3.5 w-3.5" /> Alerts
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Track Companies</h1>
          <p className="text-sm text-slate-500 mt-1">
            {companies.length > 0 ? `${companies.length} companies with recent incidents` : "Follow companies to get instant breach alerts"}
          </p>
          {!isPro && !loading && user?.email && (
            <div className="mt-3 flex items-center gap-3">
              <FreeLimitBadge current={followedCompanies.size} max={maxFollows} />
              <span className="text-xs text-slate-500">
                {followedCompanies.size >= maxFollows ? "Limit reached — upgrade for unlimited" : `${maxFollows - followedCompanies.size} follows remaining`}
              </span>
            </div>
          )}
        </motion.div>

        {showLimitUpgrade && (
          <UpgradePrompt feature="company follows" limit={maxFollows} currentUsage={followedCompanies.size} onDismiss={() => setShowLimitUpgrade(false)} />
        )}

        {/* Following strip */}
        {followedList.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Star className="h-3 w-3 text-amber-400" /> Following
            </p>
            <div className="flex gap-2 flex-wrap">
              {followedList.map(c => (
                <div key={c.id} className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                  <Check className="h-3 w-3" /> {c.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search + filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search companies…"
              className="w-full rounded-2xl bg-white/5 text-slate-100 placeholder:text-slate-500 border border-white/8 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pl-10 pr-4 py-3 text-sm transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {INDUSTRIES.map(ind => (
              <button key={ind} onClick={() => setSelectedIndustry(ind)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedIndustry === ind
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/8"
                }`}>
                {ind}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 rounded-2xl bg-white/3 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-400">No companies found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((company, idx) => {
              const isFollowed = followedCompanies.has(company.id);
              const isThisFollowing = followingId === company.id;
              const industryStyle = INDUSTRY_COLORS[company.industry] || "text-slate-400 bg-white/5 border-white/10";
              return (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <div className={`group bg-white/3 hover:bg-white/5 border rounded-2xl p-4 transition-all ${isFollowed ? "border-emerald-500/30" : "border-white/8 hover:border-white/15"}`}>
                    {/* Company header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-sm font-bold text-slate-300">
                          {company.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{company.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{company.domain}</p>
                        </div>
                      </div>
                      <Link href={`/company/${encodeURIComponent(company.name)}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors shrink-0">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>

                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${industryStyle}`}>
                        {company.industry}
                      </span>
                      {company.isPublic && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-purple-400 bg-purple-500/10 border-purple-500/20">
                          Public
                        </span>
                      )}
                      {(company as any).incidentCount > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-red-400 bg-red-500/10 border-red-500/20">
                          {(company as any).incidentCount} incident{(company as any).incidentCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Follow button */}
                    <button
                      onClick={() => handleFollow(company)}
                      disabled={isThisFollowing || loading || (!isPro && followedCompanies.size >= maxFollows && !isFollowed)}
                      className={`mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isFollowed
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/25"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      } disabled:opacity-40`}
                    >
                      <AnimatePresence mode="wait">
                        {isThisFollowing ? (
                          <motion.div key="spin" className="h-3.5 w-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        ) : isFollowed ? (
                          <motion.span key="following" className="flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Check className="h-3.5 w-3.5" /> Following
                          </motion.span>
                        ) : (
                          <motion.span key="follow" className="flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Plus className="h-3.5 w-3.5" /> Follow
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
