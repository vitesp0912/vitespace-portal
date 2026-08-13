"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { useClientAuth } from "@/lib/client-auth";
import { usePortal } from "@/lib/portal-store";

const PUBLIC_PATHS = ["/login"];

export function AuthSessionSync() {
  const { session, hydrated: authHydrated } = useClientAuth();
  const {
    setActiveClientId,
    hydrated: storeHydrated,
    refreshFromSupabase,
  } = usePortal();
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!authHydrated || !storeHydrated) return;

    if (!session) {
      setActiveClientId("");
      loadedFor.current = null;
      return;
    }

    // Admin (no client membership): load all clients via RLS admin policies
    if (session.isAdmin && !session.clientId) {
      setActiveClientId("");
      const key = `admin:${session.userId}`;
      if (loadedFor.current === key) return;
      loadedFor.current = key;
      void refreshFromSupabase({ isAdmin: true });
      return;
    }

    if (!session.clientId) {
      setActiveClientId("");
      loadedFor.current = null;
      return;
    }

    setActiveClientId(session.clientId);

    const key = `${session.userId}:${session.clientId}`;
    if (loadedFor.current === key) return;
    loadedFor.current = key;
    void refreshFromSupabase({ isAdmin: Boolean(session.isAdmin) });
  }, [
    session,
    authHydrated,
    storeHydrated,
    setActiveClientId,
    refreshFromSupabase,
  ]);

  return null;
}

export function PortalAuthGuard({ children }: { children: React.ReactNode }) {
  const { session, hydrated } = useClientAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (PUBLIC_PATHS.includes(pathname)) return;

    if (session?.isAdmin && !session.clientId) {
      router.replace("/admin");
      return;
    }

    if (!session?.clientId) {
      router.replace("/login");
    }
  }, [session, hydrated, pathname, router]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (PUBLIC_PATHS.includes(pathname)) return <>{children}</>;
  if (session?.isAdmin && !session.clientId) return null;
  if (!session?.clientId) return null;

  return <>{children}</>;
}

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { session, hydrated } = useClientAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;

    if (!session || !session.isAdmin || !isAdminEmail(session.email)) {
      router.replace("/login");
    }
  }, [session, hydrated, router]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!session?.isAdmin || !isAdminEmail(session.email)) {
    return null;
  }

  return <>{children}</>;
}
