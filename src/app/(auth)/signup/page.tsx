"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { PiEnvelopeBold, PiLockBold, PiUserBold } from "react-icons/pi";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) { setError(authError.message); return; }
      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="mb-10 text-center animate-fade-in-up">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <Image src="/bloomr_icon.svg" alt="Bloomr" width={40} height={40} className="drop-shadow-sm" />
        </Link>
        <h1 className="font-heading text-4xl font-extrabold text-on-surface tracking-tight">Plant your first seed</h1>
        <p className="mt-2 text-on-surface-variant">Create an account to begin your learning garden</p>
      </div>

      <div className="w-full max-w-sm bg-surface-container-lowest pebble-shadow rounded-2xl p-8 animate-fade-in-up-delay-1">
        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          {error && (
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">{error}</div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-bold text-on-surface">Email</label>
            <div className="relative">
              <PiEnvelopeBold className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-highest text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-deep/20 transition-all" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-bold text-on-surface">Password</label>
            <div className="relative">
              <PiLockBold className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input id="password" type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-highest text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-deep/20 transition-all" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirm" className="text-sm font-bold text-on-surface">Confirm Password</label>
            <div className="relative">
              <PiUserBold className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input id="confirm" type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password"
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-surface-container-highest text-on-surface placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-deep/20 transition-all" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="h-12 w-full rounded-full gradient-cta text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-primary-deep hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
