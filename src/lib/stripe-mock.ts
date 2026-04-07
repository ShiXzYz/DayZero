import { SubscriptionTier } from "@/types";

export type BillingPeriod = "monthly" | "annual";

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  priceId: string;
  billingPeriod: BillingPeriod;
  features: string[];
  limits: {
    companyFollows: number;
    hibpChecksPerMonth: number;
    realTimeAlerts: boolean;
    oneTapActions: boolean;
    riskScoring: boolean;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: "free",
    name: "Free",
    price: 0,
    priceId: "price_free",
    billingPeriod: "monthly",
    features: [
      "Real-time breach alerts",
      "SEC 8-K filing monitoring",
      "Security news aggregation",
      "Email notifications",
    ],
    limits: {
      companyFollows: 3,
      hibpChecksPerMonth: 1,
      realTimeAlerts: false,
      oneTapActions: false,
      riskScoring: false,
    },
  },
  {
    tier: "pro",
    name: "Pro Monthly",
    price: 4.99,
    priceId: "price_pro_monthly",
    billingPeriod: "monthly",
    features: [
      "Everything in Free",
      "Unlimited company follows",
      "Unlimited HIBP exposure checks",
      "Real-time push notifications",
      "One-tap incident response actions",
      "Risk scoring & analysis",
      "Daily digest emails",
    ],
    limits: {
      companyFollows: 999,
      hibpChecksPerMonth: 999,
      realTimeAlerts: true,
      oneTapActions: true,
      riskScoring: true,
    },
  },
  {
    tier: "pro",
    name: "Pro Annual",
    price: 50.89,
    priceId: "price_pro_annual",
    billingPeriod: "annual",
    features: [
      "Everything in Free",
      "Unlimited company follows",
      "Unlimited HIBP exposure checks",
      "Real-time push notifications",
      "One-tap incident response actions",
      "Risk scoring & analysis",
      "Daily digest emails",
      "Save 15% vs monthly",
    ],
    limits: {
      companyFollows: 999,
      hibpChecksPerMonth: 999,
      realTimeAlerts: true,
      oneTapActions: true,
      riskScoring: true,
    },
  },
];

export function getPlan(tier: SubscriptionTier): SubscriptionPlan {
  return SUBSCRIPTION_PLANS.find(p => p.tier === tier) || SUBSCRIPTION_PLANS[0];
}

export function canUseFeature(tier: SubscriptionTier, feature: keyof SubscriptionPlan["limits"]): boolean {
  const plan = getPlan(tier);
  return plan.limits[feature] as boolean;
}

export function isWithinLimits(tier: SubscriptionTier, usage: { follows: number; hibpChecks: number }): boolean {
  const plan = getPlan(tier);
  if (usage.follows > plan.limits.companyFollows) return false;
  if (usage.hibpChecks > plan.limits.hibpChecksPerMonth) return false;
  return true;
}

export interface MockCheckoutSession {
  id: string;
  url: string;
  status: "open" | "complete" | "expired";
  tier: SubscriptionTier;
  amount: number;
}

export async function createMockCheckoutSession(tier: SubscriptionTier): Promise<MockCheckoutSession> {
  const plan = getPlan(tier);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    id: `mock_session_${Date.now()}`,
    url: "#mock-checkout",
    status: "complete",
    tier,
    amount: plan.price * 100,
  };
}

export async function createMockCustomerPortal(): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return "#mock-portal";
}

export function formatPrice(plan: SubscriptionPlan): string {
  if (plan.price === 0) return "Free";
  if (plan.billingPeriod === "annual") return `$${plan.price.toFixed(2)}/year`;
  return `$${plan.price.toFixed(2)}/mo`;
}
