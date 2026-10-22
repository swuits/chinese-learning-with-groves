"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createCloudRemote } from "@/lib/progress/cloud";
import { progressStore } from "@/lib/progress/store";
import { createClient } from "@/lib/supabase/client";

export interface Account {
  id: string;
  email: string;
  name: string;
}

type AuthStatus = "loading" | "signed-in" | "signed-out";

interface AuthContextValue {
  status: AuthStatus;
  account: Account | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SIGN_OUT_SYNC_TIMEOUT_MS = 3000;

const toAccount = (user: User | null): Account | null => {
  if (!user) return null;
  const email = user.email ?? "";
  // Display only: metadata is user-editable, so it is never used for access decisions.
  const chosen = user.user_metadata?.display_name;
  const name = typeof chosen === "string" && chosen.trim() ? chosen.trim().slice(0, 40) : email.split("@")[0];
  return { id: user.id, email, name: name || "Learner" };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [auth, setAuth] = useState<{ status: AuthStatus; account: Account | null }>({
    status: "loading",
    account: null,
  });
  const boundUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setAuth({ status: user ? "signed-in" : "signed-out", account: toAccount(user) });

      // Token refreshes and tab re-focus re-announce the same user: only rebind on a real change.
      const userId = user?.id ?? null;
      if (boundUserId.current === userId) return;
      boundUserId.current = userId;

      // Supabase asks that its own calls are not awaited inside this callback, so hand off.
      setTimeout(() => {
        void progressStore.bindUser(userId, user ? createCloudRemote(supabase, user.id) : null);
      }, 0);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") void progressStore.flush();
    };
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => document.removeEventListener("visibilitychange", flushWhenHidden);
  }, []);

  const signOut = useCallback(async () => {
    // Best effort: push the latest progress up first, but never trap someone on a slow network.
    await Promise.race([
      progressStore.flush(),
      new Promise<void>((resolve) => setTimeout(resolve, SIGN_OUT_SYNC_TIMEOUT_MS)),
    ]);
    await createClient().auth.signOut({ scope: "local" });
    router.push("/");
    router.refresh();
  }, [router]);

  const value = useMemo<AuthContextValue>(() => ({ ...auth, signOut }), [auth, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
};
