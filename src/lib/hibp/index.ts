import { Severity } from "@/types";

const HIBP_API_BASE = "https://haveibeenpwned.com/api/v3";

export interface HIBPBreach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  AddedDate: string;
  ModifiedDate: string;
  PwnCount: number;
  Description: string;
  LogoPath: string;
  DataClasses: string[];
  IsVerified: boolean;
  IsFabricated: boolean;
  IsSensitive: boolean;
  IsRetired: boolean;
  IsSpamList: boolean;
  IsMalware: boolean;
  IsSubscriptionFree: boolean;
}

export interface HIBPBreachResult {
  id: string;
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  pwnCount: number;
  description: string;
  dataClasses: string[];
  severity: Severity;
}

export type RiskLevel = "none" | "low" | "medium" | "high" | "critical";

export interface ExposureCheck {
  email: string;
  breachCount: number;
  breaches: HIBPBreachResult[];
  riskLevel: RiskLevel;
  checkedAt: string;
}

export async function checkEmailBreaches(email: string): Promise<ExposureCheck> {
  const apiKey = process.env.HIBP_API_KEY;

  if (!apiKey) {
    return {
      email,
      breachCount: 0,
      breaches: [],
      riskLevel: "none",
      checkedAt: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch(
      `${HIBP_API_BASE}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      {
        headers: {
          "hibp-api-key": apiKey,
          "user-agent": "DayZero-Cybersecurity-App",
        },
      }
    );

    if (response.status === 404) {
      return {
        email,
        breachCount: 0,
        breaches: [],
        riskLevel: "none",
        checkedAt: new Date().toISOString(),
      };
    }

    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`);
    }

    const data: HIBPBreach[] = await response.json();
    const breaches = data.map(mapBreach);
    const riskLevel = calculateRiskLevel(breaches);

    return {
      email,
      breachCount: breaches.length,
      breaches,
      riskLevel,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error checking HIBP breaches:", error);
    return {
      email,
      breachCount: 0,
      breaches: [],
      riskLevel: "none",
      checkedAt: new Date().toISOString(),
    };
  }
}

function mapBreach(breach: HIBPBreach): HIBPBreachResult {
  return {
    id: breach.Name,
    name: breach.Name,
    title: breach.Title,
    domain: breach.Domain,
    breachDate: breach.BreachDate,
    pwnCount: breach.PwnCount,
    description: breach.Description.replace(/<[^>]*>/g, ""),
    dataClasses: breach.DataClasses,
    severity: calculateBreachSeverity(breach.DataClasses),
  };
}

function calculateBreachSeverity(dataClasses: string[]): Severity {
  const critical = ["Social security numbers", "Passwords", "Credit cards", "Bank account numbers"];
  const high = ["Dates of birth", "Phone numbers", "Physical addresses"];
  const medium = ["Email addresses", "Names", "Usernames"];

  if (dataClasses.some(d => critical.includes(d))) return "Critical";
  if (dataClasses.some(d => high.includes(d))) return "High";
  if (dataClasses.some(d => medium.includes(d))) return "Medium";
  return "Low";
}

function calculateRiskLevel(breaches: HIBPBreachResult[]): RiskLevel {
  if (breaches.length === 0) return "none";
  
  const hasCritical = breaches.some(b => b.severity === "Critical");
  const hasHigh = breaches.some(b => b.severity === "High");
  const recentBreaches = breaches.filter(b => {
    const breachDate = new Date(b.breachDate);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    return breachDate >= twoYearsAgo;
  });

  if (hasCritical || recentBreaches.length > 3) return "critical";
  if (hasHigh || recentBreaches.length > 1) return "high";
  if (breaches.length > 0) return "medium";
  return "low";
}

export async function checkPasswordBreach(password: string): Promise<{ isBreached: boolean; breachCount: number }> {
  try {
    const hash = await sha1Hash(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5).toUpperCase();

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          "User-Agent": "DayZero-Cybersecurity-App",
        },
      }
    );

    if (!response.ok) {
      return { isBreached: false, breachCount: 0 };
    }

    const text = await response.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hashSuffix, count] = line.split(":");
      if (hashSuffix.trim().toUpperCase() === suffix) {
        return {
          isBreached: true,
          breachCount: parseInt(count.trim(), 10),
        };
      }
    }

    return { isBreached: false, breachCount: 0 };
  } catch {
    return { isBreached: false, breachCount: 0 };
  }
}

async function sha1Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}
