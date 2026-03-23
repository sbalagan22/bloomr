import Link from "next/link";
import Image from "next/image";
import { PiPottedPlantFill, PiUploadSimpleBold, PiSparkle, PiDropHalfBottom, PiFlower } from "react-icons/pi";
import { HiOutlineBolt, HiOutlineLanguage, HiOutlineEye, HiArrowRight } from "react-icons/hi2";
import { RiDoubleQuotesL } from "react-icons/ri";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 glass-morphism">
        <nav className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/bloomr_icon.png" alt="Bloomr" width={28} height={28} className="rounded-md" />
            <span className="text-2xl font-black text-primary-container tracking-tighter font-heading">Bloomr</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 font-heading font-bold tracking-tight">
            <a href="#how-it-works" className="text-on-surface-variant hover:text-primary-container transition-colors duration-300">How it Works</a>
            <a href="#how-it-helps" className="text-on-surface-variant hover:text-primary-container transition-colors duration-300">How it Helps</a>
            <Link href="/garden" className="text-on-surface-variant hover:text-primary-container transition-colors duration-300">My Garden</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-on-surface-variant hover:text-primary-container transition-colors">Sign in</Link>
            <Link href="/signup" className="px-5 py-2 gradient-cta text-white rounded-full font-bold text-sm hover:shadow-lg transition-all">Get Started</Link>
          </div>
        </nav>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-surface-container-high rounded-full">
            <PiPottedPlantFill className="text-primary-deep text-sm" />
            <span className="text-on-surface-variant font-body text-sm font-semibold tracking-wide uppercase">
              Your semester in full bloom
            </span>
          </div>

          <h1 className="font-heading text-5xl md:text-7xl font-extrabold text-on-surface tracking-tight leading-[1.1] mb-6">
            Learn it. Grow it. <span className="text-primary-deep italic font-medium">Own it.</span>
          </h1>

          <p className="max-w-2xl text-lg md:text-xl text-on-surface-variant mb-12 leading-relaxed">
            Transform lecture slides into interactive botanical journals. Master your semester while your digital garden flourishes.
          </p>

          {/* Central Upload Box */}
          <div className="w-full max-w-2xl p-12 bg-surface-container-low rounded-2xl pebble-shadow border-2 border-dashed border-outline-variant/30 hover:border-primary-deep/40 transition-all group relative overflow-hidden animate-fade-in-up-delay-1">
            <div className="absolute inset-0 bg-primary-deep/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col items-center">
              <div className="w-20 h-20 bg-surface-container-lowest rounded-xl flex items-center justify-center mb-6 pebble-shadow">
                <PiUploadSimpleBold className="text-primary-deep text-4xl" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-2 text-on-surface">Deposit your seeds</h3>
              <p className="text-on-surface-variant mb-8">
                Drag and drop your PDF/PPT or{" "}
                <Link href="/upload" className="text-primary-deep font-bold underline decoration-primary-deep/30 hover:decoration-primary-deep">
                  Select Files
                </Link>
              </p>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-surface-container-high rounded-full text-xs font-bold text-on-surface-variant flex items-center gap-2">
                  📄 PDF
                </div>
                <div className="px-4 py-2 bg-surface-container-high rounded-full text-xs font-bold text-on-surface-variant flex items-center gap-2">
                  📊 PPTX
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Helps */}
        <section id="how-it-helps" className="max-w-7xl mx-auto px-6 py-32 bg-surface-container rounded-t-[3rem]">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="font-heading text-4xl font-bold text-on-surface mb-4">Nurturing every mind.</h2>
              <p className="text-on-surface-variant">
                We believe learning isn&apos;t a one-size-fits-all process. Bloomr adapts to your unique neuro-landscape.
              </p>
            </div>
            <Link
              href="/signup"
              className="px-8 py-3 bg-primary-deep text-white rounded-full font-bold hover:shadow-lg transition-all flex items-center gap-2"
            >
              Explore Support <HiArrowRight className="text-lg" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* ESL Card */}
            <div className="asymmetric-shape-1 p-10 bg-bloom-lavender/10 flex flex-col items-start hover:scale-[1.02] transition-transform">
              <div className="w-14 h-14 bg-bloom-lavender text-white rounded-full flex items-center justify-center mb-6">
                <HiOutlineLanguage className="text-2xl" />
              </div>
              <h4 className="font-heading text-2xl font-bold text-[#342657] mb-4">ESL Flourish</h4>
              <p className="text-on-surface-variant leading-relaxed">
                Complex academic jargon simplified and translated into botanical metaphors that transcend language barriers.
              </p>
            </div>

            {/* ADHD Card */}
            <div className="bg-secondary-container/10 p-10 rounded-2xl flex flex-col items-start hover:scale-[1.02] transition-transform">
              <div className="w-14 h-14 bg-secondary-container text-white rounded-full flex items-center justify-center mb-6">
                <HiOutlineBolt className="text-2xl" />
              </div>
              <h4 className="font-heading text-2xl font-bold text-[#720427] mb-4">Focus Focus</h4>
              <p className="text-on-surface-variant leading-relaxed">
                Gamified attention loops and micro-learning pulses designed specifically for neurodivergent momentum.
              </p>
            </div>

            {/* Visual Learner Card */}
            <div className="asymmetric-shape-2 p-10 bg-bloom-tulip/10 flex flex-col items-start hover:scale-[1.02] transition-transform">
              <div className="w-14 h-14 bg-bloom-tulip text-white rounded-full flex items-center justify-center mb-6">
                <HiOutlineEye className="text-2xl" />
              </div>
              <h4 className="font-heading text-2xl font-bold text-[#400011] mb-4">Visual Rooting</h4>
              <p className="text-on-surface-variant leading-relaxed">
                Mapping concepts into visual garden layouts, helping visual thinkers branch ideas together effortlessly.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works — Growth Cycle */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center mb-20">
            <h2 className="font-heading text-4xl font-bold text-on-surface mb-4">The Growth Cycle</h2>
            <p className="text-on-surface-variant max-w-lg mx-auto">
              From scattered notes to a thriving knowledge ecosystem in four natural steps.
            </p>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-outline-variant/20 -z-10" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                { icon: PiPottedPlantFill, title: "1. Upload (Seed)", desc: "Plant your lecture slides or textbook chapters into our secure portal." },
                { icon: PiSparkle, title: "2. Germination", desc: "Our AI breaks down complex topics into digestible, nutrient-rich concepts." },
                { icon: PiDropHalfBottom, title: "3. Watering", desc: "Engage with interactive quizzes and flashcards to nourish your memory." },
                { icon: PiFlower, title: "4. Mastery (Bloom)", desc: "Watch your digital flora grow as your exam scores hit full bloom." },
              ].map((step) => (
                <div key={step.title} className="flex flex-col items-center text-center group">
                  <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-primary-deep/20 flex items-center justify-center mb-6 group-hover:bg-primary-deep group-hover:border-primary-deep transition-all">
                    <step.icon className="text-2xl text-primary-deep group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="font-heading font-bold text-xl mb-2">{step.title}</h4>
                  <p className="text-on-surface-variant text-sm px-4">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="max-w-7xl mx-auto px-6 py-32">
          <div className="bg-surface-container-lowest pebble-shadow rounded-2xl overflow-hidden flex flex-col lg:flex-row">
            <div className="lg:w-1/2 p-12 lg:p-20 bg-surface-container-high/50">
              <RiDoubleQuotesL className="text-primary-deep text-5xl mb-8" />
              <h3 className="font-heading text-3xl font-bold text-on-surface mb-8 leading-tight italic">
                &ldquo;Bloomr didn&apos;t just help me pass Organic Chem; it made me actually enjoy the structure of it. It feels like I&apos;m curating a library that breathes.&rdquo;
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-outline-variant flex items-center justify-center text-white font-bold">ES</div>
                <div>
                  <p className="font-bold text-on-surface">Elena S.</p>
                  <p className="text-sm text-on-surface-variant">Biology Major, Stanford</p>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 relative min-h-[400px] bg-primary-deep/10 flex items-center justify-center">
              <div className="text-center p-12">
                <PiFlower className="text-8xl text-primary-deep/40 mx-auto mb-4" />
                <p className="text-on-surface-variant font-heading font-semibold">Your garden grows with every concept mastered</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-6 py-20 pb-40">
          <div className="gradient-cta text-white rounded-[2rem] p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-fixed-dim/20 rounded-full -ml-32 -mb-32 blur-3xl" />
            <h2 className="font-heading text-4xl md:text-6xl font-extrabold mb-8 relative z-10">Start your garden today.</h2>
            <p className="text-primary-fixed text-lg md:text-xl mb-12 max-w-2xl mx-auto opacity-90 relative z-10">
              Join over 15,000 learners who have turned their study stress into botanical mastery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link href="/signup" className="px-10 py-5 bg-white text-primary-deep rounded-full font-black text-lg hover:scale-105 transition-transform pebble-shadow">
                Plant your first seed
              </Link>
              <Link href="/garden" className="px-10 py-5 bg-primary-container text-white rounded-full font-bold text-lg hover:bg-primary-container/90 transition-all border border-white/20">
                View Demo Garden
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full rounded-t-[3rem] mt-20 bg-surface-container-low">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-12 w-full gap-6 max-w-7xl mx-auto">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <Image src="/bloomr_icon.png" alt="Bloomr" width={24} height={24} className="rounded-md" />
              <span className="font-bold text-primary-container text-2xl font-heading tracking-tighter">Bloomr</span>
            </div>
            <p className="text-sm text-on-surface-variant">© 2026 Bloomr. Cultivating clarity.</p>
          </div>
          <div className="flex gap-8">
            <a className="text-sm text-on-surface-variant hover:text-primary-container transition-all" href="#">Privacy</a>
            <a className="text-sm text-on-surface-variant hover:text-primary-container transition-all" href="#">Terms</a>
            <a className="text-sm text-on-surface-variant hover:text-primary-container transition-all" href="#">Contact</a>
            <a className="text-sm text-on-surface-variant hover:text-primary-container transition-all" href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
