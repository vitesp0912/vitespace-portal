"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const RECOVERY_FLAG = "vitespace-pw-recovery";

/**
 * Password can only be changed when Supabase has established a session
 * from the email recovery link (or an existing signed-in session).
 * Visiting this URL alone, with no session, cannot reset anyone's password.
 */
export function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirm?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    function markRecovery() {
      try {
        sessionStorage.setItem(RECOVERY_FLAG, "1");
      } catch {
        /* ignore */
      }
      if (!cancelled) setCanReset(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        markRecovery();
        return;
      }
      if (session?.user && event === "SIGNED_IN") {
        // PKCE exchange from the email link often surfaces as SIGNED_IN
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;
        if (
          params.has("code") ||
          hash.includes("type=recovery") ||
          sessionStorage.getItem(RECOVERY_FLAG) === "1"
        ) {
          markRecovery();
        }
      }
    });

    void (async () => {
      // Give the client a moment to exchange ?code= from the email redirect
      await new Promise((r) => setTimeout(r, 400));
      if (cancelled) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const fromEmail =
        typeof window !== "undefined" &&
        (new URLSearchParams(window.location.search).has("code") ||
          window.location.hash.includes("type=recovery") ||
          sessionStorage.getItem(RECOVERY_FLAG) === "1");

      if (user && fromEmail) {
        markRecovery();
      } else if (user && sessionStorage.getItem(RECOVERY_FLAG) === "1") {
        markRecovery();
      } else {
        // No recovery session → cannot set a password (even if somehow logged in)
        setCanReset(false);
      }

      setChecking(false);
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  function validate() {
    const next: { password?: string; confirm?: string } = {};
    if (!password) next.password = "Enter a new password.";
    else if (password.length < 8)
      next.password = "Password must be at least 8 characters.";
    if (!confirm) next.confirm = "Confirm your new password.";
    else if (confirm !== password) next.confirm = "Passwords do not match.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(
        "This reset link is invalid or has expired. Request a new one from the sign-in page."
      );
      setCanReset(false);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message || "Could not update password.");
      setLoading(false);
      return;
    }

    try {
      sessionStorage.removeItem(RECOVERY_FLAG);
    } catch {
      /* ignore */
    }

    await supabase.auth.signOut();
    setDone(true);
    setLoading(false);

    setTimeout(() => {
      router.replace("/login");
    }, 2000);
  }

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f6f7fb]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0c0e1a]">
            <img src="/logo.png" alt="" className="h-6 w-6 object-contain" />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
          <p className="text-[13px] text-muted-foreground">
            Verifying reset link…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f6f7fb] px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#0c0e1a] shadow-lg shadow-[#0c0e1a]/15 ring-1 ring-black/5">
            <img
              src="/logo.png"
              alt="Vitespace"
              className="h-8 w-8 object-contain"
            />
          </span>
          <h1 className="mt-5 text-[26px] font-semibold tracking-tight text-foreground">
            Set new password
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            Choose a strong password for your Vitespace portal account.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(12,14,26,0.04),0_8px_24px_rgba(12,14,26,0.06)] ring-1 ring-black/[0.04] sm:p-8">
          {!canReset ? (
            <div className="space-y-4 text-center">
              <div
                role="alert"
                className="rounded-xl bg-destructive/8 px-3.5 py-3 text-[13px] leading-snug text-destructive ring-1 ring-destructive/15"
              >
                This reset link is invalid or has expired. For security, you
                cannot set a password by opening this page alone — use the link
                from your email.
              </div>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-11 w-full rounded-xl"
                )}
              >
                Back to sign in
              </Link>
            </div>
          ) : done ? (
            <div className="space-y-3 text-center">
              <div
                role="status"
                className="rounded-xl bg-emerald-500/8 px-3.5 py-3 text-[13px] leading-snug text-emerald-800 ring-1 ring-emerald-500/20"
              >
                Password updated. Redirecting you to sign in…
              </div>
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand" />
            </div>
          ) : (
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
                <Label htmlFor="password" className="text-[13px] font-medium">
                  New password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password)
                        setFieldErrors((f) => ({ ...f, password: undefined }));
                    }}
                    disabled={loading}
                    aria-invalid={Boolean(fieldErrors.password)}
                    className={cn(
                      "h-11 rounded-xl border-input/80 bg-[#fafafb] px-3.5 pr-11 text-[14px] shadow-none focus-visible:bg-white",
                      fieldErrors.password && "border-destructive"
                    )}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                  <p className="text-[12px] text-destructive">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-[13px] font-medium">
                  Confirm password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      if (fieldErrors.confirm)
                        setFieldErrors((f) => ({ ...f, confirm: undefined }));
                    }}
                    disabled={loading}
                    aria-invalid={Boolean(fieldErrors.confirm)}
                    className={cn(
                      "h-11 rounded-xl border-input/80 bg-[#fafafb] px-3.5 pr-11 text-[14px] shadow-none focus-visible:bg-white",
                      fieldErrors.confirm && "border-destructive"
                    )}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {fieldErrors.confirm && (
                  <p className="text-[12px] text-destructive">
                    {fieldErrors.confirm}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl text-[14px] font-semibold shadow-sm shadow-brand/20"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating…
                  </span>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          <Link href="/login" className="font-medium text-brand hover:text-brand/80">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
