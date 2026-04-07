export type Severity = "Critical" | "High" | "Medium" | "Low";
export type SourceType = "sec_filing" | "dark_web" | "hibp" | "news" | "manual";
export type IncidentStatus = "active" | "investigating" | "resolved" | "false_positive";
export type SubscriptionTier = "free" | "pro" | "enterprise";

export interface Company {
  id: string;
  name: string;
  domain: string;
  ticker?: string;
  industry: string;
  size?: "startup" | "small" | "medium" | "large" | "enterprise";
  description?: string;
  logoUrl?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentSource {
  type: SourceType;
  sourceName: string;
  url?: string;
  confidence: number;
  rawData?: Record<string, unknown>;
  discoveredAt: string;
}

export interface ExposedData {
  category: "credentials" | "personal" | "financial" | "medical" | "corporate" | "other";
  types: string[];
  estimatedRecords?: number;
}

export interface Incident {
  id: string;
  companyId: string;
  companyName: string;
  companyDomain: string;
  title: string;
  summary: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  sources: IncidentSource[];
  exposedData: ExposedData[];
  affectedUsers?: number;
  breachDate?: string;
  discoveredAt: string;
  updatedAt: string;
  reportedAt?: string;
}

export interface User {
  id: string;
  email: string;
  emailHash: string;
  createdAt: string;
  updatedAt: string;
  notificationPreferences: NotificationPreferences;
  fcmToken?: string;
  subscriptionTier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  maxCompanyFollows: number;
  hibpChecksRemaining?: number;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  severityThreshold: Severity;
  industryFilters?: string[];
  alertNewIncidents: boolean;
  alertRiskIncrease: boolean;
}

export interface Follow {
  id: string;
  userId: string;
  companyId: string;
  companyName: string;
  createdAt: string;
  notifyNewIncidents: boolean;
  notifyRiskIncrease: boolean;
}

export interface Alert {
  id: string;
  userId: string;
  incidentId: string;
  type: "new_incident" | "risk_increase" | "status_update" | "data_update";
  title: string;
  message: string;
  severity: Severity;
  isRead: boolean;
  createdAt: string;
}

export interface RiskScore {
  companyId: string;
  total: number;
  level: "none" | "low" | "medium" | "high" | "critical";
  incidentCount: number;
  dataExposureScore: number;
  recencyScore: number;
  sourceDiversity: number;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  lastUpdated: string;
}

export interface SECFiling {
  accessionNumber: string;
  companyName: string;
  ticker: string;
  formType: string;
  filedDate: string;
  documentUrl: string;
  items: string[];
  content: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary: string;
  relatedCompanies: string[];
  tags: string[];
}
