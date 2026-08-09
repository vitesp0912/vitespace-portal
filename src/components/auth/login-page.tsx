"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientAuth } from "@/lib/client-auth";
import { usePortal } from "@/lib/portal-store";

export function LoginPage() {
  const router = useRouter();
  const { login, session, hydrated } = useClientAuth();
  const { setActiveClientId } = usePortal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && session) router.replace("/");
  }, [hydrated, session, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = login(email, password);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setActiveClientId(result.clientId);
    router.replace("/");
  }

  if (!hydrated || session) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/20">
              <span className="text-lg font-bold text-brand">V</span>
            </div>
            <h1 className="text-[24px] font-semibold tracking-tight">Sign in to your portal</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Access your project progress, approvals, and billing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-surface p-6 portal-shadow ring-1 ring-border/50">
            {error && (
              <div className="rounded-lg bg-red-500/10 px-3 py-2 text-[13px] text-red-700 ring-1 ring-red-500/20">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[12px] text-muted-foreground">
            Demo: admin@celesteabode.com / Test@123
          </p>
        </div>
      </div>

      <footer className="border-t border-border/60 py-4 text-center text-[12px] text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">Vitespace internal admin</Link>
      </footer>
    </div>
  );
}
