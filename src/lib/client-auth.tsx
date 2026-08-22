"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/client";
import { resolveUserAccess } from "@/lib/supabase/data";

export interface ClientSession {
  email: string;
  /** Null for admin-only sessions (no client_users link). */
  clientId: string | null;
  userId: string;
  isAdmin: boolean;
  /** Display name from client_users.name for portal users */
  displayName?: string | null;
  role?: string | null;
}

type LoginResult =
  | { ok: true; clientId: string | null; isAdmin: boolean }
  | { ok: false; error: string };

type ClientAuthContextValue = {
  session: ClientSession | null;
  user: User | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  /** Admin-only: preview portal as a client without switching Auth user */
  signInAsClient: (clientId: string, email: string) => void;
  logout: () => Promise<void>;
};

const ClientAuthContext = createContext<ClientAuthContextValue | null>(null);

const ACCESS_CACHE_KEY = "vitespace.portal.access";

type AccessCache = {
  userId: string;
  clientId: string | null;
  isAdmin: boolean;
  displayName: string | null;
  role: string | null;
};

function readAccessCache(userId: string): AccessCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACCESS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AccessCache;
    if (parsed?.userId !== userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeAccessCache(session: ClientSession) {
  if (typeof window === "undefined") return;
  try {
    const payload: AccessCache = {
      userId: session.userId,
      clientId: session.clientId,
      isAdmin: session.isAdmin,
      displayName: session.displayName?.trim() || null,
      role: session.role ?? null,
    };
    window.localStorage.setItem(ACCESS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

function clearAccessCache() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACCESS_CACHE_KEY);
  } catch {
    // ignore
  }
}

function sessionFromAccess(
  authUser: User,
  access: {
    clientId: string | null;
    isAdmin: boolean;
    displayName?: string | null;
    role?: string | null;
  }
): ClientSession | null {
  const email = authUser.email ?? "";
  const admin = isAdminEmail(email);
  const cached = readAccessCache(authUser.id);
  const displayName =
    access.displayName?.trim() ||
    cached?.displayName?.trim() ||
    null;

  if (admin) {
    return {
      email,
      userId: authUser.id,
      isAdmin: true,
      clientId: access.clientId,
      displayName,
      role: access.role ?? cached?.role ?? null,
    };
  }

  if (!access.clientId) return null;

  return {
    email,
    userId: authUser.id,
    isAdmin: false,
    clientId: access.clientId,
    displayName,
    role: access.role ?? cached?.role ?? null,
  };
}

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [preview, setPreview] = useState<{ clientId: string; email: string } | null>(
    null
  );

  const buildSession = useCallback(async (authUser: User) => {
    const supabase = createClient();
    const access = await resolveUserAccess(supabase, authUser.id);
    const next = sessionFromAccess(authUser, access);

    if (!next) {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setPreview(null);
      clearAccessCache();
      return null;
    }

    // Non-admin accounts must stay linked to a client
    if (!next.isAdmin && !next.clientId) {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setPreview(null);
      clearAccessCache();
      return null;
    }

    setUser(authUser);
    setSession(next);
    writeAccessCache(next);
    return next;
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      if (data.user) {
        // Paint cached name immediately so overview never flashes email → name
        const cached = readAccessCache(data.user.id);
        if (cached?.displayName) {
          const email = data.user.email ?? "";
          const admin = isAdminEmail(email);
          if (admin || cached.clientId) {
            setUser(data.user);
            setSession({
              email,
              userId: data.user.id,
              isAdmin: admin || cached.isAdmin,
              clientId: admin ? cached.clientId : cached.clientId,
              displayName: cached.displayName,
              role: cached.role,
            });
          }
        }
        try {
          await buildSession(data.user);
        } catch {
          setUser(null);
          setSession(null);
        }
      }
      setHydrated(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!authSession?.user) {
        setUser(null);
        setSession(null);
        setPreview(null);
        clearAccessCache();
        return;
      }
      void buildSession(authSession.user);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [buildSession]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const trimmed = email.trim();
      const wantsAdmin = isAdminEmail(trimmed);

      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (error || !data.user) {
        return { ok: false, error: error?.message || "Invalid email or password." };
      }

      try {
        const access = await resolveUserAccess(supabase, data.user.id);
        const next = sessionFromAccess(data.user, access);

        if (wantsAdmin) {
          if (!next?.isAdmin || !isAdminEmail(data.user.email)) {
            await supabase.auth.signOut();
            return {
              ok: false,
              error: "Only the Vitespace team admin account can sign in as admin.",
            };
          }
        } else if (!next?.clientId) {
          await supabase.auth.signOut();
          return {
            ok: false,
            error: "This account is not linked to a client portal yet.",
          };
        }

        if (!next) {
          await supabase.auth.signOut();
          return { ok: false, error: "Could not resolve account access." };
        }

        setUser(data.user);
        setSession(next);
        writeAccessCache(next);
        setPreview(null);
        return { ok: true, clientId: next.clientId, isAdmin: next.isAdmin };
      } catch (e) {
        await supabase.auth.signOut();
        return {
          ok: false,
          error: e instanceof Error ? e.message : "Could not resolve account access.",
        };
      }
    },
    []
  );

  const signInAsClient = useCallback((clientId: string, email: string) => {
    setPreview({ clientId, email });
  }, []);

  const logout = useCallback(async () => {
    const supabase = createClient();
    setPreview(null);
    setSession(null);
    setUser(null);
    clearAccessCache();
    await supabase.auth.signOut();
  }, []);

  const effectiveSession = useMemo(() => {
    if (!session) return null;
    if (preview && session.isAdmin) {
      return {
        ...session,
        clientId: preview.clientId,
        email: preview.email || session.email,
      };
    }
    return session;
  }, [session, preview]);

  const value = useMemo(
    () => ({
      session: effectiveSession,
      user,
      hydrated,
      login,
      signInAsClient,
      logout,
    }),
    [effectiveSession, user, hydrated, login, signInAsClient, logout]
  );

  return (
    <ClientAuthContext.Provider value={value}>{children}</ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext);
  if (!ctx) throw new Error("useClientAuth must be used within ClientAuthProvider");
  return ctx;
}
