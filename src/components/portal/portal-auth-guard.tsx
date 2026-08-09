"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useClientAuth } from "@/lib/client-auth";
import { usePortal } from "@/lib/portal-store";

const PUBLIC_PATHS = ["/login"];

export function AuthSessionSync() {
  const { session, hydrated: authHydrated } = useClientAuth();
  const { setActiveClientId, hydrated: storeHydrated } = usePortal();

  useEffect(() => {
    if (!authHydrated || !storeHydrated) return;
    if (session) setActiveClientId(session.clientId);
    else setActiveClientId("");
  }, [session, authHydrated, storeHydrated, setActiveClientId]);

  return null;
}

export function PortalAuthGuard({ children }: { children: React.ReactNode }) {
  const { session, hydrated } = useClientAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!session && !PUBLIC_PATHS.includes(pathname)) {
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

  if (!session) return null;

  return <>{children}</>;
}
