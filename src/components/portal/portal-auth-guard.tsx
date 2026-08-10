"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
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

    if (!session?.clientId) {
      setActiveClientId("");
      loadedFor.current = null;
      return;
    }

    setActiveClientId(session.clientId);

    const key = `${session.userId}:${session.clientId}`;
    if (loadedFor.current === key) return;
    loadedFor.current = key;
    void refreshFromSupabase({ isAdmin: false });
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
    if (!session?.clientId && !PUBLIC_PATHS.includes(pathname)) {
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

  if (!session?.clientId) return null;

  return <>{children}</>;
}

/** Admin guard kept for later — not used while focusing on client portal. */
export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
