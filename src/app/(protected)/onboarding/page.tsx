"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PiSparkle, PiMapPinBold, PiGraduationCapBold, PiArrowRightBold, PiArrowLeftBold, PiCheckBold } from "react-icons/pi";

const SUBJECTS = [
  { id: "Biology", icon: "🌿", color: "#39AB54" },
  { id: "Chemistry", icon: "⚗️", color: "#F4A44E" },
  { id: "Physics", icon: "🔭", color: "#3D5EE0" },
  { id: "Mathematics", icon: "∑", color: "#E8637A" },
  { id: "Computer Science", icon: "⌨️", color: "#7B6CB5" },
  { id: "History", icon: "📜", color: "#D4722A" },
  { id: "Languages", icon: "Aa", color: "#2A8040" },
  { id: "Medicine", icon: "🔬", color: "#CC2A1A" },
  { id: "Other", icon: "◆", color: "#F5D03B" },
];

const REGIONS = [
  { id: "North America", icon: "🌎" },
  { id: "Europe", icon: "🌍" },
  { id: "Asia", icon: "🌏" },
  { id: "Oceania", icon: "🌏" },
  { id: "South America", icon: "🌎" },
  { id: "Africa", icon: "🌍" },
];

const EDU_LEVELS = [
  { id: "K-12", icon: "📖", subtitle: "Middle & High School", color: "#F4A44E" },
  { id: "University", icon: "🎓", subtitle: "Undergraduate", color: "#39AB54" },
  { id: "Post-Graduate", icon: "📑", subtitle: "Masters, PhD, MD", color: "#7B6CB5" },
  { id: "Self-Taught", icon: "🧭", subtitle: "Professional / Lifelong", color: "#3D5EE0" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  const [focusSubjects, setFocusSubjects] = useState<string[]>([]);
  const [location, setLocation] = useState<string>("");
  const [eduLevel, setEduLevel] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");

  const totalSteps = 3;
  const progressPercent = ((step + 1) / totalSteps) * 100;

  useEffect(() => { setMounted(true); }, []);

  const handleNext = () => {
    if (step === 0 && focusSubjects.length === 0) {
      setError("Pick at least one subject!");
      return;
    }
    if (step === 1 && !location) {
      setError("Select your region!");
      return;
    }
    setError("");
    setSlideDir("left");
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setError("");
    setSlideDir("right");
    if (step > 0) setStep(step - 1);
  };

  const toggleSubject = (subject: string) => {
    if (focusSubjects.includes(subject)) {
      setFocusSubjects(focusSubjects.filter(s => s !== subject));
    } else {
      setFocusSubjects([...focusSubjects, subject]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be signed in to continue.");
        setIsSubmitting(false);
        return;
      }

      const { error: profileError } = await supabase
        .from("learner_profiles")
        .upsert(
          {
            user_id: user.id,
            primary_language: "English",
            learning_style: "none",
            preferences_json: {
              focus_subjects: focusSubjects,
              location,
              education_level: eduLevel,
            },
          },
          { onConflict: "user_id" }
        );

      if (profileError) {
        console.error("Profile save error:", profileError);
        setError("Failed to save your profile. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const { error: gardenError } = await supabase
        .from("gardens")
        .upsert(
          { user_id: user.id },
          { onConflict: "user_id" }
        );

      if (gardenError) console.error("Garden creation error:", gardenError);

      router.push("/garden");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const STEP_META = [
    { emoji: "🌱", title: "What are you studying?", subtitle: "Pick all the subjects you want to grow." },
    { emoji: "🗺️", title: "Where are you based?", subtitle: "We tailor exam language to your region." },
    { emoji: "📚", title: "Your education level?", subtitle: "This calibrates your AI tutor's depth." },
  ];

  const currentMeta = STEP_META[step];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-parchment flex flex-col relative overflow-hidden">
      {/* Ambient animated background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-[#C8EDCF]/40 animate-blob opacity-50" />
        <div className="absolute bottom-0 -left-32 w-[500px] h-[500px] bg-[#F5D03B]/15 animate-blob opacity-40" style={{ animationDelay: "7s" }} />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-[#7B6CB5]/8 animate-blob opacity-30" style={{ animationDelay: "3s" }} />
      </div>

      {/* Top bar with logo + progress */}
      <div className="w-full px-6 pt-8 pb-4 z-10 relative">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <Image src="/bloomr_icon.svg" alt="Bloomr" width={28} height={28} className="drop-shadow-sm" />
            <span className="text-xl text-primary-container tracking-tighter font-logo mt-0.5">Bloomr</span>
          </div>
          
          {/* Step pills */}
          <div className="flex items-center gap-3 justify-center mb-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${
                  i < step ? "bg-[#39AB54] text-white scale-90 shadow-lg shadow-[#39AB54]/20" :
                  i === step ? "bg-[#39AB54] text-white scale-110 shadow-xl shadow-[#39AB54]/30 animate-glow-pulse" :
                  "bg-[#e5e2db] text-on-surface-variant"
                }`}>
                  {i < step ? <PiCheckBold /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`w-16 sm:w-24 h-1 rounded-full transition-all duration-700 ${
                    i < step ? "bg-[#39AB54]" : "bg-[#e5e2db]"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 z-10 relative">
        <div className="w-full max-w-2xl">
          
          {/* Step header — Always visible with animation on change */}
          <div key={`header-${step}`} className={`text-center mb-10 ${slideDir === "left" ? "animate-fade-in-up" : "animate-fade-in-up"}`}>
            <div className="w-20 h-20 bg-white border-2 border-[#e5e2db] shadow-lg rounded-[1.5rem] flex items-center justify-center text-4xl mx-auto mb-6 transform hover:rotate-12 transition-transform duration-500 animate-float">
              {currentMeta.emoji}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1c1c18] font-heading mb-3 tracking-tight">
              {currentMeta.title}
            </h1>
            <p className="text-on-surface-variant text-base sm:text-lg font-medium max-w-md mx-auto">
              {currentMeta.subtitle}
            </p>
          </div>

          {/* Step 0: Subjects — Grid of colorful bouncy tiles */}
          {step === 0 && (
            <div key="step-0" className="animate-fade-in-up">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {SUBJECTS.map((subject, idx) => {
                  const isSelected = focusSubjects.includes(subject.id);
                  return (
                    <button
                      key={subject.id}
                      onClick={() => toggleSubject(subject.id)}
                      className={`relative p-5 sm:p-6 rounded-[1.5rem] border-2 transition-all duration-300 flex flex-col items-center text-center gap-3 group opacity-0 animate-fade-in-up overflow-hidden stagger-${idx + 1}`}
                      style={{
                        borderColor: isSelected ? subject.color : "#e5e2db",
                        backgroundColor: isSelected ? `${subject.color}12` : "white",
                        boxShadow: isSelected ? `0 8px 30px ${subject.color}20` : "0 2px 8px rgba(0,0,0,0.04)",
                        transform: isSelected ? "scale(1.02) translateY(-2px)" : "scale(1)",
                      }}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center animate-scale-in" style={{ backgroundColor: subject.color }}>
                          <PiCheckBold className="text-white text-xs" />
                        </div>
                      )}
                      <span className={`text-4xl sm:text-5xl transition-transform duration-300 ${isSelected ? "scale-110" : "group-hover:scale-110"}`}>{subject.icon}</span>
                      <span className={`font-bold text-xs sm:text-sm transition-colors ${isSelected ? "" : "text-[#1c1c18]"}`} style={{ color: isSelected ? subject.color : undefined }}>{subject.id}</span>
                    </button>
                  );
                })}
              </div>
              {focusSubjects.length > 0 && (
                <div className="mt-6 text-center animate-fade-in">
                  <span className="text-sm font-bold text-[#39AB54]">{focusSubjects.length} selected</span>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Location — Clean single-select list */}
          {step === 1 && (
            <div key="step-1" className="animate-fade-in-up">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-lg mx-auto">
                {REGIONS.map((loc, idx) => (
                  <button
                    key={loc.id}
                    onClick={() => setLocation(loc.id)}
                    className={`p-5 rounded-[1.5rem] border-2 transition-all duration-300 flex items-center gap-4 group opacity-0 animate-fade-in-up stagger-${idx + 1}`}
                    style={{
                      borderColor: location === loc.id ? "#39AB54" : "#e5e2db",
                      backgroundColor: location === loc.id ? "#39AB5412" : "white",
                      boxShadow: location === loc.id ? "0 8px 30px rgba(57,171,84,0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
                      transform: location === loc.id ? "scale(1.02)" : "scale(1)",
                    }}
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{loc.icon}</span>
                    <div className="text-left">
                      <span className={`font-bold block text-sm ${location === loc.id ? "text-[#39AB54]" : "text-[#1c1c18]"}`}>{loc.id}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Education Level — Beautiful cards with color accents */}
          {step === 2 && (
            <div key="step-2" className="animate-fade-in-up">
              <div className="flex flex-col gap-4 max-w-lg mx-auto">
                {EDU_LEVELS.map((lvl, idx) => (
                  <button
                    key={lvl.id}
                    onClick={() => setEduLevel(lvl.id)}
                    className={`p-6 rounded-[1.5rem] border-2 transition-all duration-300 flex items-center gap-5 group opacity-0 animate-fade-in-up stagger-${idx + 1} text-left`}
                    style={{
                      borderColor: eduLevel === lvl.id ? lvl.color : "#e5e2db",
                      backgroundColor: eduLevel === lvl.id ? `${lvl.color}12` : "white",
                      boxShadow: eduLevel === lvl.id ? `0 8px 30px ${lvl.color}20` : "0 2px 8px rgba(0,0,0,0.04)",
                      transform: eduLevel === lvl.id ? "scale(1.02)" : "scale(1)",
                    }}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`} style={{ backgroundColor: `${lvl.color}15` }}>
                      {lvl.icon}
                    </div>
                    <div className="flex-1">
                      <span className={`font-bold block text-lg ${eduLevel === lvl.id ? "" : "text-[#1c1c18]"}`} style={{ color: eduLevel === lvl.id ? lvl.color : undefined }}>{lvl.id}</span>
                      <span className="text-on-surface-variant text-sm font-medium block mt-0.5">{lvl.subtitle}</span>
                    </div>
                    {eduLevel === lvl.id && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center animate-scale-in" style={{ backgroundColor: lvl.color }}>
                        <PiCheckBold className="text-white text-sm" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-6 p-4 rounded-2xl bg-[#E8637A]/10 border border-[#E8637A]/20 text-[#CC2A1A] text-sm text-center font-bold animate-fade-in max-w-lg mx-auto">
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-12 gap-4 max-w-lg mx-auto">
            {step > 0 ? (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="rounded-full h-14 px-8 border-2 border-[#e5e2db] text-[#1c1c18] hover:bg-[#f1eee7] font-bold text-base transition-all shadow-sm gap-2"
              >
                <PiArrowLeftBold /> Back
              </Button>
            ) : (
              <div />
            )}

            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="rounded-full h-14 px-10 bg-[#39AB54] text-white hover:bg-[#2A8040] disabled:opacity-40 font-bold text-base shadow-xl shadow-[#39AB54]/20 hover:shadow-2xl hover:shadow-[#39AB54]/30 hover:-translate-y-0.5 transition-all gap-2"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Planting...
                </span>
              ) : step === totalSteps - 1 ? (
                <>Enter your garden <PiSparkle className="text-lg" /></>
              ) : (
                <>Continue <PiArrowRightBold /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
