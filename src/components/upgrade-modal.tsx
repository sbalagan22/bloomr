"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PiSparkle, PiXBold, PiCheckBold, PiInfinityBold, PiMicrophoneBold, PiYoutubeLogoBold, PiImageBold } from "react-icons/pi";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: string;
}

const PRO_PERKS = [
  { icon: PiInfinityBold, text: "Unlimited seeds & flowers" },
  { icon: PiInfinityBold, text: "Unlimited Flowy AI messages" },
  { icon: PiMicrophoneBold, text: "Voice input uploads" },
  { icon: PiImageBold, text: "Image uploads with AI analysis" },
  { icon: PiYoutubeLogoBold, text: "YouTube link uploads" },
  { icon: PiCheckBold, text: "Export study notes as PDF" },
];

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/login?redirect=/upgrade";
        return;
      }
      let data: { url?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON */ }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl border-0 bg-white p-0 shadow-2xl overflow-hidden">
        {/* Header gradient */}
        <div className="relative bg-linear-to-br from-[#39AB54] to-[#1d7535] px-8 pt-8 pb-10 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/60 hover:text-white transition-colors"
          >
            <PiXBold className="text-lg" />
          </button>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <PiSparkle className="text-3xl text-white" />
          </div>
          <h2 className="font-heading text-2xl font-black text-white mb-1">Unlock Pro</h2>
          {reason && <p className="text-white/80 text-sm font-medium">{reason}</p>}
          <div className="mt-3 inline-flex items-baseline gap-1 bg-white/20 rounded-full px-4 py-1.5">
            <span className="font-heading text-2xl font-black text-white">$5.99</span>
            <span className="text-white/70 text-sm">/month</span>
          </div>
        </div>

        {/* Perks list */}
        <div className="px-8 py-6">
          <ul className="space-y-3 mb-6">
            {PRO_PERKS.map((perk) => (
              <li key={perk.text} className="flex items-center gap-3 text-sm font-medium text-[#1c1c18]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#39AB54]/10">
                  <PiCheckBold className="text-[#39AB54] text-xs" />
                </span>
                {perk.text}
              </li>
            ))}
          </ul>

          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full rounded-2xl bg-[#39AB54] py-6 text-base font-bold text-white hover:bg-[#2A8040] shadow-lg shadow-[#39AB54]/20 disabled:opacity-70"
          >
            {loading ? "Redirecting to checkout..." : "Upgrade to Pro →"}
          </Button>
          <p className="text-center text-gray-400 text-xs mt-3">Cancel anytime. No commitment.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
