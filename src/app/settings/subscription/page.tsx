"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Check, ArrowLeft, Crown, Zap, CreditCard, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SUBSCRIPTION_PLANS, formatPrice, getPlan } from "@/lib/stripe-mock";
import { SubscriptionTier } from "@/types";

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, updateSubscription } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const currentTier = user?.subscriptionTier || "free";
  const currentPlan = getPlan(currentTier);

  const handleUpgrade = async (priceId: string) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.priceId === priceId);
    if (!plan || plan.tier === currentTier) return;
    
    setIsLoading(priceId);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await updateSubscription(plan.tier);
    
    setIsLoading(null);
    setShowSuccess(priceId);
    
    setTimeout(() => {
      setShowSuccess(null);
      router.push("/");
    }, 2000);
  };

  const isCurrentlyLoading = (priceId: string) => isLoading === priceId;
  const isCurrentlySuccess = (priceId: string) => showSuccess === priceId;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white tracking-tight">DayZero</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">Choose Your Plan</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Get enhanced protection with real-time alerts, unlimited monitoring, and one-tap incident response.
          </p>
          {user?.subscriptionTier === "pro" && (
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-1.5">
              <Crown className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-amber-300">
                You&apos;re on the Pro plan
              </span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrent = plan.tier === currentTier;
            const planIsLoading = isCurrentlyLoading(plan.priceId);
            const planIsSuccess = isCurrentlySuccess(plan.priceId);
            const isAnnual = plan.billingPeriod === "annual";
            const isBestValue = isAnnual;

            return (
              <div
                key={plan.priceId}
                className={`relative rounded-2xl p-6 ${
                  isCurrent
                    ? "bg-blue-900/20 border-2 border-blue-500"
                    : "bg-slate-900 border border-slate-700"
                } ${isBestValue && !isCurrent ? "ring-2 ring-blue-500/50" : ""}`}
              >
                {isBestValue && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Best Value
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {plan.tier === "free" && <Shield className="h-5 w-5 text-slate-400" />}
                    {plan.tier === "pro" && <Zap className="h-5 w-5 text-blue-400" />}
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">
                      {formatPrice(plan)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-slate-400 text-sm">
                        {plan.billingPeriod === "annual" ? "billed annually" : "billed monthly"}
                      </span>
                    )}
                  </div>
                  {isAnnual && (
                    <p className="text-xs text-blue-400 mt-1">Save 15% vs monthly!</p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.priceId)}
                  disabled={isCurrent || isLoading !== null}
                  className={`w-full py-2.5 rounded-lg font-medium transition-all ${
                    isCurrent
                      ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                      : planIsLoading
                      ? "bg-blue-600 text-white"
                      : planIsSuccess
                      ? "bg-green-500 text-white"
                      : plan.tier === "free"
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  {planIsLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : planIsSuccess ? (
                    <div className="flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" />
                      Activated!
                    </div>
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : plan.tier === "free" ? (
                    "Current Tier"
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>

                {plan.price > 0 && !isCurrent && (
                  <p className="text-xs text-slate-500 text-center mt-3">
                    Mock checkout - no payment required
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-white mb-1">Secure Mock Payments</h3>
              <p className="text-sm text-slate-400">
                This is a demonstration of the subscription system. No actual payments are processed.
                In production, this would integrate with Stripe for secure payment handling.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-sm">
          <Sparkles className="h-4 w-4" />
          <span>All plans include a 14-day money-back guarantee</span>
        </div>
      </div>
    </div>
  );
}
