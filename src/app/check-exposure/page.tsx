"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Search,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
  Mail,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { Severity } from "@/types";
import { checkEmailBreaches, checkPasswordBreach, ExposureCheck, HIBPBreachResult } from "@/lib/hibp/index";

const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "bg-red-500/20 text-red-300 border-red-500/30",
  High: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Low: "bg-green-500/20 text-green-300 border-green-500/30",
};

const RISK_COLORS: Record<string, string> = {
  none: "text-green-400",
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const RISK_DESCRIPTIONS: Record<string, string> = {
  none: "No breaches found. Your email appears safe.",
  low: "Minor exposure detected. Consider updating passwords.",
  medium: "Moderate risk. Review the affected services.",
  high: "Significant exposure. Prioritize securing your accounts.",
  critical: "Critical exposure. Immediate action recommended.",
};

export default function CheckExposurePage() {
  const [mode, setMode] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExposureCheck | null>(null);
  const [passwordResult, setPasswordResult] = useState<{ isBreached: boolean; breachCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await checkEmailBreaches(email.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check email");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setError(null);
    setPasswordResult(null);

    try {
      const data = await checkPasswordBreach(password);
      setPasswordResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Feed
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <Search className="h-7 w-7 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Check Your Exposure</h1>
          <p className="mt-2 text-slate-400 text-sm max-w-md mx-auto">
            See if your email or passwords have appeared in data breaches.
            This is an optional feature to help you understand your personal risk.
          </p>
        </motion.div>

        <div className="bg-blue-950/40 border border-blue-800/30 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-200">
            <strong>Privacy note:</strong> Your email is sent directly to Have I Been Pwned&apos;s API.
            We don&apos;t store your email or the results. Password checks use k-anonymity — only a hash prefix is sent, never your actual password.
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setMode("email"); setResult(null); setPasswordResult(null); }}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              mode === "email"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <Mail className="h-4 w-4 inline mr-2" />
            Check Email
          </button>
          <button
            onClick={() => { setMode("password"); setResult(null); setPasswordResult(null); }}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              mode === "password"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <Key className="h-4 w-4 inline mr-2" />
            Check Password
          </button>
        </div>

        {mode === "email" ? (
          <Card className="bg-slate-900 border border-slate-700 rounded-2xl mb-6">
            <CardContent className="p-5">
              <form onSubmit={handleEmailCheck}>
                <label className="text-sm font-medium text-slate-300 block mb-2">Enter your email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl bg-slate-950 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 pr-4 py-3 text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!email.trim() || isLoading}
                  className="w-full mt-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking...
                    </span>
                  ) : (
                    "Check for Breaches"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-900 border border-slate-700 rounded-2xl mb-6">
            <CardContent className="p-5">
              <form onSubmit={handlePasswordCheck}>
                <label className="text-sm font-medium text-slate-300 block mb-2">Enter a password to check</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-xl bg-slate-950 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 pr-12 py-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2 mb-3">
                  Your password never leaves your device. Only a hash prefix is sent to check against known breaches.
                </p>
                <Button
                  type="submit"
                  disabled={!password || isLoading}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking...
                    </span>
                  ) : (
                    "Check Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
              <CardContent className="p-6 text-center">
                {result.breachCount === 0 ? (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-white">No breaches found</h2>
                    <p className="text-slate-400 mt-2">Good news! Your email hasn&apos;t appeared in any known data breaches.</p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className={`h-12 w-12 ${RISK_COLORS[result.riskLevel]} mx-auto mb-3`} />
                    <h2 className="text-xl font-bold text-white">
                      Found {result.breachCount} breach{result.breachCount !== 1 ? "es" : ""}
                    </h2>
                    <p className={`mt-2 ${RISK_COLORS[result.riskLevel]}`}>
                      {RISK_DESCRIPTIONS[result.riskLevel]}
                    </p>
                  </>
                )}
                <p className="text-xs text-slate-500 mt-4">
                  Checked at {new Date(result.checkedAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {result.breaches.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-300">Breaches involving {result.email}</h3>
                {result.breaches.map(breach => (
                  <BreachCard key={breach.id} breach={breach} />
                ))}
              </div>
            )}

            <Card className="bg-slate-900/50 border border-slate-800 rounded-2xl">
              <CardContent className="p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Stay protected</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Follow companies in the DayZero feed to get alerts when they report new security incidents.
                  </p>
                  <Link href="/companies">
                    <button className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      Follow companies →
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {passwordResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
              <CardContent className="p-6 text-center">
                {passwordResult.isBreached ? (
                  <>
                    <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-red-400">Password found in breaches</h2>
                    <p className="text-slate-400 mt-2">
                      This password has appeared {passwordResult.breachCount.toLocaleString()} times in known data breaches.
                      It is not safe to use.
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-green-400">Password not found</h2>
                    <p className="text-slate-400 mt-2">
                      Good news! This password hasn&apos;t appeared in any known data breaches.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="mt-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-white mb-2">Security tips</p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Use unique passwords for each account</li>
                  <li>• Use a password manager to generate and store passwords</li>
                  <li>• Enable two-factor authentication (2FA) whenever possible</li>
                  <li>• Change passwords immediately if you suspect a breach</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function BreachCard({ breach }: { breach: HIBPBreachResult }) {
  return (
    <Card className="bg-slate-900 border border-slate-700 rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-medium text-white">{breach.title}</p>
            <p className="text-xs text-slate-500">{breach.domain} · {breach.breachDate}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${SEVERITY_COLORS[breach.severity as Severity]}`}>
            {breach.severity}
          </span>
        </div>
        <p className="text-sm text-slate-400 mb-3">{breach.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {breach.dataClasses.map((dataClass: string) => (
            <span key={dataClass} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
              {dataClass}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-2">
          {breach.pwnCount.toLocaleString()} accounts affected
        </p>
      </CardContent>
    </Card>
  );
}
