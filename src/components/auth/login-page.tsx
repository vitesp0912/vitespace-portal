"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientAuth } from "@/lib/client-auth";
import { usePortal } from "@/lib/portal-store";

export function LoginPage() {
  const router = useRouter();
  const { login, session, hydrated } = useClientAuth();
  const { setActiveClientId, refreshFromSupabase } = usePortal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (session?.isAdmin) {
      router.replace("/admin");
      return;
    }
    if (session?.clientId) {
      router.replace("/");
    }
  }, [hydrated, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.isAdmin) {
      router.replace("/admin");
      return;
    }

    if (!result.clientId) {
      setError("This account is not linked to a client portal.");
      setLoading(false);
      return;
    }

    await refreshFromSupabase({ isAdmin: false });
    setActiveClientId(result.clientId);
    router.replace("/");
  }

  if (!hydrated || session?.clientId || session?.isAdmin) {
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
              Access your project progress, documents, invoices, and messages.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl bg-surface p-6 portal-shadow ring-1 ring-border/50"
          >
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
              <div className="relative h-8">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-8 pr-10 leading-normal"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 shrink-0" />
                  ) : (
                    <Eye className="h-4 w-4 shrink-0" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
