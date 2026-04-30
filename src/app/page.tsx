"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { PricingSection } from "@/components/pricing-section";

const Flower3D = dynamic(
  () => import("@/components/flower-3d").then((mod) => ({ default: mod.Flower3D })),
  { ssr: false, loading: () => <div className="h-full w-full bg-black/5 rounded-full animate-pulse" /> }
);



export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-parchment text-soil font-sans overflow-x-hidden selection:bg-[#39AB54] selection:text-white">
      
      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-16 bg-[#F7F2EA]/85 backdrop-blur-md border-b border-[#C4BAA8]/40 transition-shadow duration-300 ${scrolled ? 'shadow-[0_2px_24px_rgba(61,43,31,0.08)]' : ''}`}>
        <Link href="/" className="flex items-center gap-2 font-heading font-semibold text-xl text-soil">
          <Image src="/bloomr_icon.svg" alt="Bloomr" width={28} height={28} />
          Bloomr
        </Link>
        <ul className="hidden md:flex gap-8 list-none m-0 p-0">
          <li><a href="#how-it-works" className="text-sm text-bark hover:text-[#39AB54] transition-colors">How It Works</a></li>
          <li><a href="#features" className="text-sm text-bark hover:text-[#39AB54] transition-colors">Features</a></li>
          <li><a href="#pricing" className="text-sm text-bark hover:text-[#39AB54] transition-colors">Pricing</a></li>
        </ul>
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 rounded-full border-2 border-[#39AB54] text-[#39AB54] text-sm font-medium hover:bg-[#C8EDCF] transition-colors">Sign In</Link>
          <Link href="/signup" className="px-5 py-2 rounded-full bg-[#39AB54] text-white text-sm font-medium hover:bg-[#2A8040] hover:-translate-y-[1px] shadow-[0_2px_12px_rgba(57,171,84,0.35)] hover:shadow-[0_4px_20px_rgba(57,171,84,0.45)] transition-all">Start Free</Link>
        </div>
      </nav>

      <main>
        {/* ── HERO ── */}
        <section className="relative min-h-screen pt-24 pb-16 px-6 lg:px-20 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 80% 60% at 70% 40%, #D4EED8 0%, transparent 65%), radial-gradient(ellipse 40% 40% at 10% 80%, #EDE8DE 0%, transparent 60%)'
          }} />
          
          {/* LEFT SIDE — text, shifted a bit right */}
          <div className="relative z-10 lg:pl-10 lg:pr-6">
            <div className="inline-flex items-center gap-2 bg-[#C8EDCF] text-[#2A8040] rounded-full px-3.5 py-1.5 text-xs font-medium font-mono mb-6 animate-fade-in-up">
              <span className="w-1.5 h-1.5 rounded-full bg-[#39AB54]" /> AI-powered study companion
            </div>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-[4.5rem] font-bold leading-[1.1] text-soil mb-5 animate-fade-in-up [animation-delay:100ms] text-balance">
              Learn it.<br />
              <em className="italic text-[#39AB54] pr-2">Grow it.</em><br />
              Own it.
            </h1>
            <p className="text-lg text-bark leading-relaxed max-w-md animate-fade-in-up [animation-delay:200ms]">
              Upload your lectures, PDFs, or notes — and watch them bloom into a living 3D garden. The more you study, the more it grows.
            </p>
            <div className="mt-8 flex items-center gap-5 animate-fade-in-up [animation-delay:300ms]">
              <Link href="/signup" className="px-8 py-3.5 rounded-full bg-[#39AB54] text-white text-base font-medium hover:bg-[#2A8040] hover:-translate-y-[1px] shadow-[0_2px_12px_rgba(57,171,84,0.35)] hover:shadow-[0_4px_20px_rgba(57,171,84,0.45)] transition-all">
                🌱 Plant Your First Seed
              </Link>
              <a href="#how-it-works" className="text-sm text-bark border-b border-stone hover:text-soil transition-colors pb-px">See how it works</a>
            </div>
            <div className="mt-12 flex gap-8 animate-fade-in-up [animation-delay:400ms]">
              <div className="flex flex-col gap-0.5">
                <span className="font-heading text-2xl font-bold text-[#39AB54]">12k+</span>
                <span className="text-xs text-bark">flowers planted</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-heading text-2xl font-bold text-[#39AB54]">94%</span>
                <span className="text-xs text-bark">retention boost</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-heading text-2xl font-bold text-[#39AB54]">5 min</span>
                <span className="text-xs text-bark">avg. setup time</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE — large interactive 3D rose (drag to rotate, no zoom) */}
          <div className="relative z-10 hidden lg:flex items-center justify-center animate-fade-in-up [animation-delay:150ms]">
            <div className="relative w-[520px] h-[540px]">
              {/* Soft glow rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[300px] h-[300px] rounded-full border border-[#39AB54]/10 animate-[glowPulse_4s_ease-in-out_infinite]" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[420px] h-[420px] rounded-full border border-[#39AB54]/06 animate-[glowPulse_4s_1.5s_ease-in-out_infinite]" />
              </div>
              {/* Ground shadow */}
              <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 w-[200px] h-[30px] bg-[#39AB54]/10 rounded-full blur-xl pointer-events-none" />

              {/* The 3D Rose — full container, drag/rotate, no zoom */}
              <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
                <Flower3D
                  flowerType="rose"
                  growthStage={4}
                  size="full"
                  interactive={true}
                  disableZoom={true}
                  showGround={false}
                />
              </div>

              {/* Floating label */}
              <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/80 backdrop-blur-md border border-[#C4BAA8]/40 rounded-full px-4 py-2 shadow-sm pointer-events-none z-20">
                <span className="text-xs font-medium text-bark font-mono">🌹 drag to rotate</span>
              </div>

              {/* Flowy chat bubble */}
              <div className="absolute top-4 -right-6 bg-white rounded-2xl px-3.5 py-2.5 text-xs text-bark font-sans shadow-[0_2px_16px_rgba(61,43,31,0.12)] border border-[#C4BAA8]/30 max-w-[150px] leading-relaxed z-20 pointer-events-none" style={{ animation: 'floatSlow 4s 2s infinite ease-in-out' }}>
                🌿 Ask me anything about your study material!
              </div>

              {/* Mini badge */}
              <div className="absolute top-16 -left-4 bg-white rounded-2xl px-3 py-2 shadow-[0_2px_16px_rgba(61,43,31,0.1)] border border-[#C4BAA8]/30 z-20 pointer-events-none" style={{ animation: 'floatSlow 5s 1s infinite ease-in-out' }}>
                <div className="text-[10px] font-mono text-[#39AB54] font-bold">BIOLOGY</div>
                <div className="text-[11px] font-medium text-bark mt-0.5">82% progress</div>
                <div className="mt-1 h-1 w-[60px] rounded-full bg-[#EDE8DE] overflow-hidden">
                  <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#2A8040] to-[#5CC873]" />
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ── MARQUEE ── */}
        <div className="bg-soil text-cream py-3 overflow-hidden whitespace-nowrap relative flex select-none">
          <div className="animate-marquee inline-flex gap-12 text-sm font-mono items-center">
            {Array.from({length: 2}).map((_, i) => (
              <span key={i} className="flex gap-12 items-center">
                <span className="flex items-center gap-2"><span className="text-[#5CC873] text-[10px]">✦</span> Upload PDFs</span>
                <span className="flex items-center gap-2"><span className="text-[#5CC873] text-[10px]">✦</span> YouTube Links</span>
                <span className="flex items-center gap-2"><span className="text-[#5CC873] text-[10px]">✦</span> Voice Notes</span>
                <span className="flex items-center gap-2"><span className="text-[#5CC873] text-[10px]">✦</span> AI Study Notes</span>
                <span className="flex items-center gap-2"><span className="text-[#5CC873] text-[10px]">✦</span> Custom Quizzes</span>
                <span className="flex items-center gap-2"><span className="text-[#5CC873] text-[10px]">✦</span> 3D Garden</span>
                <span className="flex items-center gap-2"><span className="text-[#5CC873] text-[10px]">✦</span> Flowy AI Tutor</span>
                <span className="flex items-center gap-2"><span className="text-[#5CC873] text-[10px]">✦</span> Audio Recaps</span>
                <span className="flex items-center gap-2"><span className="text-[#5CC873] text-[10px]">✦</span> Mastery Exams</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── GROWTH CYCLE ── */}
        <section id="how-it-works" className="bg-[#1A2318] py-28 px-6 lg:px-20 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-xs font-medium font-mono text-[#5CC873] uppercase tracking-widest mb-3">
              <span className="w-5 h-[1.5px] bg-[#5CC873]" /> The Growth Cycle
            </div>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2]">
              Four steps from<br /><em className="italic text-[#5CC873] pr-2">seed to mastery.</em>
            </h2>
            <p className="mt-3 text-[#FFFFFF]/55 max-w-lg leading-relaxed text-[17px]">
              Your material doesn&apos;t just get summarized — it gets transformed into something you actually own.
            </p>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              <div className="hidden lg:block absolute top-[52px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[#5CC873]/40 to-transparent z-0" />
              <div className="hidden lg:block absolute top-[48px] left-[12.5%] w-3 h-2 rounded-full bg-[#5CC873] shadow-[0_0_8px_rgba(92,200,115,0.8)] z-10" style={{ animation: 'drift-fast 3s ease-in-out infinite' }} />

              {[
                { icon: "🌱", num: "1", title: "Drop Your Seed", desc: "Upload a PDF, paste a YouTube link, record your voice, or snap a photo of your notes." },
                { icon: "🌿", num: "2", title: "AI Does Its Thing", desc: "Our AI reads everything, builds study units, writes notes, highlights key terms, and creates quizzes." },
                { icon: "💧", num: "3", title: "Study & Quiz", desc: "Work through units, take AI-generated quizzes, and chat with Flowy — your personal AI tutor." },
                { icon: "🌸", num: "4", title: "Full Bloom", desc: "Pass your mastery exam and watch your flower permanently transform — yours forever." },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center relative z-20 group">
                  <div className="w-[104px] h-[104px] rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-6 relative backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 group-hover:border-[#39AB54] group-hover:bg-[#39AB54]/10 group-hover:shadow-[0_8px_32px_rgba(57,171,84,0.3)]">
                    {step.icon}
                    <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-[#39AB54] text-white text-[10px] font-bold font-mono flex items-center justify-center">
                      {step.num}
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-white/30 tracking-widest mb-1.5 uppercase">Step {step.num}</div>
                  <h3 className="font-heading text-lg font-semibold text-white mb-1.5">{step.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-24 px-6 lg:px-20 bg-parchment">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-xs font-medium font-mono text-[#2A8040] uppercase tracking-widest mb-3">
              <span className="w-5 h-[1.5px] bg-[#39AB54]" /> What&apos;s Included
            </div>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] text-soil">
              Everything you need<br />to master your material.
            </h2>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
              
              <div className="md:col-span-2 bg-white rounded-[20px] border border-[#C4BAA8]/40 p-7 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(61,43,31,0.1)] transition-all relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#2A8040] to-[#5CC873]" />
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#C8EDCF] flex items-center justify-center text-xl mb-4">🧠</div>
                  <h3 className="font-heading text-lg font-semibold text-soil mb-1.5">AI-Generated Quizzes</h3>
                  <p className="text-sm text-bark leading-relaxed">Multiple choice and short answer questions generated from your exact material — not generic textbook questions.</p>
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  <div className="text-[13px] text-bark font-mono mb-1">Q: What is the law of supply and demand?</div>
                  <div className="bg-[#C8EDCF] border-2 border-[#39AB54] text-[#2A8040] font-medium text-[13px] px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                    <span className="font-bold">✓</span> Price rises when demand exceeds supply
                  </div>
                  <div className="bg-[#ffe8ec] border border-[#E8637A]/30 text-[#9c2f3f] text-[13px] px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                    <span className="font-bold">✗</span> Supply always equals demand
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[20px] border border-[#C4BAA8]/40 p-7 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(61,43,31,0.1)] transition-all relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#E8637A]" />
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#fce8ec] flex items-center justify-center text-xl mb-4">💬</div>
                  <h3 className="font-heading text-lg font-semibold text-soil mb-1.5">Flowy AI Tutor</h3>
                  <p className="text-sm text-bark leading-relaxed">Context-aware chat that knows your material inside and out.</p>
                </div>
                <div className="mt-5 bg-[#EDE8DE] rounded-xl p-4 flex flex-col gap-2.5">
                  <div className="bg-white text-[13px] text-soil px-3 py-2 rounded-xl self-start border border-[#C4BAA8]/30 max-w-[85%]">Hi! Ask me anything about economics.</div>
                  <div className="bg-[#39AB54] text-white text-[13px] px-3 py-2 rounded-xl self-end max-w-[85%]">Explain comparative advantage</div>
                  <div className="bg-white border border-[#C4BAA8]/30 rounded-xl px-3 py-2 self-start flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-[#C4BAA8] rounded-full animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-[#C4BAA8] rounded-full animate-pulse [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-[#C4BAA8] rounded-full animate-pulse [animation-delay:300ms]" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[20px] border border-[#C4BAA8]/40 p-7 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(61,43,31,0.1)] transition-all relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#F4A44E]" />
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#fef3e8] flex items-center justify-center text-xl mb-4">🎧</div>
                  <h3 className="font-heading text-lg font-semibold text-soil mb-1.5">Audio Recaps</h3>
                  <p className="text-sm text-bark leading-relaxed">Every unit narrated by AI — study on your commute, in the gym, anywhere.</p>
                </div>
                <div className="mt-5 bg-[#EDE8DE] rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F4A44E] text-white flex items-center justify-center text-sm pl-0.5">▶</div>
                  <div className="flex-1">
                    <div className="text-[11px] font-mono text-bark mb-1">Unit 2 — Key Concepts</div>
                    <div className="h-1 bg-[#C4BAA8]/50 rounded-full overflow-hidden">
                      <div className="h-full w-[38%] bg-[#F4A44E] rounded-full" />
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-bark">2:14</div>
                </div>
              </div>

              <div className="bg-white rounded-[20px] border border-[#C4BAA8]/40 p-7 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(61,43,31,0.1)] transition-all relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#F5D03B]" />
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#fef9e0] flex items-center justify-center text-xl mb-4">🗺️</div>
                  <h3 className="font-heading text-lg font-semibold text-soil mb-1.5">Concept Maps</h3>
                  <p className="text-sm text-bark leading-relaxed">Auto-generated visual diagrams that show how ideas connect.</p>
                </div>
                <div className="mt-5 bg-[#EDE8DE] rounded-xl p-3.5 flex flex-col gap-2 font-mono text-[11px] text-bark">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#39AB54]" /> Supply → affects → Price</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F4A44E]" /> Demand → affects → Price</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#B09FD8]" /> Equilibrium → balances</div>
                </div>
              </div>

              <div className="bg-white rounded-[20px] border border-[#C4BAA8]/40 p-7 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(61,43,31,0.1)] transition-all relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#B09FD8]" />
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#ede8f8] flex items-center justify-center text-xl mb-4">📝</div>
                  <h3 className="font-heading text-lg font-semibold text-soil mb-1.5">AI Study Notes</h3>
                  <p className="text-sm text-bark leading-relaxed">Dense material condensed into clear, structured units.</p>
                </div>
                <div className="mt-5 bg-[#EDE8DE] rounded-xl p-3.5">
                  <div className="text-[11px] font-mono text-bark mb-1.5">Chapter 1 · Overview</div>
                  <div className="text-[12px] text-soil leading-relaxed">
                    The <span className="bg-[#C8EDCF] text-[#2A8040] font-medium px-1 rounded">law of demand</span> states that as price increases, quantity demanded <span className="bg-[#fef3e8] text-[#a0521a] font-medium px-1 rounded">decreases</span>.
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ── TESTIMONIALS ── */}
        <section className="py-24 px-6 lg:px-20 bg-parchment">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 text-xs font-medium font-mono text-[#2A8040] uppercase tracking-widest mb-3">
                Student Stories
              </div>
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] text-soil">
                Gardens growing<br />all over campus.
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-[20px] p-6 border border-[#C4BAA8]/40 hover:-translate-y-1 hover:shadow-[0_6px_32px_rgba(61,43,31,0.1)] transition-all">
                <div className="text-[11px] text-[#F5D03B] tracking-widest mb-2">★★★★★</div>
                <p className="text-[14px] text-soil leading-relaxed italic font-heading">&quot;I uploaded my entire econ syllabus and had a full study plan in 5 minutes. My garden has 12 flowers and I&apos;ve actually retained everything.&quot;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#39AB54] text-white flex items-center justify-center font-semibold text-sm">S</div>
                  <div>
                    <div className="text-[13px] font-medium text-soil">Sofia M.</div>
                    <div className="text-[11px] text-bark font-mono">Economics · UC Berkeley</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[20px] p-6 border border-[#C4BAA8]/40 hover:-translate-y-1 hover:shadow-[0_6px_32px_rgba(61,43,31,0.1)] transition-all">
                <div className="text-[11px] text-[#F5D03B] tracking-widest mb-2">★★★★★</div>
                <p className="text-[14px] text-soil leading-relaxed italic font-heading">&quot;Flowy explained concepts that my professor couldn&apos;t in 3 lectures. Having an AI that knows *my* notes is game-changing.&quot;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E8637A] text-white flex items-center justify-center font-semibold text-sm">J</div>
                  <div>
                    <div className="text-[13px] font-medium text-soil">James K.</div>
                    <div className="text-[11px] text-bark font-mono">Pre-Med · NYU</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[20px] p-6 border border-[#C4BAA8]/40 hover:-translate-y-1 hover:shadow-[0_6px_32px_rgba(61,43,31,0.1)] transition-all">
                <div className="text-[11px] text-[#F5D03B] tracking-widest mb-2">★★★★★</div>
                <p className="text-[14px] text-soil leading-relaxed italic font-heading">&quot;I&apos;m a visual learner and the garden completely changed how I think about studying. Watching my sunflower grow is genuinely motivating.&quot;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F4A44E] text-white flex items-center justify-center font-semibold text-sm">A</div>
                  <div>
                    <div className="text-[13px] font-medium text-soil">Anya R.</div>
                    <div className="text-[11px] text-bark font-mono">Psychology · UT Austin</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="bg-[#EDE8DE] py-24 px-6 lg:px-20">
          <PricingSection />
        </section>

        {/* ── CTA ── */}
        <section className="bg-[#1A2318] py-24 px-6 text-center relative overflow-hidden">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[600px] h-[300px]" style={{ background: 'radial-gradient(ellipse, rgba(57,171,84,0.2) 0%, transparent 70%)' }} />
          <div className="text-[12px] font-mono text-[#5CC873] uppercase tracking-widest mb-4">Ready to grow?</div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">Ready to plant<br /><em className="italic text-[#5CC873] pr-2">your first seed?</em></h2>
          <p className="text-white/60 text-[17px] mb-8">Join 12,000+ students who turned passive studying into active growth.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="px-8 py-3.5 rounded-full bg-[#39AB54] text-white text-base font-semibold hover:bg-[#5CC873] hover:-translate-y-0.5 shadow-[0_4px_24px_rgba(57,171,84,0.5)] transition-all">🌱 Get Started Free</Link>
            <Link href="/demo" className="px-8 py-3.5 rounded-full border-2 border-white/20 text-white/70 text-base font-medium hover:border-white/50 hover:text-white transition-all">See a demo</Link>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#1A2318] border-t border-white/10 px-6 lg:px-20 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Image src="/bloomr_icon.svg" alt="Bloomr" width={22} height={22} className="brightness-[10]" />
          <span className="font-heading text-base text-white/50">Bloomr</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="text-[13px] text-white/35 hover:text-white/70 transition-colors">Privacy</a>
          <a href="#" className="text-[13px] text-white/35 hover:text-white/70 transition-colors">Terms</a>
          <a href="#" className="text-[13px] text-white/35 hover:text-white/70 transition-colors">Pricing</a>
          <a href="#" className="text-[13px] text-white/35 hover:text-white/70 transition-colors">Blog</a>
        </div>
        <div className="text-[12px] text-white/25 font-mono">© 2026 Bloomr. All rights reserved.</div>
      </footer>
    </div>
  );
}
