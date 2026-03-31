import { Breach, RiskScore, Severity } from "@/types";
import { calculateDataExposureScore, getSeverityFromData } from "./hibp";

export function calculateRiskScore(breaches: Breach[]): RiskScore {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  let dataExposureScore = 0;
  let recencyScore = 0;
  const severityBreakdown: RiskScore["severityBreakdown"] = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const breach of breaches) {
    const severity = getSeverityFromData(breach.dataClasses);
    severityBreakdown[severity.toLowerCase() as keyof typeof severityBreakdown]++;
    
    dataExposureScore += calculateDataExposureScore(breach.dataClasses);

    const breachDate = new Date(breach.breachDate);
    if (breachDate >= thirtyDaysAgo) {
      recencyScore += 40;
    } else if (breachDate >= sixMonthsAgo) {
      recencyScore += 25;
    } else if (breachDate >= oneYearAgo) {
      recencyScore += 10;
    } else {
      recencyScore += 5;
    }
  }

  dataExposureScore = Math.min(dataExposureScore, 100);
  recencyScore = Math.min(recencyScore, 100);

  const breachCountScore = Math.min(breaches.length * 10, 40);

  const total = Math.round(
    (dataExposureScore * 0.4) + 
    (recencyScore * 0.35) + 
    (breachCountScore * 0.25)
  );

  return {
    total: Math.min(total, 100),
    breachCount: breaches.length,
    dataExposureScore,
    recencyScore,
    severityBreakdown,
    lastUpdated: now.toISOString(),
  };
}

export function getRiskLevel(score: number): {
  level: "None" | "Low" | "Medium" | "High" | "Critical";
  color: string;
  description: string;
} {
  if (score === 0) {
    return {
      level: "None",
      color: "text-green-400",
      description: "No breaches detected. Keep monitoring!",
    };
  }
  if (score <= 25) {
    return {
      level: "Low",
      color: "text-green-400",
      description: "Minor exposure detected. Review recommended actions.",
    };
  }
  if (score <= 50) {
    return {
      level: "Medium",
      color: "text-yellow-400",
      description: "Moderate risk. Take action on recommended steps.",
    };
  }
  if (score <= 75) {
    return {
      level: "High",
      color: "text-orange-400",
      description: "Significant exposure. Prioritize security actions.",
    };
  }
  return {
    level: "Critical",
    color: "text-red-400",
    description: "Critical risk. Immediate action required.",
  };
}

export function getSeverityColor(severity: Severity): string {
  const colors: Record<Severity, string> = {
    Critical: "bg-red-500/20 text-red-300 border-red-500/30",
    High: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    Medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    Low: "bg-green-500/20 text-green-300 border-green-500/30",
  };
  return colors[severity];
}

export function getSeverityDot(severity: Severity): string {
  const colors: Record<Severity, string> = {
    Critical: "bg-red-400",
    High: "bg-orange-400",
    Medium: "bg-yellow-400",
    Low: "bg-green-400",
  };
  return colors[severity];
}
