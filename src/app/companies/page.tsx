"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Search,
  ChevronRight,
  Building2,
  Plus,
  Bell,
  Check,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Company, Follow } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradePrompt, FreeLimitBadge } from "@/components/UpgradePrompt";

const INDUSTRIES = [
  "All Industries",
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Energy",
  "Government",
  "Telecommunications",
];

export default function CompaniesPage() {
  const { user, loading } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("All Industries");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [followedCompanies, setFollowedCompanies] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showLimitUpgrade, setShowLimitUpgrade] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCompanies, setTotalCompanies] = useState(0);

  const maxFollows = user?.maxCompanyFollows || 3;
  const isPro = user?.subscriptionTier !== "free";

  useEffect(() => {
    if (loading) {
      console.log("[Companies] Auth still loading, waiting...");
      return;
    }
    
    console.log("[Companies] User:", { id: user?.id, email: user?.email, tier: user?.subscriptionTier });
    
    if (user?.id && user?.email) {
      console.log("[Companies] Fetching follows for user:", user.id);
      fetchFollows(user.id);
    } else {
      console.log("[Companies] User not authenticated");
      setFollowedCompanies(new Set());
    }
  }, [user?.id, user?.email, loading]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/companies?limit=100");
      const data = await res.json();
      if (data.companies) {
        setCompanies(data.companies);
        setTotalCompanies(data.totalCount || data.companies.length);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollows = async (uid: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/follow?userId=${uid}`);
      const data = await res.json();
      if (data.follows) {
        setFollowedCompanies(new Set(data.follows.map((f: Follow) => f.companyId)));
      }
      if (data.error) {
        console.warn("[Companies] Error fetching follows:", data.error);
        setError(data.error);
      }
    } catch (error) {
      console.error("[Companies] Error fetching follows:", error);
      setError("Failed to load followed companies");
    }
  };

  const handleFollow = async (company: Company) => {
    console.log("[Companies] handleFollow called:", { userId: user?.id, company: company.name });
    
    if (!user?.id || !user?.email) {
      alert("Please sign in to follow companies");
      return;
    }

    const isFollowed = followedCompanies.has(company.id);

    if (!isFollowed && !isPro && followedCompanies.size >= maxFollows) {
      setShowLimitUpgrade(true);
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowed) {
        const res = await fetch(`/api/follow?userId=${user.id}&companyId=${company.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          alert(`Failed to unfollow: ${data.error || res.status}`);
          return;
        }
        setFollowedCompanies(prev => {
          const next = new Set(prev);
          next.delete(company.id);
          return next;
        });
      } else {
        const res = await fetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            companyId: company.id,
            companyName: company.name,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(`Failed to follow: ${data.error || res.status}`);
          return;
        }
        setFollowedCompanies(prev => new Set(prev).add(company.id));
      }
    } catch (error) {
      console.error("[Companies] Error toggling follow:", error);
      alert("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesQuery = !query || 
      company.name.toLowerCase().includes(query.toLowerCase()) ||
      company.domain.toLowerCase().includes(query.toLowerCase());
    const matchesIndustry = selectedIndustry === "All Industries" || 
      company.industry === selectedIndustry;
    return matchesQuery && matchesIndustry;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white tracking-tight">DayZero</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">Feed</Link>
            <Link href="/companies" className="text-white transition-colors">Companies</Link>
            <Link href="/alerts" className="hover:text-white transition-colors">Alerts</Link>
            <Link href="/check-exposure" className="hover:text-white transition-colors">Check Exposure</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/alerts">
              <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs px-4">
                <Bell className="h-3.5 w-3.5 mr-1.5" /> Get Alerts
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Track Companies</h1>
              <p className="mt-2 text-slate-400">
                {totalCompanies > 0 
                  ? `${totalCompanies} companies with recent incidents - follow to get alerts`
                  : "Follow companies to get instant alerts when they appear in security incidents."}
              </p>
            </div>
            <button
              onClick={fetchCompanies}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {!isPro && (
            <div className="mt-3 flex items-center gap-3">
              <FreeLimitBadge current={followedCompanies.size} max={maxFollows} />
              <span className="text-xs text-slate-500">
                {followedCompanies.size >= maxFollows 
                  ? "Limit reached. Upgrade to follow more." 
                  : `${maxFollows - followedCompanies.size} follows remaining`}
              </span>
            </div>
          )}
          {error && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          {loading && (
            <div className="mt-3 flex items-center gap-2 text-blue-400">
              <div className="h-4 w-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              <span className="text-sm">Loading your account...</span>
            </div>
          )}
        </motion.div>

        {showLimitUpgrade && (
          <UpgradePrompt
            feature="company follows"
            limit={maxFollows}
            currentUsage={followedCompanies.size}
            onDismiss={() => setShowLimitUpgrade(false)}
          />
        )}

        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search companies..."
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

        {filteredCompanies.length === 0 ? (
          <Card className="bg-slate-900 border-slate-700 rounded-2xl">
            <CardContent className="p-8 text-center">
              <Building2 className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-white font-medium">No companies found</p>
              <p className="text-sm text-slate-400 mt-1">
                Try a different search term or filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company, idx) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="bg-slate-900 border border-slate-700 rounded-2xl hover:border-slate-600 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{company.name}</p>
                          <p className="text-xs text-slate-500">{company.domain}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">
                        {company.industry}
                      </span>
                      {company.isPublic && (
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                          Public
                        </span>
                      )}
                      {(company as any).incidentCount > 0 && (
                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                          {(company as any).incidentCount} incident{(company as any).incidentCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        onClick={() => handleFollow(company)}
                        disabled={loading || isLoading || !user?.email || (!isPro && followedCompanies.size >= maxFollows && !followedCompanies.has(company.id))}
                        variant={followedCompanies.has(company.id) ? "outline" : "default"}
                        className={`flex-1 rounded-xl text-xs ${
                          followedCompanies.has(company.id)
                            ? "border-green-500/50 text-green-400 hover:bg-green-500/10"
                            : "bg-blue-600 hover:bg-blue-500 text-white"
                        }`}
                      >
                        {followedCompanies.has(company.id) ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Following
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Follow
                          </>
                        )}
                      </Button>
                      <Link href={`/company/${encodeURIComponent(company.name)}`}>
                        <Button variant="ghost" size="icon" className="rounded-xl">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
