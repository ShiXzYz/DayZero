"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
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
  const lastProcessedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const storedUser = localStorage.getItem("dayzero_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          // Only restore if it looks like a real signed-in user (has email and non-anonymous id)
          if (parsed?.email && parsed?.id && !parsed.id.startsWith("anonymous")) {
            setUser(parsed);
          } else {
            localStorage.removeItem("dayzero_user");
            setUser(null);
          }
        } catch {
          localStorage.removeItem("dayzero_user");
          setUser(null);
        }
      } else {
        setUser(null);
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

    // First, try to restore session from Supabase (not localStorage)
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        lastProcessedUserIdRef.current = session.user.id;
        fetchUserProfile(session.user.id, session.user.email);
      } else {
        console.log("[AuthContext] No session found, user is not signed in");
        // Clear any stale localStorage user so we don't show pro to unauthenticated users
        localStorage.removeItem("dayzero_user");
        setUser(null);
        setLoading(false);
      }
    }).catch(error => {
      console.error("[AuthContext] Error getting session:", error);
      localStorage.removeItem("dayzero_user");
      setUser(null);
      setLoading(false);
    });

    // Set up listener for auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthContext] Auth state changed:", event, !!session?.user);
        if (session?.user) {
          // Only fetch if this is a new user
          if (lastProcessedUserIdRef.current !== session.user.id) {
            lastProcessedUserIdRef.current = session.user.id;
            await fetchUserProfile(session.user.id, session.user.email);
          } else {
            // Already fetched by signIn — just make sure loading is cleared
            setLoading(false);
          }
        } else {
          lastProcessedUserIdRef.current = null;
          // Clear stale localStorage on sign-out so pro never bleeds into a logged-out state
          localStorage.removeItem("dayzero_user");
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string, userEmail?: string) {
    try {
      const supabaseClient = getSupabaseClient();
      if (!supabaseClient) {
        setUser(null);
        return;
      }

      const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        // User doesn't exist in our users table yet — create them
        // Use the email passed in directly rather than re-fetching the session
        const email = userEmail || "";
        const newUser: User = {
          id: userId,
          email,
          emailHash: btoa(email).slice(0, 20),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notificationPreferences: DEFAULT_FREE_USER.notificationPreferences,
          subscriptionTier: "free",
          maxCompanyFollows: 3,
          hibpChecksRemaining: 1,
        };

        // Insert in background — don't block or fail login if this errors
        supabaseClient.from("users").insert({
          id: newUser.id,
          email: newUser.email,
          email_hash: newUser.emailHash,
          created_at: newUser.createdAt,
          updated_at: newUser.updatedAt,
          notification_preferences: newUser.notificationPreferences,
          subscription_tier: newUser.subscriptionTier,
          max_company_follows: newUser.maxCompanyFollows,
          hibp_checks_remaining: newUser.hibpChecksRemaining,
        }).then(({ error: insertError }) => {
          if (insertError) console.error("[AuthContext] Error creating user row:", insertError);
        });

        setUser(newUser);
      } else if (error) {
        console.error("[AuthContext] Error fetching user profile:", error);
        // Still mark as logged in with minimal info so the app doesn't get stuck
        const email = userEmail || "";
        setUser({ ...DEFAULT_FREE_USER, id: userId, email, emailHash: btoa(email).slice(0, 20) });
      } else if (data) {
        setUser({
          id: data.id,
          email: data.email || userEmail || "",
          emailHash: data.email_hash || "",
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          notificationPreferences: data.notification_preferences || DEFAULT_FREE_USER.notificationPreferences,
          subscriptionTier: data.subscription_tier || "free",
          maxCompanyFollows: data.max_company_follows || 3,
          hibpChecksRemaining: data.hibp_checks_remaining ?? 1,
          stripeCustomerId: data.stripe_customer_id,
          stripeSubscriptionId: data.stripe_subscription_id,
          fcmToken: data.fcm_token,
        });
      } else {
        // Fallback — should not happen but never get stuck
        const email = userEmail || "";
        setUser({ ...DEFAULT_FREE_USER, id: userId, email, emailHash: btoa(email).slice(0, 20) });
      }
    } catch (err) {
      console.error("[AuthContext] Exception in fetchUserProfile:", err);
      // Always resolve — never leave loading=true
      const email = userEmail || "";
      setUser({ ...DEFAULT_FREE_USER, id: userId, email, emailHash: btoa(email).slice(0, 20) });
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
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      // Fetch the profile immediately so user state is set before the caller navigates
      if (data.user) {
        lastProcessedUserIdRef.current = data.user.id;
        await fetchUserProfile(data.user.id, data.user.email);
      }
      return { error: null };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  }

  async function signOut() {
    if (!isSupabaseConfigured()) {
      setUser(null);
      localStorage.removeItem("dayzero_user");
      return;
    }

    const supabaseClient = getSupabaseClient();
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    setUser(null);
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

    const isRealUser = user.id && !user.id.startsWith("mock-") && !user.id.startsWith("anonymous");

    if (isRealUser) {
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
      // Only persist to localStorage for real authenticated users
      localStorage.setItem("dayzero_user", JSON.stringify(updatedUser));
    }
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
