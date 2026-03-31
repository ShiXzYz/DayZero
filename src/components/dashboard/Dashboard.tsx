"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  AlertTriangle,
  Bell,
  Key,
  Smartphone,
  Eye,
  CreditCard,
  Mail,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  LogOut,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { Breach, RiskScore, Alert } from "@/types";
import { getSeverityColor, getSeverityDot, getRiskLevel } from "@/lib/risk-score";
import { getSeverityFromData } from "@/lib/hibp";

interface DashboardProps {
  email: string;
  breaches: Breach[];
  riskScore: RiskScore | null;
  alerts: Alert[];
  onSignOut: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

interface Action {
  id: string;
  type: "change_password" | "enable_2fa" | "review_account" | "monitor_credit" | "checkStatements";
  title: string;
  description: string;
  icon: React.ReactNode;
  deepLink?: string;
  isUrgent: boolean;
}

export function Dashboard({
  email,
  breaches,
  riskScore,
  alerts,
  onSignOut,
  onRefresh,
  isRefreshing,
}: DashboardProps) {
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  const riskInfo = riskScore ? getRiskLevel(riskScore.total) : getRiskLevel(0);
  const unreadAlerts = alerts.filter(a => !a.isRead).length;

  const getActions = (breach: Breach): Action[] => {
    const actions: Action[] = [
      {
        id: `${breach.id}-password`,
        type: "change_password",
        title: "Change Password",
        description: "Update your password for this service",
        icon: <Key className="h-5 w-5" />,
        deepLink: `https://${breach.domain}/settings/security`,
        isUrgent: breach.dataClasses.includes("Passwords"),
      },
      {
        id: `${breach.id}-2fa`,
        type: "enable_2fa",
        title: "Enable 2FA",
        description: "Add two-factor authentication",
        icon: <Smartphone className="h-5 w-5" />,
        deepLink: `https://${breach.domain}/settings/security`,
        isUrgent: false,
      },
      {
        id: `${breach.id}-review`,
        type: "review_account",
        title: "Review Account Activity",
        description: "Check for unauthorized access",
        icon: <Eye className="h-5 w-5" />,
        isUrgent: false,
      },
    ];

    if (breach.dataClasses.includes("Credit cards") || breach.dataClasses.includes("Bank account numbers")) {
      actions.push({
        id: `${breach.id}-credit`,
        type: "monitor_credit",
        title: "Monitor Credit",
        description: "Place a credit freeze or set up alerts",
        icon: <CreditCard className="h-5 w-5" />,
        isUrgent: true,
      });
    }

    return actions;
  };

  const toggleAction = (actionId: string) => {
    setCompletedActions(prev =>
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  const sortedBreaches = [...breaches].sort(
    (a, b) => new Date(b.breachDate).getTime() - new Date(a.breachDate).getTime()
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white tracking-tight">DayZero</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <div className="relative">
              <Bell className="h-5 w-5 text-slate-400" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                  {unreadAlerts}
                </span>
              )}
            </div>
            <button
              onClick={onSignOut}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-5 w-5 text-slate-400" />
            <span className="text-slate-400 text-sm">{email}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Your Security Dashboard</h1>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-slate-900 border-slate-700 rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400">Risk Score</span>
                  <Activity className="h-4 w-4 text-slate-500" />
                </div>
                <p className={`text-3xl font-bold ${riskInfo.color}`}>
                  {riskScore?.total || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">{riskInfo.level} Risk</p>
                <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${riskScore && riskScore.total > 50 ? "bg-red-500" : riskScore && riskScore.total > 25 ? "bg-orange-500" : "bg-green-500"}`}
                    style={{ width: `${riskScore?.total || 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-slate-900 border-slate-700 rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400">Breaches Found</span>
                  <AlertTriangle className="h-4 w-4 text-slate-500" />
                </div>
                <p className={`text-3xl font-bold ${breaches.length > 0 ? "text-red-400" : "text-green-400"}`}>
                  {breaches.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {breaches.filter(b => !b.isRetired).length} active
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-900 border-slate-700 rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400">Actions Done</span>
                  <CheckCircle className="h-4 w-4 text-slate-500" />
                </div>
                <p className="text-3xl font-bold text-blue-400">
                  {completedActions.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  of {breaches.length * 2} recommended
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {riskScore && riskScore.severityBreakdown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-slate-900 border-slate-700 rounded-2xl">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Breach Severity Breakdown</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { key: "critical", label: "Critical", count: riskScore.severityBreakdown.critical },
                    { key: "high", label: "High", count: riskScore.severityBreakdown.high },
                    { key: "medium", label: "Medium", count: riskScore.severityBreakdown.medium },
                    { key: "low", label: "Low", count: riskScore.severityBreakdown.low },
                  ].map(item => (
                    <div key={item.key} className="text-center p-3 bg-slate-800/50 rounded-xl">
                      <p className={`text-lg font-bold ${
                        item.key === "critical" ? "text-red-400" :
                        item.key === "high" ? "text-orange-400" :
                        item.key === "medium" ? "text-yellow-400" : "text-green-400"
                      }`}>
                        {item.count}
                      </p>
                      <p className="text-xs text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Breach Timeline</h2>
            <span className="text-xs text-slate-500">Most recent first</span>
          </div>
          
          {sortedBreaches.length === 0 ? (
            <Card className="bg-slate-900 border-slate-700 rounded-2xl">
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
                <p className="text-white font-medium">No breaches detected</p>
                <p className="text-sm text-slate-400 mt-1">
                  Your email hasn&apos;t appeared in any known data breaches.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedBreaches.map((breach, idx) => {
                const severity = getSeverityFromData(breach.dataClasses);
                const actions = getActions(breach);
                
                return (
                  <motion.div
                    key={breach.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="bg-slate-900 border-slate-700 rounded-2xl overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                              <Shield className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{breach.title}</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSeverityColor(severity)}`}>
                                  {severity}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-500">{breach.domain}</span>
                                <span className="text-slate-700">·</span>
                                <span className="text-xs text-slate-500">{breach.breachDate}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`h-2.5 w-2.5 rounded-full ${getSeverityDot(severity)}`} />
                        </div>

                        <div className="mb-4">
                          <p className="text-xs text-slate-500 mb-2">Data exposed:</p>
                          <div className="flex flex-wrap gap-2">
                            {breach.dataClasses.map(dataClass => (
                              <span
                                key={dataClass}
                                className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-lg"
                              >
                                {dataClass}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-slate-800 pt-4">
                          <p className="text-xs text-slate-500 mb-3 font-medium">Recommended Actions</p>
                          <div className="space-y-2">
                            {actions.map(action => {
                              const isCompleted = completedActions.includes(action.id);
                              
                              return (
                                <div
                                  key={action.id}
                                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                    isCompleted
                                      ? "bg-green-500/10 border-green-500/30"
                                      : action.isUrgent
                                        ? "bg-red-500/5 border-red-500/20"
                                        : "bg-slate-800/50 border-slate-700"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={isCompleted ? "text-green-400" : action.isUrgent ? "text-red-400" : "text-slate-400"}>
                                      {action.icon}
                                    </div>
                                    <div>
                                      <p className={`text-sm font-medium ${isCompleted ? "text-green-300 line-through" : "text-white"}`}>
                                        {action.title}
                                      </p>
                                      <p className="text-xs text-slate-500">{action.description}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {action.deepLink && (
                                      <a
                                        href={action.deepLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    )}
                                    <button
                                      onClick={() => toggleAction(action.id)}
                                      className={`p-2 rounded-lg transition-colors ${
                                        isCompleted
                                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                          : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <CheckCircle className="h-4 w-4" />
                                      ) : (
                                        <XCircle className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-800/30 rounded-2xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Bell className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">Stay protected</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enable notifications to get alerted when your email appears in new breaches.
                </p>
              </div>
              <Button className="shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm">
                Enable Alerts
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
