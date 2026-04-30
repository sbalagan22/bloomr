"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { usePlan } from "@/hooks/use-plan";
import {
  PiArrowLeftBold, PiUserBold, PiEnvelopeBold,
  PiCreditCardBold, PiSignOutBold, PiSparkle, PiWarningBold,
} from "react-icons/pi";

export default function SettingsPage() {
  const router = useRouter();
  const { plan } = usePlan();
  const [email, setEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        setDisplayName(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "");
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleManageSubscription = async () => {
    setManageLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) { setManageLoading(false); return; }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setManageLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelConfirm) { setCancelConfirm(true); return; }
    setCancelLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) { setCancelLoading(false); return; }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setCancelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f2ea]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Back */}
        <Link
          href="/garden"
          className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-[#39AB54] transition-colors mb-10"
        >
          <PiArrowLeftBold /> Back to garden
        </Link>

        <h1 className="font-heading text-3xl font-black text-[#1c1c18] mb-8 tracking-tight">Settings</h1>

        {/* Account Info */}
        <section className="bg-white rounded-3xl p-7 border-2 border-[#e5e2db] mb-5">
          <h2 className="font-heading font-black text-base text-[#1c1c18] mb-5 flex items-center gap-2">
            <PiUserBold className="text-[#39AB54]" /> Account
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                Email
              </label>
              <div className="flex items-center gap-3 bg-[#f7f2ea] rounded-xl px-4 py-3 border border-[#e5e2db]">
                <PiEnvelopeBold className="text-on-surface-variant shrink-0" />
                <span className="text-sm font-medium text-[#1c1c18]">{email || "—"}</span>
              </div>
            </div>

            {displayName && (
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  Name
                </label>
                <div className="flex items-center gap-3 bg-[#f7f2ea] rounded-xl px-4 py-3 border border-[#e5e2db]">
                  <PiUserBold className="text-on-surface-variant shrink-0" />
                  <span className="text-sm font-medium text-[#1c1c18]">{displayName}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                Plan
              </label>
              <div className="flex items-center gap-3 bg-[#f7f2ea] rounded-xl px-4 py-3 border border-[#e5e2db]">
                {plan === "pro" ? (
                  <>
                    <PiSparkle className="text-[#39AB54] shrink-0" />
                    <span className="text-sm font-bold text-[#39AB54]">Pro — Unlimited access</span>
                  </>
                ) : (
                  <>
                    <PiUserBold className="text-on-surface-variant shrink-0" />
                    <span className="text-sm font-medium text-[#1c1c18]">Free — 3 seeds/week</span>
                    <Link href="/upgrade" className="ml-auto text-xs font-black text-white bg-[#39AB54] hover:bg-[#2A8040] px-3 py-1.5 rounded-full transition-colors">
                      Upgrade
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Subscription (Pro only) */}
        {plan === "pro" && (
          <section className="bg-white rounded-3xl p-7 border-2 border-[#e5e2db] mb-5">
            <h2 className="font-heading font-black text-base text-[#1c1c18] mb-5 flex items-center gap-2">
              <PiCreditCardBold className="text-[#39AB54]" /> Subscription
            </h2>

            <p className="text-sm text-on-surface-variant mb-5 leading-relaxed">
              Manage your billing, update your payment method, or cancel your subscription through the Stripe customer portal.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleManageSubscription}
                disabled={manageLoading}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#39AB54] text-white font-bold text-sm hover:bg-[#2A8040] transition-colors disabled:opacity-60"
              >
                <PiCreditCardBold />
                {manageLoading ? "Opening portal…" : "Manage billing"}
              </button>

              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 ${
                  cancelConfirm
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-[#f7f2ea] text-red-500 border-2 border-red-200 hover:bg-red-50"
                }`}
              >
                <PiWarningBold />
                {cancelLoading ? "Redirecting…" : cancelConfirm ? "Confirm cancel" : "Cancel subscription"}
              </button>
            </div>

            {cancelConfirm && (
              <p className="text-xs text-red-500 mt-3 font-medium">
                Click again to confirm. You will be redirected to the Stripe portal to cancel.
              </p>
            )}
          </section>
        )}

        {/* Danger zone */}
        <section className="bg-white rounded-3xl p-7 border-2 border-[#e5e2db]">
          <h2 className="font-heading font-black text-base text-[#1c1c18] mb-5 flex items-center gap-2">
            <PiSignOutBold className="text-red-500" /> Sign out
          </h2>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#f7f2ea] text-red-500 border-2 border-red-200 hover:bg-red-50 font-bold text-sm transition-colors"
          >
            <PiSignOutBold /> Sign out of Bloomr
          </button>
        </section>
      </div>
    </div>
  );
}
