import Link from "next/link";
import Image from "next/image";
import { PiPottedPlantFill, PiSparkle, PiDropHalfBottom, PiFlower, PiBrainBold, PiShootingStarBold, PiArrowRightBold, PiFlaskBold, PiPaletteBold, PiHeadphonesBold } from "react-icons/pi";
import { HiArrowRight } from "react-icons/hi2";
import { HeroFlower } from "@/components/hero-flower";
import { PricingSection } from "@/components/pricing-section";
import { UniversityMarquee } from "@/components/university-marquee";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #FFFFFF 0%, #BDE0F5 25%, #5AB4E5 55%, #3E9FD5 80%, #4CAF60 100%)" }}
    >
      {/* Cloud layer 1 — slow drift */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute top-[8%] left-0 h-[18%] animate-drift-slow"
          style={{ width: "200%", backgroundImage: "url('/clouds_1.png')", backgroundSize: "50% auto", backgroundRepeat: "repeat-x", opacity: 0.7 }}
        />
        {/* Cloud layer 2 — fast drift */}
        <div
          className="absolute top-[15%] left-0 h-[14%] animate-drift-fast"
          style={{ width: "200%", backgroundImage: "url('/clouds_2.png')", backgroundSize: "50% auto", backgroundRepeat: "repeat-x", opacity: 0.5 }}
        />
      </div>

      {/* TopNavBar — floating frosted pill */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl bg-white/70 glass-morphism rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/80 px-8 py-3.5 flex justify-between items-center transition-all hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]">
        <Link href="/" className="flex items-center gap-3 group">
          <Image src="/bloomr_icon.svg" alt="Bloomr" width={30} height={30} className="group-hover:rotate-12 transition-transform duration-500 drop-shadow-sm" />
          <span className="text-2xl text-primary-container tracking-tighter font-logo mt-0.5">Bloomr</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 font-heading font-extrabold tracking-tight text-sm">
          <a href="#how-it-works" className="text-on-surface-variant hover:text-[#39AB54] transition-colors duration-300">How it Works</a>
          <a href="#features" className="text-on-surface-variant hover:text-[#39AB54] transition-colors duration-300">Features</a>
          <a href="#pricing" className="text-on-surface-variant hover:text-[#39AB54] transition-colors duration-300">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden md:block text-sm font-bold text-on-surface-variant hover:text-[#39AB54] transition-colors px-4 py-2">Sign In</Link>
          <Link href="/signup" className="px-6 py-2.5 bg-[#39AB54] text-white rounded-full font-bold text-sm hover:bg-[#2A8040] shadow-lg shadow-[#39AB54]/20 hover:shadow-xl hover:shadow-[#39AB54]/30 hover:-translate-y-0.5 transition-all duration-300">Start Free</Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* ═══════════════════ HERO ═══════════════════ */}
        <section className="max-w-7xl mx-auto px-6 pt-36 pb-20 md:pt-44 md:pb-24 flex flex-col lg:flex-row items-center gap-16 lg:gap-12 min-h-[85vh] relative">

          {/* Left Text */}
          <div className="flex-1 w-full text-center lg:text-left z-10">
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-[#1c1c18] tracking-tighter leading-[0.95] mb-8 animate-fade-in-up">
              Learn it<br/>
              Own it<br/>
              <span className="text-transparent bg-clip-text animate-shimmer bg-[linear-gradient(110deg,#39AB54_0%,#2A8040_45%,#8FD99E_55%,#39AB54_100%)] bg-size-[200%_100%]">Grow it</span>
            </h1>

            <p className="max-w-xl mx-auto lg:mx-0 text-lg md:text-xl text-on-surface-variant mb-12 leading-relaxed font-medium animate-fade-in-up-delay-1">
              Transform lectures, PDFs, and notes into a living 3D botanical garden. The more you study, the more it grows.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up-delay-2">
              <Link href="/signup" className="group px-10 py-5 bg-[#39AB54] text-white rounded-full font-bold text-lg shadow-xl shadow-[#39AB54]/25 hover:shadow-2xl hover:shadow-[#39AB54]/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3">
                <PiPottedPlantFill className="text-2xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                Start Growing Free
                <HiArrowRight className="text-xl group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right 3D Block */}
          <div className="flex-1 w-full max-w-lg lg:max-w-[550px] h-[400px] sm:h-[500px] lg:h-[600px] relative animate-scale-in">
            <div className="absolute inset-[-60px] bg-[#C8EDCF]/20 rounded-full blur-3xl animate-blob pointer-events-none" />
            <HeroFlower />
            <div className="absolute bottom-4 right-4 lg:bottom-8 lg:right-8 bg-white/90 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-lg border border-white font-bold text-sm text-[#1c1c18] flex items-center gap-3 animate-float">
              <span className="text-2xl">🌹</span> Drag to interact
            </div>
          </div>

          {/* Grassy hill silhouette */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: "80px" }}>
            <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,60 Q180,10 360,40 Q540,70 720,30 Q900,0 1080,35 Q1260,65 1440,45 L1440,80 L0,80 Z" fill="#39AB54" />
            </svg>
          </div>
        </section>

        {/* ═══════════════════ HOW IT WORKS — The Growth Cycle ═══════════════════ */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-32">
          <div className="text-center mb-20">
            <h2 className="font-heading text-4xl lg:text-6xl font-black text-[#1c1c18] mb-5 tracking-tight">The Growth Cycle</h2>
            <p className="text-on-surface-variant text-lg font-medium max-w-lg mx-auto">
              From scattered notes to a thriving knowledge ecosystem in four natural steps.
            </p>
          </div>

          {/* Connected diagram / timeline */}
          <div className="relative">
            {/* Horizontal connecting line — desktop only */}
            <div className="hidden lg:block absolute top-[56px] left-[12%] right-[12%] h-[3px] z-0">
              <div className="w-full h-full rounded-full bg-linear-to-r from-[#C8EDCF] via-[#39AB54] to-[#F5D03B]" />
            </div>
            {/* Vertical connecting line — mobile only */}
            <div className="lg:hidden absolute top-0 bottom-0 left-[28px] w-[3px] z-0">
              <div className="w-full h-full rounded-full bg-linear-to-b from-[#C8EDCF] via-[#39AB54] to-[#F5D03B]" />
            </div>

            <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-6 relative z-10">
              {[
                { icon: PiPottedPlantFill, title: "Plant",     desc: "Upload your PDFs, YouTube links, or lecture text.", num: "01", color: "#39AB54", lgShift: "lg:-translate-y-5" },
                { icon: PiSparkle,         title: "Germinate", desc: "AI breaks down topics into digestible study units.", num: "02", color: "#F5D03B", lgShift: "lg:translate-y-5" },
                { icon: PiDropHalfBottom,  title: "Water",     desc: "Engage with quizzes and audio recaps to build memory.", num: "03", color: "#7B6CB5", lgShift: "lg:-translate-y-5" },
                { icon: PiFlower,          title: "Bloom",     desc: "Your flower reaches full bloom as you master the material.", num: "04", color: "#E8637A", lgShift: "lg:translate-y-5" },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`flex lg:flex-col items-start lg:items-center text-left lg:text-center gap-6 lg:gap-0 group ${step.lgShift}`}
                >
                  <div
                    className="w-16 h-16 lg:w-20 lg:h-20 lg:mb-8 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                    style={{ backgroundColor: `${step.color}20`, border: `3px solid ${step.color}` }}
                  >
                    <step.icon className="text-2xl lg:text-3xl" style={{ color: step.color }} />
                  </div>
                  <div>
                    <div className="text-xs font-black tracking-widest uppercase mb-1.5" style={{ color: step.color }}>{step.num}</div>
                    <h4 className="font-heading font-black text-xl lg:text-2xl text-[#1c1c18] mb-2">{step.title}</h4>
                    <p className="text-on-surface-variant text-sm font-medium leading-relaxed max-w-[240px] lg:mx-auto">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════ FEATURES ═══════════════════ */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl lg:text-6xl font-black text-[#1c1c18] mb-5 tracking-tight">What&apos;s included</h2>
            <p className="text-on-surface-variant text-lg font-medium max-w-xl mx-auto">
              Everything you need to transform messy notes into lasting knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: PiFlaskBold, title: "AI-Curated Quizzes", desc: "Auto-generated quizzes that adapt to the content you uploaded. Focus on weak spots.", color: "#39AB54" },
              { icon: PiBrainBold, title: "Smart Study Notes", desc: "AI condenses your material into structured, digestible units with key terms highlighted.", color: "#3D5EE0" },
              { icon: PiFlower, title: "Personalized Flower", desc: "Each subject grows a unique 3D flower. Watch it bloom as you master the material.", color: "#E8637A" },
              { icon: PiPaletteBold, title: "Pot Drops (Gacha)", desc: "Earn randomized collectible pots with different rarities. Customize your garden aesthetic.", color: "#F5D03B" },
              { icon: PiHeadphonesBold, title: "Audio Recaps", desc: "Listen to AI-generated audio summaries of your study units on the go.", color: "#7B6CB5" },
              { icon: PiShootingStarBold, title: "AI Tutor Chatbot", desc: "Ask Flowy anything about your material. Get instant, context-aware explanations.", color: "#D4722A" },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white border-2 border-[#e5e2db] rounded-[1.75rem] p-8 flex flex-col items-start hover:border-[#39AB54]/20 hover:shadow-lg hover:-translate-y-1 hover:rotate-1 hover:ring-2 transition-all duration-500 group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 group-hover:-translate-y-1 transition-transform duration-500" style={{ backgroundColor: `${feature.color}15` }}>
                  <feature.icon className="text-2xl" style={{ color: feature.color }} />
                </div>
                <h4 className="font-heading font-bold text-lg text-[#1c1c18] mb-2">{feature.title}</h4>
                <p className="text-on-surface-variant text-sm font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════ PRICING ═══════════════════ */}
        <PricingSection />
        <UniversityMarquee />

      </main>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="w-full relative z-10 mt-auto bg-[#39AB54]">
        {/* CTA section */}
        <div className="pt-20 pb-12">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h3 className="font-heading text-3xl lg:text-5xl font-black text-white mb-4 tracking-tight">Ready to plant your first seed?</h3>
            <p className="text-white/75 font-medium mb-10 text-lg max-w-lg mx-auto">Join thousands of students growing their knowledge gardens.</p>
            <Link href="/signup" className="inline-flex items-center gap-3 px-10 py-4 bg-white text-[#39AB54] rounded-full font-bold text-lg hover:bg-[#f7f2ea] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-lg">
              Get Started Free <PiArrowRightBold className="text-xl" />
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/15 mx-6" />

        {/* Footer links */}
        <div className="max-w-7xl mx-auto px-10 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <Image src="/bloomr_icon.svg" alt="Bloomr" width={24} height={24} className="brightness-200" />
                <span className="text-white text-xl tracking-tighter font-logo mt-0.5">Bloomr</span>
              </div>
              <p className="text-white/60 text-sm font-medium leading-relaxed">
                Transform your notes into a living, interactive garden of knowledge.
              </p>
            </div>


          </div>

          <div className="border-t border-white/15 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-white/35 font-medium">
              © 2026 Bloomr. All rights reserved.
            </p>
            <p className="text-xs text-white/35 font-medium">
              Made with <span className="text-white">♥</span> for students everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
