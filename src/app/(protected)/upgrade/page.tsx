"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  PiArrowRightBold,
  PiSealCheckFill,
  PiInfinityBold,
  PiYoutubeLogoBold,
  PiFilePdfBold,
  PiCheckBold
} from "react-icons/pi";
import { usePlan } from "@/hooks/use-plan";


function FaqItem({ q, a }: { q: string, a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#EDE8DE]">
      <button 
        className="w-full text-left py-4 bg-transparent border-none cursor-pointer text-[15px] font-medium text-[#3D2B1F] flex justify-between items-center gap-4 hover:text-[#39AB54] transition-colors"
        onClick={() => setOpen(!open)}
      >
        {q}
        <span className={`text-xs text-[#C4BAA8] transition-transform duration-250 ${open ? "rotate-180 text-[#39AB54]" : ""}`}>
          ▼
        </span>
      </button>
      <div 
        className="text-sm text-[#6B4C35] leading-relaxed overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "200px" : "0", paddingBottom: open ? "16px" : "0" }}
      >
        {a}
      </div>
    </div>
  );
}

export default function UpgradePage() {
  const { plan } = usePlan();
  const [isYearly, setIsYearly] = useState(false);
  const [proLoading, setProLoading] = useState(false);

  async function handleProCheckout() {
    setProLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.status === 401) {
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

  if (plan === "pro") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[#F7F2EA]">
        <div className="text-center max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-[0_20px_40px_rgba(28,28,24,0.06)] border border-[#C4BAA8]/30">
          <div className="w-20 h-20 bg-[#39AB54]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <PiSealCheckFill className="text-4xl text-[#39AB54]" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-[#3D2B1F] mb-3">You&apos;re already Pro!</h1>
          <p className="text-[#6B4C35] font-medium mb-8 text-sm">Enjoy unlimited access to everything Bloomr.</p>
          <div className="flex flex-col gap-3">
            <Link href="/garden" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#39AB54] text-white rounded-full font-semibold hover:bg-[#2A8040] transition-colors shadow-[0_4px_24px_rgba(57,171,84,0.4)] hover:shadow-[0_8px_32px_rgba(57,171,84,0.5)] hover:-translate-y-0.5">
              Go to your Garden <PiArrowRightBold />
            </Link>
            <button 
              onClick={async () => {
                const res = await fetch("/api/stripe/portal", { method: "POST" });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              }}
              className="text-sm text-[#6B4C35] hover:text-[#39AB54] underline-offset-4 hover:underline"
            >
              Manage Subscription
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F2EA] text-[#3D2B1F] font-sans overflow-x-hidden selection:bg-[#39AB54] selection:text-white">

      {/* ── LANDING-STYLE NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-16 bg-[#F7F2EA]/90 backdrop-blur-md border-b border-[#C4BAA8]/40 shadow-sm">
        <Link href="/" className="flex items-center gap-2 font-heading font-semibold text-xl text-[#3D2B1F]">
          <Image src="/bloomr_icon.svg" alt="Bloomr" width={28} height={28} style={{ width: 28, height: "auto" }} />
          Bloomr
        </Link>
        <ul className="hidden md:flex gap-8 list-none m-0 p-0">
          <li><a href="#pricing" className="text-sm text-[#6B4C35] hover:text-[#39AB54] transition-colors">Pricing</a></li>
          <li><a href="#features" className="text-sm text-[#6B4C35] hover:text-[#39AB54] transition-colors">Features</a></li>
          <li><a href="#faq" className="text-sm text-[#6B4C35] hover:text-[#39AB54] transition-colors">FAQ</a></li>
        </ul>
        <div className="flex items-center gap-3">
          <Link href="/garden" className="px-4 py-2 rounded-full border-2 border-[#39AB54] text-[#39AB54] text-sm font-medium hover:bg-[#C8EDCF] transition-colors">My Garden</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-[#1A2318] pt-32 pb-16 px-6 lg:px-20 text-center relative overflow-hidden">
        <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[800px] h-[500px]" style={{ background: 'radial-gradient(ellipse, rgba(57,171,84,0.18) 0%, transparent 65%)' }} />
        
        {/* Orbs */}
        <div className="absolute rounded-full pointer-events-none w-[300px] h-[300px] -top-20 left-[5%]" style={{ background: 'radial-gradient(circle, rgba(92,200,115,0.3), transparent 70%)', animation: 'floatSlow 8s infinite ease-in-out' }} />
        <div className="absolute rounded-full pointer-events-none w-[200px] h-[200px] top-5 right-[8%]" style={{ background: 'radial-gradient(circle, rgba(92,200,115,0.3), transparent 70%)', animation: 'floatReverse 10s infinite ease-in-out' }} />

        <div className="relative z-10 flex flex-col items-center pb-4">
          <div className="inline-flex items-center gap-2 bg-[#5CC873]/15 border border-[#5CC873]/30 text-[#5CC873] rounded-full px-4 py-1.5 text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5CC873] animate-pulse" /> Bloomr Pro
          </div>
          
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-4">
            Grow without<br /><em className="italic text-[#5CC873] pr-2">any limits.</em>
          </h1>
          
          <p className="text-white/55 text-[17px] max-w-lg leading-relaxed">
            Unlimited seeds, unlimited Flowy messages, and every upload type — so your entire curriculum can bloom.
          </p>

          <div className="mt-8 flex flex-col items-center gap-1.5 opacity-35 animate-[floatSlow_2s_infinite_ease-in-out]">
            <span className="text-[11px] text-white font-mono">see plans</span>
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white fill-none stroke-2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      </section>

      {/* ── UNLOCK STRIP ── */}
      <div className="bg-[#39AB54] py-4 px-6 lg:px-20 flex items-center justify-center gap-10 flex-wrap shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2 text-sm text-white font-medium">
          <PiInfinityBold className="text-lg" /> Unlimited seeds
        </div>
        <div className="flex items-center gap-2 text-sm text-white font-medium">
          <PiYoutubeLogoBold className="text-lg" /> YouTube & voice uploads
        </div>
        <div className="flex items-center gap-2 text-sm text-white font-medium">
          <PiInfinityBold className="text-lg" /> Unlimited Flowy messages
        </div>
        <div className="flex items-center gap-2 text-sm text-white font-medium">
          <PiFilePdfBold className="text-lg" /> Export notes as PDF
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto py-20 px-6">
        {/* ── BILLING TOGGLE ── */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <span className={`text-[15px] cursor-pointer transition-colors ${!isYearly ? 'text-[#3D2B1F] font-semibold' : 'text-[#6B4C35]'}`} onClick={() => setIsYearly(false)}>Monthly</span>
          <button 
            onClick={() => setIsYearly(!isYearly)}
            className={`w-12 h-6.5 rounded-full relative transition-colors duration-300 ${isYearly ? 'bg-[#39AB54]' : 'bg-[#C4BAA8]'}`}
          >
            <div className={`absolute top-[3px] left-[3px] w-[20px] h-[20px] bg-white rounded-full shadow transition-transform duration-300 ${isYearly ? 'translate-x-[22px]' : ''}`} />
          </button>
          <span className={`text-[15px] cursor-pointer flex items-center gap-2 transition-colors ${isYearly ? 'text-[#3D2B1F] font-semibold' : 'text-[#6B4C35]'}`} onClick={() => setIsYearly(true)}>
            Yearly
            {isYearly && <span className="bg-[#F5D03B] text-[#3D2B1F] text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">Save 20%</span>}
          </span>
        </div>

        {/* ── PRICING CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* FREE PLAN */}
          <div className="bg-white rounded-[24px] p-8 border border-[#C4BAA8]/60 hover:-translate-y-1 transition-transform shadow-[0_4px_24px_rgba(61,43,31,0.04)]">
            <div className="font-mono text-xs text-[#6B4C35] font-medium mb-1.5">Free</div>
            <div className="font-heading text-5xl font-bold text-[#3D2B1F] flex items-start gap-1">
              <sup className="text-2xl mt-1.5">$</sup>0<sub className="text-sm font-sans font-normal text-[#6B4C35] self-end mb-1">/month</sub>
            </div>
            <p className="mt-2 text-sm text-[#6B4C35] leading-relaxed">Everything you need to get started and try Bloomr with no commitment.</p>
            <div className="h-px bg-[#EDE8DE] my-6" />
            
            <div className="flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5 text-sm text-[#6B4C35]">
                <PiCheckBold className="text-[#39AB54] text-lg shrink-0 mt-px" /> <span><strong>3 seeds</strong> per week</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-[#6B4C35]">
                <PiCheckBold className="text-[#39AB54] text-lg shrink-0 mt-px" /> <span>PDF uploads</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-[#6B4C35]">
                <PiCheckBold className="text-[#39AB54] text-lg shrink-0 mt-px" /> <span>All study units & quizzes</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-[#6B4C35]">
                <PiCheckBold className="text-[#39AB54] text-lg shrink-0 mt-px" /> <span>Audio recaps & concept maps</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-[#6B4C35]">
                <PiCheckBold className="text-[#39AB54] text-lg shrink-0 mt-px" /> <span>Flowy — <strong>10 msgs/day</strong> per flower</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-[#C4BAA8]/70">
                <span className="w-4 flex justify-center text-lg mt-px">✗</span> <span>Voice & image uploads</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-[#C4BAA8]/70">
                <span className="w-4 flex justify-center text-lg mt-px">✗</span> <span>YouTube link uploads</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-[#C4BAA8]/70">
                <span className="w-4 flex justify-center text-lg mt-px">✗</span> <span>Export notes as PDF</span>
              </div>
            </div>
            
            <div className="mt-7">
              <button disabled className="w-full py-3.5 rounded-full border-2 border-[#C4BAA8]/40 bg-transparent text-[#6B4C35] text-[15px] font-medium opacity-50 cursor-not-allowed">
                Current Plan
              </button>
            </div>
          </div>

          {/* PRO PLAN */}
          <div className="bg-[#1A2318] rounded-[24px] p-8 border border-[#39AB54]/30 shadow-[0_20px_80px_rgba(26,35,24,0.4),0_0_0_1px_rgba(92,200,115,0.1)] relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute inset-0 rounded-[24px] border-2 border-transparent bg-[linear-gradient(135deg,rgba(92,200,115,0.4),transparent_40%,rgba(57,171,84,0.2)_80%,transparent)] bg-origin-border" style={{ WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
            
            <div className="relative z-10">
              <div className="absolute top-0 right-0 bg-[#F5D03B] text-[#3D2B1F] rounded-full px-3 py-1 text-[11px] font-mono font-bold">Most Popular</div>
              <div className="font-mono text-xs text-white/50 font-medium mb-1.5">Pro</div>
              <div className="font-heading text-5xl font-bold text-white flex items-start gap-1">
                <sup className="text-2xl mt-1.5">$</sup>{isYearly ? '4.79' : '5.99'}<sub className="text-sm font-sans font-normal text-white/50 self-end mb-1">/month</sub>
              </div>
              <p className="mt-2 text-sm text-white/55 leading-relaxed">Your whole curriculum, fully bloomed. No caps, no compromises.</p>
              <div className="h-px bg-white/10 my-6" />
              
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5 text-sm text-white/80">
                  <PiCheckBold className="text-[#5CC873] text-lg shrink-0 mt-px" /> <span><strong>Unlimited seeds</strong></span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-white/80">
                  <PiCheckBold className="text-[#5CC873] text-lg shrink-0 mt-px" /> <span>PDF uploads</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-white/80">
                  <PiCheckBold className="text-[#5CC873] text-lg shrink-0 mt-px" /> <span>All study units & quizzes</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-white/80">
                  <PiCheckBold className="text-[#5CC873] text-lg shrink-0 mt-px" /> <span>Audio recaps & concept maps</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-white/80">
                  <PiCheckBold className="text-[#5CC873] text-lg shrink-0 mt-px" /> <span>Flowy — <strong>unlimited messages</strong></span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-white/80">
                  <PiCheckBold className="text-[#5CC873] text-lg shrink-0 mt-px" /> <span><strong>Voice & image uploads</strong></span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-white/80">
                  <PiCheckBold className="text-[#5CC873] text-lg shrink-0 mt-px" /> <span><strong>YouTube link uploads</strong></span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-white/80">
                  <PiCheckBold className="text-[#5CC873] text-lg shrink-0 mt-px" /> <span><strong>Export notes as PDF</strong></span>
                </div>
              </div>
              
              <div className="mt-7">
                <button 
                  onClick={handleProCheckout}
                  disabled={proLoading}
                  className="w-full py-3.5 rounded-full bg-[#39AB54] text-white text-[16px] font-semibold flex items-center justify-center gap-2 hover:bg-[#5CC873] transition-all shadow-[0_4px_24px_rgba(57,171,84,0.5)] hover:shadow-[0_8px_40px_rgba(57,171,84,0.6)] hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {proLoading ? "Redirecting..." : <>🌱 Upgrade to Pro</>}
                </button>
                <div className="mt-3 text-center text-[11.5px] text-white/35 font-mono">
                  {isYearly ? 'Billed as $57.50/year · Cancel anytime' : 'Cancel anytime · No commitment'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FEATURE TABLE ── */}
        <div className="mt-28">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#3D2B1F] text-center mb-8">Everything side by side</h2>
          
          <div className="grid grid-cols-[1fr_80px_80px] md:grid-cols-[1fr_120px_120px] px-4 pb-2">
            <div></div>
            <div className="text-center font-mono text-[11px] font-medium text-[#6B4C35]">Free</div>
            <div className="text-center font-mono text-[11px] font-semibold text-[#2A8040]">Pro</div>
          </div>

          {[
            {
              label: "Seeds & Uploads",
              rows: [
                { f: "Seeds per week", desc: "One seed = one flower / topic", free: "3", pro: "Unlimited", isText: true },
                { f: "PDF uploads", free: true, pro: true },
                { f: "Voice recordings", free: false, pro: true },
                { f: "Image uploads", desc: "AI reads and transcribes your notes", free: false, pro: true },
                { f: "YouTube links", desc: "Paste any lecture URL", free: false, pro: true }
              ]
            },
            {
              label: "Study Tools",
              rows: [
                { f: "AI study notes & key terms", free: true, pro: true },
                { f: "MC & short answer quizzes", free: true, pro: true },
                { f: "Audio recaps", desc: "ElevenLabs TTS per unit", free: true, pro: true },
                { f: "Concept maps", free: true, pro: true },
                { f: "Export notes as PDF", free: false, pro: true }
              ]
            },
            {
              label: "Flowy AI Tutor",
              rows: [
                { f: "Flowy messages", desc: "Context-aware per flower", free: "10/day", pro: "Unlimited", isText: true }
              ]
            },
            {
              label: "Garden",
              rows: [
                { f: "3D garden & all flower types", free: true, pro: true },
                { f: "Collectible pots (gacha)", free: true, pro: true },
                { f: "Drag & rearrange garden", free: true, pro: true }
              ]
            }
          ].map((group, i) => (
            <div key={i} className="mb-6">
              <div className="font-mono text-[11px] font-semibold text-[#C4BAA8] uppercase tracking-widest px-4 py-2">
                {group.label}
              </div>
              {group.rows.map((row, j) => (
                <div key={j} className="grid grid-cols-[1fr_80px_80px] md:grid-cols-[1fr_120px_120px] px-4 py-3 items-center rounded-xl hover:bg-[#EDE8DE] even:bg-[#C4BAA8]/5 transition-colors">
                  <div>
                    <div className="text-[14px] text-[#3D2B1F]">{row.f}</div>
                    {row.desc && <div className="text-[12px] text-[#6B4C35] font-mono mt-0.5">{row.desc}</div>}
                  </div>
                  <div className="text-center">
                    {row.isText ? <span className="font-mono text-xs text-[#6B4C35]">{row.free}</span> : 
                      (row.free ? <span className="text-[#39AB54] font-bold">✓</span> : <span className="text-[#C4BAA8]">—</span>)}
                  </div>
                  <div className="text-center">
                    {row.isText ? <span className="font-mono text-xs text-[#2A8040] font-semibold">{row.pro}</span> : 
                      (row.pro ? <span className="text-[#39AB54] font-bold">✓</span> : <span className="text-[#C4BAA8]">—</span>)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── FAQ ── */}
        <div className="mt-28 max-w-2xl mx-auto">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#3D2B1F] text-center mb-8">Common questions</h2>
          
          <div className="border-t border-[#EDE8DE]">
            <FaqItem q="Can I cancel anytime?" a="Yes — cancel from your account settings at any time. You keep Pro access until the end of your billing period. No questions asked." />
            <FaqItem q="What happens to my flowers if I cancel?" a="Your flowers are permanent. Every flower you've grown stays in your garden forever, regardless of your plan. You'll just be limited to 3 new seeds per week on the free plan." />
            <FaqItem q="Is the yearly plan billed upfront?" a="Yes, the yearly plan is billed as one payment of $57.50/year (equivalent to $4.79/month — a 20% saving vs monthly). You can switch back to monthly at renewal." />
            <FaqItem q="How does the seed limit work on Free?" a="Free users can plant 3 new flowers per week. Seeds reset every Monday. There's no limit on studying existing flowers — only on creating new ones." />
            <FaqItem q="What file formats are supported?" a="Free: PDF. Pro: PDF, MP3/WAV voice recordings, JPG/PNG images of notes, and any YouTube video URL. More formats coming soon." />
          </div>
        </div>

        {/* ── BOTTOM CTA ── */}
        <div className="mt-28 bg-[#1A2318] rounded-[28px] p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px]" style={{ background: 'radial-gradient(ellipse, rgba(57,171,84,0.2) 0%, transparent 70%)' }} />
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white relative z-10">Your whole curriculum,<br /><em className="italic text-[#5CC873] pr-2">fully bloomed.</em></h2>
          <p className="mt-3 text-white/50 text-[15px] relative z-10">Join thousands of students who unlocked their full garden.</p>
          <button 
            onClick={handleProCheckout}
            className="mt-7 relative z-10 px-8 py-3.5 rounded-full bg-[#39AB54] text-white text-base font-semibold hover:bg-[#5CC873] shadow-[0_4px_24px_rgba(57,171,84,0.5)] transition-all hover:-translate-y-0.5"
          >
            🌱 Upgrade to Pro — {isYearly ? '$4.79' : '$5.99'}/mo
          </button>
        </div>

      </div>

      {/* ── FOOTER ── */}
      <footer className="mt-12 px-6 lg:px-20 py-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-[#EDE8DE] max-w-[1100px] mx-auto">
        <div className="flex gap-6">
          <a href="#" className="text-[13px] text-[#C4BAA8] hover:text-[#6B4C35] transition-colors">Privacy</a>
          <a href="#" className="text-[13px] text-[#C4BAA8] hover:text-[#6B4C35] transition-colors">Terms</a>
          <a href="#" className="text-[13px] text-[#C4BAA8] hover:text-[#6B4C35] transition-colors">Contact</a>
        </div>
        <div className="text-[12px] text-[#C4BAA8] font-mono">© 2026 Bloomr. All rights reserved.</div>
      </footer>
    </div>
  );
}
