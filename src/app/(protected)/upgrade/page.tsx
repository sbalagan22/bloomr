"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PiSparkle, PiCheckBold, PiInfinityBold, PiMicrophoneBold,
  PiYoutubeLogoBold, PiImageBold, PiFilePdfBold, PiArrowLeftBold,
  PiFlowerBold, PiArrowRightBold, PiLockBold, PiSealCheckFill,
  PiShieldCheckBold, PiCreditCardBold,
} from "react-icons/pi";
import { usePlan } from "@/hooks/use-plan";

const PRO_FEATURES = [
  {
    icon: PiInfinityBold,
    title: "Unlimited Seeds",
    desc: "Plant as many flowers as you want, no weekly cap.",
    free: "3 / week",
  },
  {
    icon: PiInfinityBold,
    title: "Unlimited Flowy Messages",
    desc: "Ask your AI tutor anything, anytime. No daily limit.",
    free: "10 / day",
  },
  {
    icon: PiMicrophoneBold,
    title: "Voice Uploads",
    desc: "Record lectures directly — AI transcribes and studies them.",
    free: null,
  },
  {
    icon: PiImageBold,
    title: "Image & Diagram Analysis",
    desc: "Upload whiteboards, diagrams, and handwritten notes.",
    free: null,
  },
  {
    icon: PiYoutubeLogoBold,
    title: "YouTube Link Uploads",
    desc: "Drop any YouTube URL — lectures, tutorials, explainers.",
    free: null,
  },
  {
    icon: PiFilePdfBold,
    title: "Export Study Notes as PDF",
    desc: "Download your AI-generated notes as a beautiful PDF.",
    free: null,
  },
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
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else if (res.status === 401) {
        router.push("/login?redirect=/upgrade");
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f2ea]">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#C8EDCF]/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-[400px] h-[400px] bg-[#F5D03B]/10 rounded-full blur-3xl" />
      </div>

      {/* Back button */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2.5 shadow-md border border-white/60 text-sm font-bold text-[#1c1c18] hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <PiArrowLeftBold />
          Back
        </button>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-20">

        {/* Already Pro */}
        {plan === "pro" && (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 bg-[#39AB54]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <PiSealCheckFill className="text-4xl text-[#39AB54]" />
            </div>
            <h1 className="font-heading text-3xl font-black text-[#1c1c18] mb-3">You&apos;re already Pro!</h1>
            <p className="text-on-surface-variant font-medium mb-8">Enjoy unlimited access to everything Bloomr has to offer.</p>
            <Link
              href="/garden"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#39AB54] text-white rounded-full font-bold hover:bg-[#2A8040] transition-colors shadow-lg shadow-[#39AB54]/20"
            >
              Go to your Garden <PiArrowRightBold />
            </Link>
          </div>
        )}

        {plan !== "pro" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

            {/* Left — Hero + features */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#39AB54]/10 text-[#39AB54] rounded-full px-4 py-2 text-sm font-bold mb-6">
                <PiSparkle />
                Bloomr Pro
              </div>
              <h1 className="font-heading text-5xl lg:text-6xl font-black text-[#1c1c18] tracking-tight leading-[1.05] mb-4">
                Grow without<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#39AB54] to-[#2A8040]">
                  limits.
                </span>
              </h1>
              <p className="text-on-surface-variant text-lg font-medium mb-10 max-w-md">
                Unlock everything Bloomr has to offer — unlimited seeds, unlimited AI, and every upload type.
              </p>

              {/* Feature comparison list */}
              <div className="space-y-3">
                {PRO_FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="flex items-start gap-4 bg-white rounded-2xl px-5 py-4 border border-[#e5e2db] hover:border-[#39AB54]/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#39AB54]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <f.icon className="text-[#39AB54] text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-[#1c1c18]">{f.title}</p>
                        {f.free && (
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 line-through">
                            Free: {f.free}
                          </span>
                        )}
                        {!f.free && (
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                            Free: locked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant font-medium mt-0.5">{f.desc}</p>
                    </div>
                    <PiCheckBold className="text-[#39AB54] shrink-0 mt-1.5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Checkout card */}
            <div className="lg:sticky lg:top-24">
              {/* Pro card */}
              <div className="relative bg-gradient-to-br from-[#39AB54] to-[#1a6830] rounded-[2rem] p-8 shadow-2xl shadow-[#39AB54]/25 overflow-hidden mb-4">
                {/* Decorative orbs */}
                <div className="absolute top-0 right-0 w-56 h-56 bg-white/8 rounded-full -translate-y-28 translate-x-28 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full translate-y-20 -translate-x-20 pointer-events-none" />
                <div className="absolute inset-0 rounded-[2rem] ring-1 ring-white/15 pointer-events-none" />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                          <PiFlowerBold className="text-white text-lg" />
                        </div>
                        <span className="font-heading font-black text-lg text-white">Bloomr Pro</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-heading text-6xl font-black text-white">$5.99</span>
                        <span className="text-white/70 font-medium text-sm">/month</span>
                      </div>
                      <p className="text-white/60 text-xs mt-1 font-medium">Billed monthly. Cancel anytime.</p>
                    </div>
                    <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">
                      Most Popular
                    </span>
                  </div>

                  {/* Quick perks */}
                  <ul className="space-y-2 mb-6">
                    {["Unlimited seeds & flowers", "Unlimited Flowy AI messages", "Voice, image & YouTube uploads"].map((perk) => (
                      <li key={perk} className="flex items-center gap-2.5 text-sm text-white/90 font-medium">
                        <PiCheckBold className="text-white shrink-0" />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-white text-[#39AB54] font-bold text-base hover:bg-[#f7f2ea] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-[#39AB54]/30 border-t-[#39AB54] animate-spin" />
                        Redirecting to checkout...
                      </>
                    ) : (
                      <>Upgrade to Pro — $5.99/mo <PiArrowRightBold /></>
                    )}
                  </button>

                  {error && (
                    <div className="mt-3 bg-red-500/20 border border-red-300/30 rounded-xl px-4 py-2.5">
                      <p className="text-red-100 text-xs font-medium text-center">{error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust signals */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { icon: PiLockBold, label: "Secure checkout" },
                  { icon: PiShieldCheckBold, label: "Cancel anytime" },
                  { icon: PiCreditCardBold, label: "Stripe secured" },
                ].map((t) => (
                  <div key={t.label} className="bg-white rounded-2xl px-3 py-3 border border-[#e5e2db] flex flex-col items-center gap-1.5 text-center">
                    <t.icon className="text-[#39AB54] text-lg" />
                    <span className="text-[10px] font-bold text-on-surface-variant leading-tight">{t.label}</span>
                  </div>
                ))}
              </div>

              <p className="text-center text-on-surface-variant text-xs font-medium">
                Questions?{" "}
                <Link href="/garden" className="text-[#39AB54] font-bold hover:underline">
                  Return to your garden
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
