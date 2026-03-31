export type Severity = "Critical" | "High" | "Medium" | "Low";

export interface User {
  id: string;
  email: string;
  emailHash: string;
  createdAt: string;
  updatedAt: string;
  riskScore: number;
  breachCount: number;
  lastChecked?: string;
  notificationPreferences: NotificationPreferences;
  fcmToken?: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  severityThreshold: Severity;
  topics: string[];
}

export interface Breach {
  id: string;
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  addedDate: string;
  modifiedDate: string;
  pwnCount: number;
  description: string;
  logoPath: string;
  dataClasses: string[];
  isVerified: boolean;
  isFabricated: boolean;
  isSensitive: boolean;
  isRetired: boolean;
  isSpamList: boolean;
  isMalware: boolean;
  isSubscriptionFree: boolean;
}

export interface UserBreach {
  id: string;
  userId: string;
  breach: Breach;
  addedDate: string;
  isResolved: boolean;
  resolvedAt?: string;
}

export interface Action {
  id: string;
  userId: string;
  userBreachId: string;
  type: "change_password" | "enable_2fa" | "review_account" | "contact_support" | "monitor_credit" | "custom";
  title: string;
  description: string;
  deepLink?: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface Alert {
  id: string;
  userId: string;
  type: "new_breach" | "risk_increase" | "action_reminder" | "weekly_summary";
  title: string;
  message: string;
  severity: Severity;
  relatedBreachId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface RiskScore {
  total: number;
  breachCount: number;
  dataExposureScore: number;
  recencyScore: number;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  lastUpdated: string;
}
