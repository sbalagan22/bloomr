"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  PiSparkle, PiCheckBold, PiInfinityBold, PiMicrophoneBold,
  PiYoutubeLogoBold, PiImageBold, PiFilePdfBold, PiArrowRightBold,
  PiFlowerBold, PiSealCheckFill, PiXBold,
} from "react-icons/pi";
import { usePlan } from "@/hooks/use-plan";

const FREE_ITEMS = [
  "3 seeds per week",
  "PDF uploads only",
  "10 Flowy messages/day",
  "All study units & quizzes",
  "Audio recaps",
];

const PRO_ITEMS = [
  { icon: PiInfinityBold, text: "Unlimited seeds — no weekly cap" },
  { icon: PiInfinityBold, text: "Unlimited Flowy AI messages" },
  { icon: PiMicrophoneBold, text: "Voice recording uploads" },
  { icon: PiImageBold, text: "Image & whiteboard uploads" },
  { icon: PiYoutubeLogoBold, text: "YouTube link uploads" },
  { icon: PiFilePdfBold, text: "Export study notes as PDF" },
];

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { plan } = usePlan();

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.status === 401) {
        router.push("/login?redirect=/upgrade");
        return;
      }
      let data: { url?: string; error?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON */ }
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Checkout failed. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Could not reach the server. Please check your connection.");
      setLoading(false);
    }
  }

  if (plan === "pro") {
    return (
      <div className="min-h-screen bg-[#f7f2ea] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-[#39AB54]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <PiSealCheckFill className="text-4xl text-[#39AB54]" />
          </div>
          <h1 className="font-heading text-3xl font-black text-[#1c1c18] mb-3">You&apos;re already Pro!</h1>
          <p className="text-on-surface-variant font-medium mb-8">Enjoy unlimited access to everything Bloomr.</p>
          <Link href="/garden" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#39AB54] text-white rounded-full font-bold hover:bg-[#2A8040] transition-colors shadow-lg shadow-[#39AB54]/20">
            Go to your Garden <PiArrowRightBold />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f2ea] relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-[700px] h-[700px] bg-[#C8EDCF]/35 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-[500px] h-[500px] bg-[#F5D03B]/12 rounded-full blur-3xl" />
      </div>

      {/* Minimal nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/bloomr_icon.svg" alt="Bloomr" width={26} height={26} />
          <span className="text-xl text-primary-container tracking-tighter font-logo">Bloomr</span>
        </Link>
        <Link href="/garden" className="text-sm font-bold text-on-surface-variant hover:text-[#1c1c18] transition-colors">
          ← Back to garden
        </Link>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-24">

        {/* Hero headline */}
        <div className="text-center pt-10 pb-16">
          <div className="inline-flex items-center gap-2 bg-[#39AB54]/12 text-[#39AB54] rounded-full px-4 py-1.5 text-xs font-black tracking-wider uppercase mb-5">
            <PiSparkle /> Pro Plan
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-black text-[#1c1c18] tracking-tight leading-[0.97] mb-5">
            Grow without<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39AB54] via-[#5AC76F] to-[#2A8040]">
              limits.
            </span>
          </h1>
          <p className="text-on-surface-variant text-lg font-medium max-w-md mx-auto">
            Everything in Free, plus unlimited access to every feature Bloomr has to offer.
          </p>
        </div>

        {/* Main content: comparison + CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start max-w-4xl mx-auto">

          {/* Free column */}
          <div className="lg:col-span-2 bg-white border-2 border-[#e5e2db] rounded-[1.75rem] p-7">
            <div className="mb-5">
              <p className="font-heading font-black text-lg text-[#1c1c18] mb-1">Free</p>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-4xl font-black text-[#1c1c18]">$0</span>
                <span className="text-on-surface-variant text-sm font-medium">/forever</span>
              </div>
            </div>
            <ul className="space-y-2.5">
              {FREE_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-[#1c1c18]/70">
                  <PiCheckBold className="text-[#39AB54]/50 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-5 border-t border-[#e5e2db]">
              <p className="text-xs text-on-surface-variant font-medium text-center">Your current plan</p>
            </div>
          </div>

          {/* Pro column */}
          <div className="lg:col-span-3 relative">
            {/* Glow ring */}
            <div className="absolute -inset-1 bg-gradient-to-br from-[#39AB54] to-[#2A8040] rounded-[2rem] blur-sm opacity-30" />

            <div className="relative bg-gradient-to-br from-[#39AB54] via-[#2E9648] to-[#1a6830] rounded-[1.75rem] p-8 overflow-hidden">
              {/* Texture blobs */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/8 rounded-full -translate-y-24 translate-x-24 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-black/10 rounded-full translate-y-16 -translate-x-16 pointer-events-none" />
              <div className="absolute inset-0 rounded-[1.75rem] ring-1 ring-white/15 pointer-events-none" />

              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                      <PiFlowerBold className="text-white text-base" />
                    </div>
                    <span className="font-heading font-black text-base text-white">Pro</span>
                  </div>
                  <span className="text-[10px] font-black text-white/80 bg-white/15 border border-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="font-heading text-5xl font-black text-white">$5.99</span>
                  <span className="text-white/65 text-sm font-medium">/month</span>
                </div>
                <p className="text-white/50 text-xs font-medium mb-7">Billed monthly. Cancel anytime.</p>

                {/* Pro features */}
                <ul className="space-y-2.5 mb-8">
                  {PRO_ITEMS.map((item) => (
                    <li key={item.text} className="flex items-center gap-3 text-sm font-semibold text-white">
                      <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                        <item.icon className="text-white text-xs" />
                      </div>
                      {item.text}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-white text-[#1a6830] font-black text-base tracking-tight hover:bg-[#f0faf2] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-xl shadow-black/10"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-[#39AB54]/30 border-t-[#39AB54] animate-spin" />
                      Redirecting to checkout...
                    </>
                  ) : (
                    <>Upgrade to Pro — $5.99/mo <PiArrowRightBold className="text-lg" /></>
                  )}
                </button>

                {error && (
                  <div className="mt-3 flex items-start gap-2 bg-red-500/20 border border-red-300/20 rounded-xl px-4 py-3">
                    <PiXBold className="text-red-200 text-sm shrink-0 mt-0.5" />
                    <p className="text-red-100 text-xs font-medium">{error}</p>
                  </div>
                )}

                <p className="text-white/35 text-xs text-center mt-4">
                  Secured by Stripe · Apple Pay & Google Pay accepted
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Social proof / trust row */}
        <div className="max-w-4xl mx-auto mt-8 grid grid-cols-3 gap-4">
          {[
            { stat: "100%", label: "Secure checkout via Stripe" },
            { stat: "Cancel", label: "anytime, no questions asked" },
            { stat: "Instant", label: "access after payment" },
          ].map((t) => (
            <div key={t.label} className="bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl px-4 py-4 text-center">
              <p className="font-heading font-black text-base text-[#1c1c18] mb-0.5">{t.stat}</p>
              <p className="text-[11px] text-on-surface-variant font-medium leading-tight">{t.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
