"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PiCheckBold, PiLockBold, PiSparkle, PiFlowerBold, PiInfinityBold,
  PiMicrophoneBold, PiYoutubeLogoBold, PiImageBold, PiFilePdfBold,
  PiArrowRightBold,
} from "react-icons/pi";

const FREE_FEATURES: { text: string; included: boolean }[] = [
  { text: "3 seeds per week", included: true },
  { text: "PDF uploads", included: true },
  { text: "All study units & MC quizzes", included: true },
  { text: "Audio recaps (TTS)", included: true },
  { text: "Concept maps & diagrams", included: true },
  { text: "Weak areas analysis", included: true },
  { text: "Practice quizzes", included: true },
  { text: "AI Tutor Flowy (10 msg/day)", included: true },
  { text: "Voice input uploads", included: false },
  { text: "Image uploads with AI analysis", included: false },
  { text: "YouTube link uploads", included: false },
  { text: "Unlimited Flowy messages", included: false },
  { text: "Unlimited seeds", included: false },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PRO_FEATURES: { text: string; highlight?: boolean; icon?: any }[] = [
  { text: "Everything in Free", highlight: false },
  { text: "Unlimited seeds", highlight: true, icon: PiInfinityBold },
  { text: "Unlimited Flowy messages", highlight: true, icon: PiInfinityBold },
  { text: "Voice input uploads", highlight: true, icon: PiMicrophoneBold },
  { text: "Image uploads with AI analysis", highlight: true, icon: PiImageBold },
  { text: "YouTube link uploads", highlight: true, icon: PiYoutubeLogoBold },
  { text: "Export study notes as PDF", highlight: false, icon: PiFilePdfBold },
];

export function PricingSection() {
  const [proLoading, setProLoading] = useState(false);

  async function handleProCheckout() {
    setProLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.status === 401) {
        // Not logged in — send them to signup with redirect back to upgrade
        window.location.href = "/signup?redirect=/upgrade";
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setProLoading(false);
      }
    } catch {
      setProLoading(false);
    }
  }

  return (
    <section id="pricing" className="max-w-5xl mx-auto px-6 py-28">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-[#39AB54]/10 text-[#39AB54] rounded-full px-4 py-2 text-sm font-bold mb-6">
          <PiSparkle /> Simple pricing
        </div>
        <h2 className="font-heading text-4xl lg:text-6xl font-black text-[#1c1c18] mb-5 tracking-tight leading-tight">
          Start free.<br />
          <span className="text-transparent bg-clip-text bg-linear-to-br from-[#39AB54] to-[#2A8040]">
            Grow without limits.
          </span>
        </h2>
        <p className="text-on-surface-variant text-lg font-medium max-w-lg mx-auto">
          Everything you need to master your studies. One plan that grows with you.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

        {/* Free Card */}
        <div className="bg-white border-2 border-[#e5e2db] rounded-[2rem] p-8 flex flex-col hover:border-[#d0cdc5] transition-colors duration-300">
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#39AB54]/10 flex items-center justify-center">
                <PiFlowerBold className="text-xl text-[#39AB54]" />
              </div>
              <span className="font-heading font-black text-xl text-[#1c1c18]">Free</span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="font-heading text-5xl font-black text-[#1c1c18]">$0</span>
              <span className="text-on-surface-variant font-medium text-sm">/forever</span>
            </div>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
              Perfect for getting started. No credit card required.
            </p>
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {FREE_FEATURES.map((f) => (
              <li
                key={f.text}
                className={`flex items-center gap-3 text-sm font-medium ${
                  f.included ? "text-[#1c1c18]" : "text-gray-300"
                }`}
              >
                {f.included
                  ? <PiCheckBold className="text-[#39AB54] shrink-0 text-base" />
                  : <PiLockBold className="text-gray-300 shrink-0 text-base" />
                }
                {f.text}
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="block w-full py-4 rounded-2xl border-2 border-[#e5e2db] text-center font-bold text-[#1c1c18] hover:border-[#39AB54] hover:text-[#39AB54] transition-all duration-300 text-sm"
          >
            Get Started Free
          </Link>
        </div>

        {/* Pro Card */}
        <div className="relative bg-linear-to-br from-[#39AB54] to-[#1a6830] rounded-[2rem] p-8 flex flex-col shadow-2xl shadow-[#39AB54]/25 overflow-hidden animate-border-shimmer">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/8 rounded-full -translate-y-28 translate-x-28 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full translate-y-20 -translate-x-20 pointer-events-none" />
          <div className="absolute inset-0 rounded-[2rem] ring-1 ring-white/15 pointer-events-none" />

          <div className="relative mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <PiInfinityBold className="text-xl text-white" />
                </div>
                <span className="font-heading font-black text-xl text-white">Pro</span>
              </div>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20">
                Most Popular
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="font-heading text-5xl font-black text-white">$5.99</span>
              <span className="text-white/70 font-medium text-sm">/month</span>
            </div>
            <p className="text-sm text-white/75 font-medium leading-relaxed">
              Unlimited growth. No limits, no compromises.
            </p>
          </div>

          <ul className="space-y-3 flex-1 mb-8 relative">
            {PRO_FEATURES.map((f) => (
              <li
                key={f.text}
                className={`flex items-center gap-3 text-sm font-medium ${
                  f.highlight ? "text-white font-bold" : "text-white/75"
                }`}
              >
                <PiCheckBold className={`shrink-0 text-base ${f.highlight ? "text-white" : "text-white/60"}`} />
                {f.text}
                {f.highlight && f.icon && (
                  <f.icon className="text-white/60 text-base shrink-0 ml-auto" />
                )}
              </li>
            ))}
          </ul>

          <div className="relative">
            <button
              onClick={handleProCheckout}
              disabled={proLoading}
              className="w-full py-4 rounded-2xl bg-white text-[#39AB54] font-bold text-base hover:bg-[#f7f2ea] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {proLoading ? "Redirecting..." : <>Start Pro — $5.99/month <PiArrowRightBold /></>}
            </button>
            <p className="text-center text-white/40 text-xs mt-3">Cancel anytime. No commitment.</p>
          </div>
        </div>
      </div>

      {/* Compare note */}
      <p className="text-center text-on-surface-variant text-sm font-medium mt-10">
        Already a Pro member?{" "}
        <Link href="/garden" className="text-[#39AB54] font-bold hover:underline">
          Go to your garden →
        </Link>
      </p>
    </section>
  );
}
