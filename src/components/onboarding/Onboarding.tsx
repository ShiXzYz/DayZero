"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Search, Bell, ChevronRight, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Breach } from "@/types";
import { getSeverityFromData } from "@/lib/hibp";
import { getSeverityColor, getSeverityDot } from "@/lib/risk-score";

interface OnboardingProps {
  onComplete: (email: string) => void;
  isLoading: boolean;
  error: string | null;
  result?: {
    breachCount: number;
    riskScore: number;
    breaches?: Breach[];
    message?: string;
    isNew?: boolean;
  };
}

export function Onboarding({ onComplete, isLoading, error, result }: OnboardingProps) {
  const [step] = useState<"email" | "scanning" | "results">("email");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onComplete(email.trim());
    }
  };

  if (result && step === "results") {
    return <ResultsStep result={result} email={email} />;
  }

  if (isLoading && step === "scanning") {
    return <ScanningStep />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-md mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-6">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">DayZero</h1>
          <p className="mt-2 text-slate-400">
            Find out if your accounts have been compromised in data breaches.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Enter your email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl bg-slate-900 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-3.5 text-sm placeholder:text-slate-500"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <Button
              type="submit"
              disabled={!email.trim() || isLoading}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3.5 font-semibold disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Check for Breaches
                </span>
              )}
            </Button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10 space-y-4"
        >
          <FeatureItem
            icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
            title="Instant breach detection"
            description="Check if your email has appeared in known data breaches"
          />
          <FeatureItem
            icon={<Bell className="h-5 w-5 text-blue-400" />}
            title="Real-time alerts"
            description="Get notified immediately when new breaches occur"
          />
          <FeatureItem
            icon={<Shield className="h-5 w-5 text-green-400" />}
            title="Actionable guidance"
            description="One-tap steps to secure your accounts"
          />
        </motion.div>

        <p className="mt-8 text-xs text-slate-600 text-center">
          No password required. We never store your credentials.
          Your privacy is our priority.
        </p>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function ScanningStep() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="inline-flex items-center justify-center h-16 w-16 rounded-full border-2 border-blue-500/30 border-t-blue-500 mb-6"
        >
          <Search className="h-6 w-6 text-blue-400" />
        </motion.div>
        <h2 className="text-xl font-semibold text-white">Scanning for breaches...</h2>
        <p className="mt-2 text-slate-400 text-sm">Checking multiple breach databases</p>
      </div>
    </div>
  );
}

function ResultsStep({ result, email }: { result: OnboardingProps["result"]; email: string }) {
  if (!result) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-md mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          {result.breachCount === 0 ? (
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>
          )}

          <h2 className="text-2xl font-bold text-white">
            {result.breachCount === 0 ? "Good news!" : "Breaches detected"}
          </h2>
          <p className="mt-2 text-slate-400">
            {result.message || (result.breachCount === 0
              ? `No breaches found for ${email}`
              : `Found ${result.breachCount} breach${result.breachCount > 1 ? "es" : ""} involving ${email}`)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-400">Risk Score</span>
            <span className={`text-lg font-bold ${result.riskScore > 50 ? "text-red-400" : result.riskScore > 25 ? "text-orange-400" : "text-green-400"}`}>
              {result.riskScore}/100
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.riskScore}%` }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className={`h-full ${result.riskScore > 50 ? "bg-red-500" : result.riskScore > 25 ? "bg-orange-500" : "bg-green-500"}`}
            />
          </div>
        </motion.div>

        {result.breaches && result.breaches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3 mb-6"
          >
            <h3 className="text-sm font-medium text-slate-300">Breaches found</h3>
            {result.breaches.slice(0, 3).map((breach) => (
              <div key={breach.id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${getSeverityDot(getSeverityFromData(breach.dataClasses))}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{breach.title}</p>
                    <p className="text-xs text-slate-500">{breach.breachDate}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getSeverityColor(getSeverityFromData(breach.dataClasses))}`}>
                  {getSeverityFromData(breach.dataClasses)}
                </span>
              </div>
            ))}
            {result.breaches.length > 3 && (
              <p className="text-xs text-slate-500 text-center">
                +{result.breaches.length - 3} more breaches
              </p>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3.5 font-semibold"
          >
            <span className="flex items-center gap-2">
              Continue to Dashboard
              <ChevronRight className="h-4 w-4" />
            </span>
          </Button>
        </motion.div>

        <p className="mt-4 text-xs text-slate-600 text-center">
          We&apos;ll continue monitoring your email for new breaches.
        </p>
      </div>
    </div>
  );
}
