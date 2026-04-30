"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PiArrowRightBold, PiArrowLeftBold, PiCheckBold, PiSparkle, PiSealCheckFill, PiPlantBold, PiInfinityBold } from "react-icons/pi";

/* ─── Data ─────────────────────────────────────────── */
const SUBJECTS = [
  "Mathematics", "Biology", "Chemistry", "Physics", "Computer Science",
  "History", "Geography", "Economics", "Literature", "Philosophy",
  "Psychology", "Sociology", "Political Science", "Art History", "Music Theory",
  "Law", "Medicine", "Nursing", "Engineering", "Business Administration",
  "Accounting", "Marketing", "Finance", "Project Management",
  "Spanish", "French", "German", "Mandarin", "Japanese", "Korean",
  "SAT Prep", "GRE Prep", "MCAT Prep", "LSAT Prep", "Other"
];

const STUDY_GOALS = [
  { id: "ace_exams", icon: "🏆", label: "Ace Exams", sub: "Nail grades and standardised tests" },
  { id: "deep_understanding", icon: "🧠", label: "Understand Deeply", sub: "Go beyond surface-level memorisation" },
  { id: "stay_organised", icon: "🗂️", label: "Stay Organised", sub: "Keep notes structured and searchable" },
  { id: "explore", icon: "🌍", label: "Explore & Discover", sub: "Study for the joy of learning" },
];

const STUDY_FREQ = [
  { id: "daily", icon: "🔥", label: "Every day" },
  { id: "few_week", icon: "📅", label: "A few times a week" },
  { id: "weekends", icon: "🌤️", label: "Weekends only" },
  { id: "rarely", icon: "🦉", label: "When I need to" },
];

const EDU_LEVELS = [
  { id: "K-12", icon: "📖", subtitle: "Middle & High School", color: "#F4A44E" },
  { id: "University", icon: "🎓", subtitle: "Undergraduate", color: "#39AB54" },
  { id: "Post-Graduate", icon: "📑", subtitle: "Masters, PhD, MD", color: "#7B6CB5" },
  { id: "Self-Taught", icon: "🧭", subtitle: "Professional / Lifelong", color: "#3D5EE0" },
];

const CHALLENGES = [
  { id: "memory", icon: "💭", label: "Remembering things" },
  { id: "focus", icon: "🎯", label: "Staying focused" },
  { id: "time", icon: "⏰", label: "Finding enough time" },
  { id: "test_anxiety", icon: "😰", label: "Test anxiety" },
];

const STUDY_TIMES = [
  { id: "morning", icon: "🌅", label: "Morning" },
  { id: "afternoon", icon: "☀️", label: "Afternoon" },
  { id: "evening", icon: "🌆", label: "Evening" },
  { id: "late_night", icon: "🌙", label: "Late night" },
];

const TOTAL_STEPS = 6; // 6 questions before upgrade screen

/* ─── Progress dots ─────────────────────────────────── */
function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-500 ${
            i < step ? "w-4 h-2 bg-[#39AB54]" :
            i === step ? "w-6 h-2 bg-[#39AB54] shadow-[0_0_8px_rgba(57,171,84,0.6)]" :
            "w-2 h-2 bg-[#e5e2db]"
          }`}
        />
      ))}
    </div>
  );
}

/* ─── Option Button ─────────────────────────────────── */
function OptionButton({
  selected, onClick, children, color = "#39AB54", className = ""
}: {
  selected: boolean; onClick: () => void; children: React.ReactNode; color?: string; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative p-5 rounded-[1.5rem] border-2 transition-all duration-300 text-left group ${className}`}
      style={{
        borderColor: selected ? color : "#e5e2db",
        backgroundColor: selected ? `${color}12` : "white",
        boxShadow: selected ? `0 8px 30px ${color}20` : "0 2px 8px rgba(0,0,0,0.04)",
        transform: selected ? "scale(1.02) translateY(-2px)" : "scale(1)",
      }}
    >
      {selected && (
        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
          <PiCheckBold className="text-white text-[10px]" />
        </div>
      )}
      {children}
    </button>
  );
}

/* ─── Main onboarding content ────────────────────────── */
function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/garden";

  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Answers
  const [subjects, setSubjects] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [freq, setFreq] = useState("");
  const [eduLevel, setEduLevel] = useState("");
  const [challenge, setChallenge] = useState("");
  const [studyTime, setStudyTime] = useState("");

  useEffect(() => { 
    setMounted(true);
    async function checkProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("learner_profiles").select("id").eq("user_id", user.id).single();
        if (profile) {
          router.push("/garden");
        }
      }
    }
    checkProfile();
  }, [router]);

  const toggleSubject = (s: string) =>
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const canAdvance = () => {
    if (step === 0) return subjects.length > 0;
    if (step === 1) return !!goal;
    if (step === 2) return !!freq;
    if (step === 3) return !!eduLevel;
    if (step === 4) return !!challenge;
    if (step === 5) return !!studyTime;
    return true;
  };

  const handleNext = () => {
    if (!canAdvance()) {
      setError("Please make a selection to continue.");
      return;
    }
    setError("");
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
    else finishOnboarding();
  };

  const handleBack = () => {
    setError("");
    if (step > 0) setStep(s => s - 1);
  };

  const finishOnboarding = async (skipUpgrade = false) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Must be signed in."); setIsSubmitting(false); return; }

      await supabase.from("learner_profiles").upsert({
        user_id: user.id,
        primary_language: "English",
        learning_style: studyTime,
        preferences_json: {
          focus_subjects: subjects,
          education_level: eduLevel,
          study_goal: goal,
          study_frequency: freq,
          biggest_challenge: challenge,
          preferred_study_time: studyTime,
        },
      }, { onConflict: "user_id" });

      await supabase.from("gardens").upsert({ user_id: user.id }, { onConflict: "user_id" });

      if (!skipUpgrade) {
        // Show upgrade screen (step 6)
        setStep(6);
        setIsSubmitting(false);
        return;
      }

      // Redirect to upload
      router.push("/upload");
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleUpgradeCheckout = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.status === 401) { window.location.href = "/signup?redirect=/upgrade"; return; }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setIsSubmitting(false);
    } catch { setIsSubmitting(false); }
  };

  const skipToGarden = () => {
    router.push("/upload");
  };

  if (!mounted) return null;

  const STEP_LABELS = [
    "What are you studying?",
    "What's your main goal?",
    "How often do you study?",
    "Your education level?",
    "Biggest challenge?",
    "When do you study best?",
  ];

  /* ── Upgrade screen (step 6) ── */
  if (step === 6) {
    return (
      <div className="min-h-screen bg-[#1A2318] flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(57,171,84,0.20) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(92,200,115,0.10) 0%, transparent 70%)" }} />

        <div className="relative z-10 w-full max-w-lg text-center animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#39AB54]/20 text-[#5CC873] rounded-full px-4 py-1.5 text-xs font-bold font-mono mb-6 border border-[#39AB54]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5CC873] animate-pulse" /> Exclusive offer for new growers
          </div>

          <h1 className="font-heading text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            Your garden is ready.<br />
            <span className="text-[#5CC873]">Grow without limits.</span>
          </h1>
          <p className="text-white/60 text-base mb-10 max-w-sm mx-auto">
            Upgrade to <span className="text-white font-bold">Bloomr Pro</span> and unlock unlimited flowers, audio lessons, PDF exports, and priority AI tutoring.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {[
              { icon: <PiInfinityBold />, label: "Unlimited flowers" },
              { icon: "🔊", label: "Audio lessons" },
              { icon: "📄", label: "PDF export" },
              { icon: "⚡", label: "Priority AI tutor" },
              { icon: "🏆", label: "Mastery tests" },
            ].map(f => (
              <span key={typeof f.label === "string" ? f.label : "f"} className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3.5 py-1.5 rounded-full border border-white/10">
                <span className="text-[#5CC873]">{f.icon}</span> {f.label}
              </span>
            ))}
          </div>

          {/* Pricing card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-3xl p-8 mb-6">
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-5xl font-black text-white">$5.99</span>
              <span className="text-white/50 text-lg">/mo</span>
            </div>
            <p className="text-white/50 text-sm mb-6">Cancel anytime · No hidden fees</p>
            <button
              onClick={handleUpgradeCheckout}
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl bg-[#39AB54] hover:bg-[#2A8040] disabled:opacity-50 text-white font-bold text-lg shadow-[0_8px_32px_rgba(57,171,84,0.5)] hover:shadow-[0_12px_40px_rgba(57,171,84,0.6)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Redirecting...
                </span>
              ) : (
                <><PiSealCheckFill className="text-xl" /> Start Pro — $5.99/month</>
              )}
            </button>
          </div>

          {/* Skip / first plant CTA */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={skipToGarden}
              className="text-white/40 hover:text-white/70 text-sm transition-colors underline underline-offset-4"
            >
              No thanks, continue free
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Steps 0–6 ── */
  return (
    <div className="min-h-screen bg-parchment flex flex-col relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-[#C8EDCF]/40 animate-blob opacity-50" />
        <div className="absolute bottom-0 -left-32 w-[500px] h-[500px] bg-[#F5D03B]/15 animate-blob opacity-40" style={{ animationDelay: "7s" }} />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-[#7B6CB5]/8 animate-blob opacity-30" style={{ animationDelay: "3s" }} />
      </div>

      {/* Top bar */}
      <div className="w-full px-6 pt-8 pb-4 z-10 relative">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <Image src="/bloomr_icon.svg" alt="Bloomr" width={28} height={28} style={{ width: 28, height: "auto" }} />
            <span className="text-xl text-primary-container tracking-tighter font-logo mt-0.5">Bloomr</span>
          </div>
          <StepDots step={step} total={TOTAL_STEPS} />
          <p className="text-center text-[11px] font-mono text-[#6B4C35]/60 mt-1.5">
            Question {step + 1} of {TOTAL_STEPS}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 z-10 relative">
        <div className="w-full max-w-2xl">

          {/* Step header */}
          <div key={`h-${step}`} className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl font-black text-[#1c1c18] font-heading mb-2 tracking-tight">
              {STEP_LABELS[step]}
            </h1>
          </div>

          {/* ── Step 0: Subjects ── */}
          {step === 0 && (
            <div className="animate-fade-in-up">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {SUBJECTS.map(s => {
                  const sel = subjects.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSubject(s)}
                      className="relative p-4 rounded-[1.25rem] border-2 transition-all duration-300 flex items-center justify-center text-center group"
                      style={{
                        borderColor: sel ? "#39AB54" : "#e5e2db",
                        backgroundColor: sel ? "#39AB5412" : "white",
                        boxShadow: sel ? `0 4px 20px #39AB5420` : "0 2px 8px rgba(0,0,0,0.04)",
                        transform: sel ? "scale(1.02) translateY(-1px)" : "scale(1)",
                      }}
                    >
                      {sel && <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center bg-[#39AB54]"><PiCheckBold className="text-white text-[8px]" /></div>}
                      <span className="font-bold text-xs" style={{ color: sel ? "#39AB54" : "#1c1c18" }}>{s}</span>
                    </button>
                  );
                })}
              </div>
              {subjects.length > 0 && <p className="text-center text-sm font-bold text-[#39AB54] mt-4">{subjects.length} selected</p>}
            </div>
          )}

          {/* ── Step 1: Study goal ── */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
              {STUDY_GOALS.map(g => (
                <OptionButton key={g.id} selected={goal === g.id} onClick={() => setGoal(g.id)}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{g.icon}</span>
                    <div>
                      <div className="font-bold text-[#1c1c18] text-sm">{g.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{g.sub}</div>
                    </div>
                  </div>
                </OptionButton>
              ))}
            </div>
          )}

          {/* ── Step 2: Study frequency ── */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto animate-fade-in-up">
              {STUDY_FREQ.map(f => (
                <OptionButton key={f.id} selected={freq === f.id} onClick={() => setFreq(f.id)}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{f.icon}</span>
                    <span className="font-bold text-[#1c1c18] text-sm">{f.label}</span>
                  </div>
                </OptionButton>
              ))}
            </div>
          )}

          {/* ── Step 3: Education level ── */}
          {step === 3 && (
            <div className="flex flex-col gap-4 max-w-lg mx-auto animate-fade-in-up">
              {EDU_LEVELS.map(l => (
                <OptionButton key={l.id} selected={eduLevel === l.id} onClick={() => setEduLevel(l.id)} color={l.color}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: `${l.color}18` }}>{l.icon}</div>
                    <div>
                      <div className="font-bold text-base" style={{ color: eduLevel === l.id ? l.color : "#1c1c18" }}>{l.id}</div>
                      <div className="text-xs text-gray-400">{l.subtitle}</div>
                    </div>
                  </div>
                </OptionButton>
              ))}
            </div>
          )}

          {/* ── Step 4: Biggest challenge ── */}
          {step === 4 && (
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto animate-fade-in-up">
              {CHALLENGES.map(c => (
                <OptionButton key={c.id} selected={challenge === c.id} onClick={() => setChallenge(c.id)}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.icon}</span>
                    <span className="font-bold text-sm text-[#1c1c18]">{c.label}</span>
                  </div>
                </OptionButton>
              ))}
            </div>
          )}

          {/* ── Step 5: Preferred study time ── */}
          {step === 5 && (
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto animate-fade-in-up">
              {STUDY_TIMES.map(t => (
                <OptionButton key={t.id} selected={studyTime === t.id} onClick={() => setStudyTime(t.id)}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.icon}</span>
                    <span className="font-bold text-sm text-[#1c1c18]">{t.label}</span>
                  </div>
                </OptionButton>
              ))}
            </div>
          )}

          {/* Steps 0–5 logic remains same */}

          {/* Error */}
          {error && (
            <div className="mt-5 p-3 rounded-xl bg-[#E8637A]/10 border border-[#E8637A]/20 text-[#CC2A1A] text-sm text-center font-bold animate-fade-in max-w-lg mx-auto">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 gap-4 max-w-lg mx-auto">
            {step > 0 ? (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="h-12 px-6 rounded-full border-2 border-[#e5e2db] text-[#1c1c18] hover:bg-[#f1eee7] font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
              >
                <PiArrowLeftBold /> Back
              </button>
            ) : <div />}

            <button
              onClick={handleNext}
              disabled={isSubmitting || !canAdvance()}
              className="h-12 px-8 rounded-full bg-[#39AB54] text-white hover:bg-[#2A8040] disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sm shadow-xl shadow-[#39AB54]/20 hover:shadow-2xl hover:shadow-[#39AB54]/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Saving...
                </span>
              ) : step === 5 ? (
                <>Plant my garden <PiSparkle /></>
              ) : (
                <>Continue <PiArrowRightBold /></>
              )}
            </button>
          </div>


        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
