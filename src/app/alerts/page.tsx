"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield, Bell, CheckCircle, AlertTriangle, BellOff,
  RefreshCw, BellRing, ChevronRight, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, Severity } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const SEVERITY_CONFIG: Record<Severity, { pill: string; icon: string; glow: string }> = {
  Critical: { pill: "text-red-400 bg-red-500/10 border-red-500/25", icon: "text-red-400", glow: "shadow-red-500/10" },
  High:     { pill: "text-orange-400 bg-orange-500/10 border-orange-500/25", icon: "text-orange-400", glow: "shadow-orange-500/10" },
  Medium:   { pill: "text-yellow-400 bg-yellow-500/10 border-yellow-500/25", icon: "text-yellow-400", glow: "shadow-yellow-500/10" },
  Low:      { pill: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25", icon: "text-emerald-400", glow: "shadow-emerald-500/10" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AlertsPage() {
  const { user, loading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [pushStatus, setPushStatus] = useState<"unknown" | "granted" | "denied" | "loading">("unknown");

  const isAuthenticated = !authLoading && user && user.email;

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushStatus(
        Notification.permission === "granted" ? "granted" :
        Notification.permission === "denied" ? "denied" : "unknown"
      );
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && user?.id) {
      fetchAlerts(user.id);
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, authLoading]);

  const fetchAlerts = async (uid: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ userId: uid });
      if (filter === "unread") params.set("unreadOnly", "true");
      const res = await fetch(`/api/alerts?${params}`);
      const data = await res.json();
      if (data.alerts) setAlerts(data.alerts);
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
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const enablePushNotifications = async () => {
    if (!user?.id || !VAPID_PUBLIC_KEY) return;
    setPushStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setPushStatus("denied"); return; }
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, subscription }),
      });
      setPushStatus("granted");
    } catch (err) {
      console.error("Push subscription failed:", err);
      setPushStatus("unknown");
    }
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;
  const filteredAlerts = filter === "unread" ? alerts.filter(a => !a.isRead) : alerts;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100">

      {/* NAV */}
      <nav className="border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">DayZero</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {[["Feed", "/"], ["Companies", "/companies"], ["Alerts", "/alerts"], ["Check Exposure", "/check-exposure"]].map(([label, href]) => (
              <Link key={href} href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${href === "/alerts" ? "text-white bg-white/8" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                {label}
              </Link>
            ))}
          </div>
          <button
            onClick={() => user?.id && fetchAlerts(user.id)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">Alerts</h1>
              <p className="text-sm text-slate-500 mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}`
                  : "You're all caught up"}
              </p>
            </div>
            {/* Push notification toggle */}
            {isAuthenticated && (
              <div className="shrink-0">
                {pushStatus === "granted" ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                    <BellRing className="h-3.5 w-3.5" /> Notifications on
                  </div>
                ) : pushStatus === "denied" ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                    <BellOff className="h-3.5 w-3.5" /> Blocked
                  </div>
                ) : (
                  <button
                    onClick={enablePushNotifications}
                    disabled={pushStatus === "loading"}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    {pushStatus === "loading" ? "Enabling…" : "Enable alerts"}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {(["all", "unread"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === f ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/8"
              }`}>
              {f === "all" ? "All" : "Unread"}
              {f === "unread" && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
          {unreadCount > 0 && (
            <button
              onClick={() => alerts.forEach(a => !a.isRead && markAsRead(a.id))}
              className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8 transition-all"
            >
              <Check className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>

        {/* Content */}
        {authLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-white/3 animate-pulse" />)}
          </div>
        ) : !isAuthenticated ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/3 border border-white/8 p-10 text-center">
            <BellOff className="h-10 w-10 mx-auto mb-3 text-slate-600" />
            <p className="font-semibold text-white">Sign in to view alerts</p>
            <p className="text-sm text-slate-500 mt-1">Create an account to receive personalized breach alerts.</p>
            <Link href="/auth/login"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all">
              Sign In <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : isLoading && alerts.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-white/3 animate-pulse" />)}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/3 border border-white/8 p-10 text-center">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
            <p className="font-semibold text-white">No alerts</p>
            <p className="text-sm text-slate-500 mt-1">
              {filter === "unread" ? "You've read all your alerts" : "Follow companies to receive breach alerts"}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-2">
              {filteredAlerts.map((alert, idx) => {
                const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.Low;
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <div className={`group rounded-2xl border p-4 transition-all ${
                      alert.isRead
                        ? "bg-white/2 border-white/6"
                        : `bg-white/4 border-white/10 shadow-lg ${cfg.glow}`
                    }`}>
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                          alert.severity === "Critical" ? "bg-red-500/15" :
                          alert.severity === "High" ? "bg-orange-500/15" :
                          alert.severity === "Medium" ? "bg-yellow-500/15" : "bg-emerald-500/15"
                        }`}>
                          <AlertTriangle className={`h-4 w-4 ${cfg.icon}`} />
                        </div>

                        {/* Body */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.pill}`}>
                              {alert.severity}
                            </span>
                            {!alert.isRead && (
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                            )}
                            <span className="text-[11px] text-slate-600 ml-auto">{timeAgo(alert.createdAt)}</span>
                          </div>

                          <p className={`text-sm font-semibold leading-snug ${alert.isRead ? "text-slate-400" : "text-white"}`}>
                            {alert.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {alert.message}
                          </p>

                          {!alert.isRead && (
                            <button
                              onClick={() => markAsRead(alert.id)}
                              className="mt-2 text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Follow companies CTA */}
        {isAuthenticated && !isLoading && (
          <div className="rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/5 border border-blue-500/15 p-5 text-center">
            <Bell className="h-7 w-7 text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">Stay Protected</p>
            <p className="text-xs text-slate-500 mt-1">
              Follow companies to get instant alerts when new incidents are reported.
            </p>
            <Link href="/companies"
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all">
              Follow Companies <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
