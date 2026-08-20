"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientAuth } from "@/lib/client-auth";
import { usePortal } from "@/lib/portal-store";
import { createClient } from "@/lib/supabase/client";
import { getPasswordResetRedirectUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";

const REMEMBER_KEY = "vitespace-remember-email";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function LoginPage() {
  const router = useRouter();
  const { login, session, hydrated } = useClientAuth();
  const { setActiveClientId, refreshFromSupabase } = usePortal();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<"sign-in" | "forgot">("sign-in");
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

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

  function validateSignIn() {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 6) next.password = "Password must be at least 6 characters.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validateSignIn()) return;

    setLoading(true);

    try {
      if (rememberMe) localStorage.setItem(REMEMBER_KEY, email.trim());
      else localStorage.removeItem(REMEMBER_KEY);
    } catch {
      /* ignore */
    }

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

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    setResetMessage(null);

    const target = resetEmail.trim() || email.trim();
    if (!target) {
      setResetError("Enter the email associated with your account.");
      return;
    }
    if (!isValidEmail(target)) {
      setResetError("Enter a valid email address.");
      return;
    }

    setResetLoading(true);
    const supabase = createClient();
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      target,
      { redirectTo: getPasswordResetRedirectUrl() }
    );
    setResetLoading(false);

    if (resetErr) {
      setResetError(resetErr.message || "Could not send reset email.");
      return;
    }

    setResetMessage(
      "If an account exists for that email, you’ll receive a reset link shortly."
    );
  }

  if (!hydrated || session?.clientId || session?.isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f7fb]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0c0e1a]">
            <img src="/logo.png" alt="" className="h-6 w-6 object-contain" />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-[#f6f7fb]">
      {/* Brand panel */}
      <aside className="relative hidden w-[44%] max-w-[520px] shrink-0 flex-col justify-between overflow-hidden bg-[#0c0e1a] px-10 py-10 text-white lg:flex xl:px-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 20% 0%, rgba(76,70,232,0.35), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(76,70,232,0.18), transparent 50%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10">
          <Link href="/login" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
              <img
                src="/logo.png"
                alt="Vitespace"
                className="h-7 w-7 object-contain"
              />
            </span>
            <span className="text-[17px] font-semibold tracking-tight">
              Vitespace
            </span>
          </Link>
        </div>

        <div className="relative z-10 max-w-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
            Client portal
          </p>
          <h2 className="mt-3 text-[28px] font-semibold leading-tight tracking-tight text-white xl:text-[32px]">
            Your work, progress, and partnership — in one place.
          </h2>
          <p className="mt-4 text-[14px] leading-relaxed text-white/55">
            Sign in securely to view project updates, documents, invoices, and
            messages with the Vitespace team.
          </p>
        </div>

        <p className="relative z-10 text-[12px] text-white/35">
          © {new Date().getFullYear()} Vitespace. All rights reserved.
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex min-h-dvh flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[400px]">
            {/* Mobile brand */}
            <div className="mb-10 flex flex-col items-center lg:hidden">
              <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#0c0e1a] shadow-lg shadow-[#0c0e1a]/15 ring-1 ring-black/5">
                <img
                  src="/logo.png"
                  alt="Vitespace"
                  className="h-8 w-8 object-contain"
                />
              </span>
              <p className="mt-4 text-[15px] font-semibold tracking-tight text-foreground">
                Vitespace
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Client portal
              </p>
            </div>

            <div className="mb-8">
              <div className="mb-6 hidden lg:block">
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#0c0e1a] ring-1 ring-black/5">
                  <img
                    src="/logo.png"
                    alt="Vitespace"
                    className="h-7 w-7 object-contain"
                  />
                </span>
              </div>
              <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-[28px]">
                {mode === "sign-in" ? "Welcome back" : "Reset password"}
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                {mode === "sign-in"
                  ? "Sign in to your Vitespace portal to continue."
                  : "Enter your email and we’ll send you a secure reset link."}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(12,14,26,0.04),0_8px_24px_rgba(12,14,26,0.06)] ring-1 ring-black/[0.04] sm:p-8">
              {mode === "sign-in" ? (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl bg-destructive/8 px-3.5 py-3 text-[13px] leading-snug text-destructive ring-1 ring-destructive/15"
                    >
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-[13px] font-medium text-foreground"
                    >
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email)
                          setFieldErrors((f) => ({ ...f, email: undefined }));
                      }}
                      placeholder="you@company.com"
                      disabled={loading}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={
                        fieldErrors.email ? "email-error" : undefined
                      }
                      className={cn(
                        "h-11 rounded-xl border-input/80 bg-[#fafafb] px-3.5 text-[14px] shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:bg-white",
                        fieldErrors.email &&
                          "border-destructive focus-visible:border-destructive"
                      )}
                    />
                    {fieldErrors.email && (
                      <p id="email-error" className="text-[12px] text-destructive">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-[13px] font-medium text-foreground"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password)
                            setFieldErrors((f) => ({
                              ...f,
                              password: undefined,
                            }));
                        }}
                        placeholder="Enter your password"
                        disabled={loading}
                        aria-invalid={Boolean(fieldErrors.password)}
                        aria-describedby={
                          fieldErrors.password ? "password-error" : undefined
                        }
                        className={cn(
                          "h-11 rounded-xl border-input/80 bg-[#fafafb] px-3.5 pr-11 text-[14px] shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:bg-white",
                          fieldErrors.password &&
                            "border-destructive focus-visible:border-destructive"
                        )}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p
                        id="password-error"
                        className="text-[12px] text-destructive"
                      >
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    <label className="flex cursor-pointer items-center gap-2.5 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={loading}
                        className="size-4 rounded border-input accent-brand"
                      />
                      <span className="text-[13px] text-muted-foreground">
                        Remember me
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setResetEmail(email);
                        setResetError("");
                        setResetMessage(null);
                      }}
                      className="text-[13px] font-medium text-brand transition-colors hover:text-brand/80"
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 w-full rounded-xl text-[14px] font-semibold shadow-sm shadow-brand/20"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in…
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
              ) : (
                <form
                  onSubmit={handleResetPassword}
                  className="space-y-5"
                  noValidate
                >
                  {resetError && (
                    <div
                      role="alert"
                      className="rounded-xl bg-destructive/8 px-3.5 py-3 text-[13px] leading-snug text-destructive ring-1 ring-destructive/15"
                    >
                      {resetError}
                    </div>
                  )}
                  {resetMessage && (
                    <div
                      role="status"
                      className="rounded-xl bg-emerald-500/8 px-3.5 py-3 text-[13px] leading-snug text-emerald-800 ring-1 ring-emerald-500/20"
                    >
                      {resetMessage}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="reset-email"
                      className="text-[13px] font-medium text-foreground"
                    >
                      Email address
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@company.com"
                      disabled={resetLoading}
                      className="h-11 rounded-xl border-input/80 bg-[#fafafb] px-3.5 text-[14px] shadow-none focus-visible:bg-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={resetLoading}
                    className="h-11 w-full rounded-xl text-[14px] font-semibold shadow-sm shadow-brand/20"
                  >
                    {resetLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending link…
                      </span>
                    ) : (
                      "Send reset link"
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("sign-in");
                      setResetError("");
                      setResetMessage(null);
                    }}
                    className="w-full text-center text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    disabled={resetLoading}
                  >
                    Back to sign in
                  </button>
                </form>
              )}
            </div>

            <p className="mt-8 text-center text-[12px] text-muted-foreground lg:hidden">
              © {new Date().getFullYear()} Vitespace
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
