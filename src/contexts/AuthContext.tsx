"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, SubscriptionTier } from "@/types";
import { supabase, isSupabaseConfigured, getSupabaseClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateSubscription: (tier: SubscriptionTier) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_FREE_USER: User = {
  id: "anonymous",
  email: "",
  emailHash: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  notificationPreferences: {
    email: true,
    push: false,
    severityThreshold: "Medium",
    alertNewIncidents: true,
    alertRiskIncrease: true,
  },
  subscriptionTier: "free",
  maxCompanyFollows: 3,
  hibpChecksRemaining: 1,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const storedUser = localStorage.getItem("dayzero_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(DEFAULT_FREE_USER);
        }
      } else {
        setUser(DEFAULT_FREE_USER);
      }
      setLoading(false);
      return;
    }

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      console.error("[AuthContext] Supabase client failed to initialize");
      setUser(DEFAULT_FREE_USER);
      setLoading(false);
      return;
    }

    // First, try to restore session from localStorage
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log("[AuthContext] Restored session for user:", session.user.id);
        fetchUserProfile(session.user.id);
      } else {
        console.log("[AuthContext] No session found, using default user");
        setUser(DEFAULT_FREE_USER);
        setLoading(false);
      }
    }).catch(error => {
      console.error("[AuthContext] Error getting session:", error);
      setUser(DEFAULT_FREE_USER);
      setLoading(false);
    });

    // Set up listener for auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthContext] Auth state changed:", event, !!session?.user);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(DEFAULT_FREE_USER);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        const session = await supabase.auth.getSession();
        if (session.data.session?.user) {
          const { email, id } = session.data.session.user;
          const newUser: User = {
            id,
            email: email || "",
            emailHash: btoa(email || "").slice(0, 20),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notificationPreferences: DEFAULT_FREE_USER.notificationPreferences,
            subscriptionTier: "free",
            maxCompanyFollows: 3,
            hibpChecksRemaining: 1,
          };
          
          await supabase.from("users").insert(newUser);
          setUser(newUser);
        }
      } else if (data) {
        setUser({
          ...DEFAULT_FREE_USER,
          ...data,
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string): Promise<{ error: string | null }> {
    const isTestMode = localStorage.getItem("dayzero_test_mode") === "true";
    
    if (!isSupabaseConfigured() || isTestMode) {
      const tier: SubscriptionTier = isTestMode ? "pro" : "free";
      const mockUser: User = {
        ...DEFAULT_FREE_USER,
        id: `mock-${Date.now()}`,
        email,
        emailHash: btoa(email).slice(0, 20),
        subscriptionTier: tier,
        maxCompanyFollows: tier === "free" ? 3 : 999,
        hibpChecksRemaining: tier === "free" ? 1 : 999,
      };
      setUser(mockUser);
      localStorage.setItem("dayzero_user", JSON.stringify(mockUser));
      return { error: null };
    }

    try {
      const supabaseClient = getSupabaseClient();
      if (!supabaseClient) {
        return { error: "Supabase not configured" };
      }
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
      });
      return { error: error?.message || null };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const isTestMode = localStorage.getItem("dayzero_test_mode") === "true";
    
    if (!isSupabaseConfigured() || isTestMode) {
      const tier: SubscriptionTier = isTestMode ? "pro" : "free";
      const mockUser: User = {
        ...DEFAULT_FREE_USER,
        id: `mock-${Date.now()}`,
        email,
        emailHash: btoa(email).slice(0, 20),
        subscriptionTier: tier,
        maxCompanyFollows: tier === "free" ? 3 : 999,
        hibpChecksRemaining: tier === "free" ? 1 : 999,
      };
      setUser(mockUser);
      localStorage.setItem("dayzero_user", JSON.stringify(mockUser));
      return { error: null };
    }

    try {
      const supabaseClient = getSupabaseClient();
      if (!supabaseClient) {
        return { error: "Supabase not configured" };
      }
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message || null };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  }

  async function signOut() {
    if (!isSupabaseConfigured()) {
      setUser(DEFAULT_FREE_USER);
      localStorage.removeItem("dayzero_user");
      return;
    }

    const supabaseClient = getSupabaseClient();
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    setUser(DEFAULT_FREE_USER);
  }

  async function updateSubscription(tier: SubscriptionTier) {
    const newMaxFollows = tier === "free" ? 3 : tier === "pro" ? 999 : 999;
    const hibpRemaining = tier === "free" ? 1 : tier === "pro" ? 999 : 999;
    
    if (!user) return;
    
    const updatedUser: User = {
      id: user.id,
      email: user.email,
      emailHash: user.emailHash,
      createdAt: user.createdAt,
      updatedAt: new Date().toISOString(),
      notificationPreferences: user.notificationPreferences,
      subscriptionTier: tier,
      maxCompanyFollows: newMaxFollows,
      hibpChecksRemaining: hibpRemaining,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      fcmToken: user.fcmToken,
    };
    
    setUser(updatedUser);
    
    if (user.id && !user.id.startsWith("mock-") && !user.id.startsWith("anonymous")) {
      const supabaseClient = getSupabaseClient();
      if (supabaseClient) {
        await supabaseClient
          .from("users")
          .update({
            subscription_tier: tier,
            max_company_follows: newMaxFollows,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }
    }
    
    localStorage.setItem("dayzero_user", JSON.stringify(updatedUser));
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
