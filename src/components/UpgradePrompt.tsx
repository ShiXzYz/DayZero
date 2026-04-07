"use client";

import Link from "next/link";
import { Crown, Lock, X } from "lucide-react";
import { useState } from "react";

interface UpgradePromptProps {
  feature: string;
  limit?: number;
  currentUsage?: number;
  onDismiss?: () => void;
}

export function UpgradePrompt({ feature, limit, currentUsage, onDismiss }: UpgradePromptProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="relative bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-4 mt-4">
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
          <Lock className="h-5 w-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-400" />
            Upgrade to Pro
          </h3>
          <p className="text-sm text-slate-300 mt-1">
            {limit !== undefined && currentUsage !== undefined ? (
              <>
                You&apos;ve reached your limit of <span className="font-medium">{limit} {feature}</span>. 
                Upgrade to Pro for unlimited access.
              </>
            ) : (
              <>
                <span className="font-medium">{feature}</span> is available with Pro or Enterprise plans.
              </>
            )}
          </p>
          <Link
            href="/settings/subscription"
            className="inline-flex items-center gap-1.5 mt-3 text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-colors"
          >
            <Crown className="h-3.5 w-3.5" />
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  );
}

interface FeatureBadgeProps {
  children: React.ReactNode;
}

export function ProFeatureBadge({ children }: FeatureBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
      <Crown className="h-2.5 w-2.5" />
      {children}
    </span>
  );
}

export function FreeLimitBadge({ current, max }: { current: number; max: number }) {
  return (
    <span className="text-xs text-slate-500">
      {current}/{max} used
    </span>
  );
}
