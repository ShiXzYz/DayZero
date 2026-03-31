"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Bell,
  CheckCircle,
  AlertTriangle,
  BellOff,
  Settings,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { Alert, Severity } from "@/types";

const STORAGE_KEY = "dayzero_user";

const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "bg-red-500/20 text-red-300 border-red-500/30",
  High: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Low: "bg-green-500/20 text-green-300 border-green-500/30",
};

export default function AlertsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUserId(userData.userId);
        fetchAlerts(userData.userId);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAlerts = async (uid: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ userId: uid });
      if (filter === "unread") params.set("unreadOnly", "true");

      const res = await fetch(`/api/alerts?${params}`);
      const data = await res.json();
      
      if (data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, isRead: true }),
      });

      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, isRead: true } : a))
      );
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;
  const filteredAlerts = filter === "unread" ? alerts.filter(a => !a.isRead) : alerts;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white tracking-tight">DayZero</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Settings className="h-5 w-5 text-slate-400" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Alerts</h1>
              <p className="mt-1 text-slate-400 text-sm">
                {unreadCount > 0
                  ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}`
                  : "You're all caught up"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => userId && fetchAlerts(userId)}
                className="rounded-xl"
              >
                <RefreshCw className={`h-4 w-4 text-slate-400 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              filter === "unread"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {!userId ? (
          <Card className="bg-slate-900 border-slate-700 rounded-2xl">
            <CardContent className="p-8 text-center">
              <BellOff className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-white font-medium">Sign in to view alerts</p>
              <p className="text-sm text-slate-400 mt-1">
                Create an account to receive personalized breach alerts.
              </p>
              <Link href="/">
                <Button className="mt-4 rounded-xl bg-blue-600 hover:bg-blue-500">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : isLoading && alerts.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Card className="bg-slate-900 border-slate-700 rounded-2xl">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
              <p className="text-white font-medium">No alerts</p>
              <p className="text-sm text-slate-400 mt-1">
                {filter === "unread"
                  ? "You've read all your alerts"
                  : "Follow companies to receive breach alerts"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert, idx) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card
                  className={`bg-slate-900 border rounded-2xl transition-all ${
                    alert.isRead ? "border-slate-800" : "border-slate-700"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-2 rounded-lg ${
                        alert.severity === "Critical"
                          ? "bg-red-500/20"
                          : alert.severity === "High"
                          ? "bg-orange-500/20"
                          : "bg-blue-500/20"
                      }`}>
                        <AlertTriangle className={`h-4 w-4 ${
                          alert.severity === "Critical"
                            ? "text-red-400"
                            : alert.severity === "High"
                            ? "text-orange-400"
                            : "text-blue-400"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_COLORS[alert.severity]}`}>
                            {alert.severity}
                          </span>
                          {!alert.isRead && (
                            <span className="h-2 w-2 rounded-full bg-blue-400" />
                          )}
                        </div>
                        <p className={`text-sm font-medium ${alert.isRead ? "text-slate-400" : "text-white"}`}>
                          {alert.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-slate-600">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </span>
                          {!alert.isRead && (
                            <button
                              onClick={() => markAsRead(alert.id)}
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <Card className="mt-8 bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-800/30 rounded-2xl">
          <CardContent className="p-6 text-center">
            <Bell className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">Stay Protected</h3>
            <p className="text-xs text-slate-400 mt-1">
              Follow companies and enable notifications to get instant alerts when new incidents are reported.
            </p>
            <Link href="/companies">
              <Button className="mt-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm">
                Follow Companies
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
