"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const SESSION_KEY = "vitespace-client-session";

export interface ClientSession {
  email: string;
  clientId: string;
}

/** Demo credentials — replace with Supabase Auth in backend phase */
const DEMO_USERS: Record<string, { password: string; clientId: string }> = {
  "admin@celesteabode.com": {
    password: "Test@123",
    clientId: "celeste-abode",
  },
};

function loadSession(): ClientSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as ClientSession;
  } catch { /* ignore */ }
  return null;
}

function saveSession(session: ClientSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

type ClientAuthContextValue = {
  session: ClientSession | null;
  hydrated: boolean;
  login: (email: string, password: string) => { ok: true; clientId: string } | { ok: false; error: string };
  signInAsClient: (clientId: string, email: string) => void;
  logout: () => void;
};

const ClientAuthContext = createContext<ClientAuthContextValue | null>(null);

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setHydrated(true);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const user = DEMO_USERS[normalized];

    if (!user || user.password !== password) {
      return { ok: false as const, error: "Invalid email or password." };
    }

    const next: ClientSession = { email: normalized, clientId: user.clientId };
    saveSession(next);
    setSession(next);
    return { ok: true as const, clientId: user.clientId };
  }, []);

  const signInAsClient = useCallback((clientId: string, email: string) => {
    const next: ClientSession = { email, clientId };
    saveSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    saveSession(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, hydrated, login, signInAsClient, logout }),
    [session, hydrated, login, signInAsClient, logout]
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
