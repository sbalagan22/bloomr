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

const LEARNING_STYLES = [
  {
    value: "ADHD",
    label: "ADHD-friendly",
    description: "Bite-sized chunks, frequent check-ins",
    icon: "🧠",
  },
  {
    value: "dyslexia",
    label: "Dyslexia-friendly",
    description: "Clear fonts, simplified layouts",
    icon: "📖",
  },
  {
    value: "none",
    label: "No preference",
    description: "Standard learning experience",
    icon: "📚",
  },
  {
    value: "prefer_not_to_say",
    label: "Prefer not to say",
    description: "We'll use default settings",
    icon: "🤫",
  },
] as const;

const CONTENT_STYLES = [
  {
    value: "visual",
    label: "Visual learner",
    description: "Diagrams, charts, and imagery",
    icon: "🎨",
  },
  {
    value: "audio",
    label: "Audio learner",
    description: "Listen to explanations and summaries",
    icon: "🎧",
  },
  {
    value: "text",
    label: "Text-focused",
    description: "Detailed written explanations",
    icon: "📝",
  },
] as const;

type LearningStyle = (typeof LEARNING_STYLES)[number]["value"];
type ContentStyle = (typeof CONTENT_STYLES)[number]["value"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState("");
  const [learningStyle, setLearningStyle] = useState<LearningStyle | "">("");
  const [contentStyle, setContentStyle] = useState<ContentStyle | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalSteps = 3;
  const progressPercent = ((step + 1) / totalSteps) * 100;

  const canProceed = () => {
    if (step === 0) return language !== "";
    if (step === 1) return learningStyle !== "";
    if (step === 2) return contentStyle !== "";
    return false;
  };

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
              content_style: contentStyle,
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
          {
            user_id: user.id,
          },
          { onConflict: "user_id" }
        );

      if (gardenError) {
        console.error("Garden creation error:", gardenError);
        // Non-blocking: garden can be created later
      }

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
          {/* Step 0: Language */}
          {step === 0 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <span className="text-4xl mb-4 block">🌍</span>
                <h1 className="text-2xl sm:text-3xl font-bold text-soil font-(family-name:--font-display) mb-2">
                  What&rsquo;s your primary language?
                </h1>
                <p className="text-bark text-base">
                  We&rsquo;ll tailor your study materials to be clearer and more
                  accessible.
                </p>
              </div>

              <div className="bg-cream rounded-2xl border border-stone p-6">
                <Label
                  htmlFor="language-select"
                  className="text-soil font-medium mb-3 block"
                >
                  Primary language
                </Label>
                <Select value={language} onValueChange={(val) => setLanguage(val ?? "")}>
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
            </div>
          )}

          {/* Step 1: Learning style */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <span className="text-4xl mb-4 block">🌱</span>
                <h1 className="text-2xl sm:text-3xl font-bold text-soil font-(family-name:--font-display) mb-2">
                  How do you learn best?
                </h1>
                <p className="text-bark text-base">
                  We&rsquo;ll adapt content structure to fit your needs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LEARNING_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setLearningStyle(style.value)}
                    className={`group text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                      learningStyle === style.value
                        ? "border-primary-green bg-primary-green-muted/40 shadow-sm"
                        : "border-stone bg-cream hover:border-primary-green/50 hover:bg-cream/80"
                    }`}
                  >
                    <span className="text-2xl block mb-2">{style.icon}</span>
                    <span className="text-soil font-semibold block text-base">
                      {style.label}
                    </span>
                    <span className="text-bark text-sm mt-1 block">
                      {style.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Content style */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <span className="text-4xl mb-4 block">🌸</span>
                <h1 className="text-2xl sm:text-3xl font-bold text-soil font-(family-name:--font-display) mb-2">
                  Pick your content style
                </h1>
                <p className="text-bark text-base">
                  Choose how you prefer to absorb new material.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {CONTENT_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setContentStyle(style.value)}
                    className={`group text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 ${
                      contentStyle === style.value
                        ? "border-primary-green bg-primary-green-muted/40 shadow-sm"
                        : "border-stone bg-cream hover:border-primary-green/50 hover:bg-cream/80"
                    }`}
                  >
                    <span className="text-3xl flex-shrink-0">{style.icon}</span>
                    <div>
                      <span className="text-soil font-semibold block text-base">
                        {style.label}
                      </span>
                      <span className="text-bark text-sm mt-1 block">
                        {style.description}
                      </span>
                    </div>
                  </button>
                ))}
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
              disabled={!canProceed() || isSubmitting}
              className="rounded-full h-12 px-8 bg-primary-green text-white hover:bg-primary-green-dark disabled:opacity-40 font-semibold text-base shadow-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
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
