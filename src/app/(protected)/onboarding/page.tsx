"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "Hindi",
  "Mandarin",
  "Arabic",
  "Other",
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState("English");
  const [isEsl, setIsEsl] = useState(false);
  const [isVisual, setIsVisual] = useState(false);
  const [learningStyle, setLearningStyle] = useState<"ADHD" | "dyslexia" | "none">("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalSteps = 2;
  const progressPercent = ((step + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
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

      // Save learner profile
      const { error: profileError } = await supabase
        .from("learner_profiles")
        .upsert(
          {
            user_id: user.id,
            primary_language: language,
            learning_style: learningStyle,
            preferences_json: {
              is_esl: isEsl,
              is_visual_learner: isVisual,
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

      // Create garden for user (ignore if already exists)
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

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      {/* Progress bar */}
      <div className="w-full px-6 pt-8 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-bark">
              Step {step + 1} of {totalSteps}
            </span>
            <span className="text-sm text-bark">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="w-full h-2 bg-cream rounded-full overflow-hidden border border-stone">
            <div
              className="h-full bg-primary-green rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-full max-w-lg">
          {/* Step 0: Language & ESL */}
          {step === 0 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <span className="text-4xl mb-4 block">🌍</span>
                <h1 className="text-2xl sm:text-3xl font-bold text-soil font-heading mb-2">
                  Language Profile
                </h1>
                <p className="text-bark text-base">
                  Tell us about your language background so we can adapt the vocabulary.
                </p>
              </div>

              <div className="bg-cream rounded-2xl border border-stone p-6 space-y-6">
                <div>
                  <Label className="text-soil font-medium mb-3 block">
                    Primary language
                  </Label>
                  <Select value={language} onValueChange={(val) => setLanguage(val ?? "English")}>
                    <SelectTrigger className="w-full h-12 rounded-xl bg-parchment border-stone text-soil text-base">
                      <SelectValue placeholder="Select your language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start gap-3 p-4 border border-stone rounded-xl bg-parchment/50">
                  <input
                    type="checkbox"
                    id="esl"
                    checked={isEsl}
                    onChange={(e) => setIsEsl(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-stone text-primary-green focus:ring-primary-green-muted"
                  />
                  <div>
                    <Label htmlFor="esl" className="font-semibold text-soil text-base cursor-pointer">
                      I am an ESL Learner
                    </Label>
                    <p className="text-sm text-bark mt-1">
                      We will simplify language, reduce complexity, and avoid idioms in generated content.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Learning Preferences */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <span className="text-4xl mb-4 block">🧠</span>
                <h1 className="text-2xl sm:text-3xl font-bold text-soil font-heading mb-2">
                  Learning Preferences
                </h1>
                <p className="text-bark text-base">
                  Customize how your study materials are presented.
                </p>
              </div>

              <div className="space-y-4">
                <div onClick={() => setIsVisual(!isVisual)} className={`cursor-pointer p-5 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 ${isVisual ? "border-primary-green bg-primary-green-muted/40" : "border-stone bg-cream hover:border-primary-green/50"}`}>
                  <span className="text-3xl shrink-0">🎨</span>
                  <div>
                    <span className="text-soil font-semibold block text-base">Visual Learner</span>
                    <span className="text-bark text-sm mt-1 block">Increases emphasis on Mermaid diagrams and visual aids in all content.</span>
                  </div>
                </div>

                <div className="pt-4 pb-2">
                  <Label className="text-soil font-medium mb-3 block">Special Accommodations</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setLearningStyle("none")}
                      className={`text-center p-4 rounded-xl border-2 transition-all duration-200 ${learningStyle === "none" ? "border-primary-green bg-primary-green-muted/40" : "border-stone bg-cream hover:border-primary-green/50"}`}
                    >
                      <span className="block text-2xl mb-1">📚</span>
                      <span className="text-sm font-semibold text-soil">Standard</span>
                    </button>
                    <button
                      onClick={() => setLearningStyle("ADHD")}
                      className={`text-center p-4 rounded-xl border-2 transition-all duration-200 ${learningStyle === "ADHD" ? "border-primary-green bg-primary-green-muted/40" : "border-stone bg-cream hover:border-primary-green/50"}`}
                    >
                      <span className="block text-2xl mb-1">⚡</span>
                      <span className="text-sm font-semibold text-soil">ADHD</span>
                    </button>
                    <button
                      onClick={() => setLearningStyle("dyslexia")}
                      className={`text-center p-4 rounded-xl border-2 transition-all duration-200 ${learningStyle === "dyslexia" ? "border-primary-green bg-primary-green-muted/40" : "border-stone bg-cream hover:border-primary-green/50"}`}
                    >
                      <span className="block text-2xl mb-1">📖</span>
                      <span className="text-sm font-semibold text-soil">Dyslexia</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 gap-4">
            {step > 0 ? (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="rounded-full h-12 px-6 border-stone text-soil hover:bg-cream"
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="rounded-full h-12 px-8 bg-primary-green text-white hover:bg-primary-green-dark disabled:opacity-40 font-semibold text-base shadow-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Setting up...
                </span>
              ) : step === totalSteps - 1 ? (
                "Finish & enter garden"
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
