"use client";

import { useState, useEffect, useCallback } from "react";
import { RiskScore, Breach, Alert } from "@/types";

interface UserState {
  userId: string | null;
  email: string | null;
  isLoading: boolean;
  error: string | null;
}

interface UseUserReturn extends UserState {
  signUp: (email: string) => Promise<void>;
  signOut: () => void;
  refreshBreaches: () => Promise<void>;
  breaches: Breach[];
  riskScore: RiskScore | null;
  alerts: Alert[];
}

const STORAGE_KEY = "dayzero_user";

export function useUser(): UseUserReturn {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breaches, setBreaches] = useState<Breach[]>([]);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { userId: storedUserId, email: storedEmail } = JSON.parse(stored);
        setUserId(storedUserId);
        setEmail(storedEmail);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchAlerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`/api/users?userId=${userId}`);
      const data = await res.json();
      
      if (data.user) {
        setEmail(data.user.email);
        setRiskScore({
          total: data.user.riskScore || 0,
          breachCount: data.user.breachCount || 0,
          dataExposureScore: 0,
          recencyScore: 0,
          severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
          lastUpdated: data.user.lastChecked || new Date().toISOString(),
        });
      }
      
      if (data.breaches) {
        setBreaches(data.breaches);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  const fetchAlerts = async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`/api/alerts?userId=${userId}`);
      const data = await res.json();
      
      if (data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error("Error fetching alerts:", err);
    }
  };

  const signUp = useCallback(async (userEmail: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sign up");
      }

      setUserId(data.userId);
      setEmail(userEmail);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        userId: data.userId,
        email: userEmail,
      }));

      if (data.breaches) {
        setBreaches(data.breaches);
      }

      if (data.riskScore !== undefined) {
        setRiskScore({
          total: data.riskScore,
          breachCount: data.breachCount || 0,
          dataExposureScore: 0,
          recencyScore: 0,
          severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setUserId(null);
    setEmail(null);
    setBreaches([]);
    setRiskScore(null);
    setAlerts([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshBreaches = useCallback(async () => {
    if (!userId || !email) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/breaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId }),
      });

      const data = await res.json();

      if (data.breaches) {
        setBreaches(data.breaches);
      }

      if (data.riskScore) {
        setRiskScore(data.riskScore);
      }
    } catch (err) {
      console.error("Error refreshing breaches:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, email]);

  return {
    userId,
    email,
    isLoading,
    error,
    signUp,
    signOut,
    refreshBreaches,
    breaches,
    riskScore,
    alerts,
  };
}
