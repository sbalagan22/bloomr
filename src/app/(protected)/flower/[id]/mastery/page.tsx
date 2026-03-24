"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PiArrowLeftBold, PiCheckCircleBold, PiXCircleBold, PiLightningBold, PiFlowerBold, PiArrowRightBold } from "react-icons/pi";
import "katex/dist/katex.min.css";

// Render text with LaTeX math
function MathText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    let html = text;
    html = html.replace(/\$\$(.*?)\$\$/g, (_, expr) => {
      try {
        const katex = require("katex");
        return katex.renderToString(expr, { displayMode: true, throwOnError: false });
      } catch { return `$$${expr}$$`; }
    });
    html = html.replace(/\$(.*?)\$/g, (_, expr) => {
      try {
        const katex = require("katex");
        return katex.renderToString(expr, { displayMode: false, throwOnError: false });
      } catch { return `$${expr}$`; }
    });
    ref.current.innerHTML = html;
  }, [text]);
  return <span ref={ref} />;
}

interface Quiz {
  id: string;
  type: "mc" | "short";
  question: string;
  options_json: string[] | null;
  correct_answer: string;
}

interface GradeResult {
  score: number;
  feedback: string;
}

const PASS_THRESHOLD = 0.8; // 80% to pass

export default function MasteryTestPage() {
  const params = useParams();
  const flowerId = params.id as string;

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, { correct: boolean; score: number; feedback: string }>>({});
  const [grading, setGrading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flowerTopic, setFlowerTopic] = useState("");
  const [flowerProgressed, setFlowerProgressed] = useState(false);

  useEffect(() => {
    async function loadMastery() {
      const supabase = createClient();
      
      const { data: flower } = await supabase.from("flowers").select("topic_name").eq("id", flowerId).single();
      if (flower) setFlowerTopic(flower.topic_name);

      // Load all units for flower
      const { data: units } = await supabase.from("units").select("id").eq("flower_id", flowerId);
      if (!units || units.length === 0) {
        setLoading(false);
        return;
      }
      
      const unitIds = units.map(u => u.id);
      
      // Load all quizzes for all units
      const { data: allQuizzes } = await supabase.from("quizzes").select("*").in("unit_id", unitIds);
      
      let selectedQuizzes = allQuizzes || [];
      // Shuffle and pick 7-10 questions for mastery test
      selectedQuizzes = selectedQuizzes.sort(() => Math.random() - 0.5);
      const masteryCount = Math.max(7, Math.min(10, selectedQuizzes.length));
      selectedQuizzes = selectedQuizzes.slice(0, masteryCount);
      
      setQuizzes(selectedQuizzes);
      setLoading(false);
    }
    loadMastery();
  }, [flowerId]);

  const currentQuiz = quizzes[currentIndex];

  const handleMCAnswer = (option: string) => {
    if (results[currentQuiz.id]) return; // Already answered
    setAnswers((prev) => ({ ...prev, [currentQuiz.id]: option }));
    const isCorrect = option === currentQuiz.correct_answer;
    setResults((prev) => ({
      ...prev,
      [currentQuiz.id]: { correct: isCorrect, score: isCorrect ? 1 : 0, feedback: isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${currentQuiz.correct_answer}` },
    }));
  };

  const handleShortAnswerGrade = useCallback(async () => {
    if (!answers[currentQuiz.id]?.trim()) return;
    setGrading(true);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: currentQuiz.id,
          question: currentQuiz.question,
          answer: answers[currentQuiz.id],
          correctAnswer: currentQuiz.correct_answer,
        }),
      });
      const data: GradeResult = await res.json();
      setResults((prev) => ({
        ...prev,
        [currentQuiz.id]: { correct: data.score >= PASS_THRESHOLD, score: data.score, feedback: data.feedback || (data.score >= PASS_THRESHOLD ? "Good answer!" : "Needs improvement.") },
      }));
    } catch {
      setResults((prev) => ({
        ...prev,
        [currentQuiz.id]: { correct: false, score: 0, feedback: "Failed to grade. Please try again." },
      }));
    } finally {
      setGrading(false);
    }
  }, [answers, currentQuiz]);

  const handleFinish = useCallback(async () => {
    // Calculate overall score
    const totalScore = Object.values(results).reduce((sum, r) => sum + r.score, 0);
    const maxScore = quizzes.length;
    const percentage = maxScore > 0 ? totalScore / maxScore : 0;
    const passed = percentage >= PASS_THRESHOLD;

    if (passed) {
      const supabase = createClient();
      await supabase.from("flowers").update({ growth_stage: 4, status: "bloomed" }).eq("id", flowerId);
      setFlowerProgressed(true);
    }

    setShowResults(true);
  }, [results, quizzes, flowerId]);

  const handleAutoPass = useCallback(() => {
    if (!quizzes.length) return;
    const dummyResults: Record<string, { correct: boolean; score: number; feedback: string }> = {};
    const dummyAnswers: Record<string, string> = {};
    quizzes.forEach((q) => {
      dummyResults[q.id] = { correct: true, score: 1, feedback: "Auto-passed for testing" };
      dummyAnswers[q.id] = q.correct_answer;
    });
    setResults(dummyResults);
    setAnswers(dummyAnswers);
  }, [quizzes]);

  const canAdvance = currentQuiz && results[currentQuiz.id] !== undefined;
  const isLastQuestion = currentIndex === quizzes.length - 1;
  const allAnswered = quizzes.every((q) => results[q.id] !== undefined);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-primary-fixed/30" />
      </div>
    );
  }

  // --- Results Summary ---
  if (showResults) {
    const totalScore = Object.values(results).reduce((sum, r) => sum + r.score, 0);
    const maxScore = quizzes.length;
    const percentage = maxScore > 0 ? totalScore / maxScore : 0;
    const passed = percentage >= PASS_THRESHOLD;

    return (
      <div className="mx-auto max-w-2xl px-6 py-12 animate-fade-in-up mt-4 lg:mt-8">
        <div className="bg-surface/90 backdrop-blur-xl pebble-shadow rounded-3xl border border-white/20 p-8 text-center pointer-events-auto">
          <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${passed ? "bg-primary-fixed" : "bg-destructive/10"}`}>
            {passed ? <PiCheckCircleBold className="text-4xl text-on-primary-fixed" /> : <PiXCircleBold className="text-4xl text-destructive" />}
          </div>
          <h2 className="font-heading text-3xl font-extrabold text-on-surface mb-2">
            {passed ? "Mastery Achieved! 🌸" : "Keep Studying 🌱"}
          </h2>
          <p className="text-on-surface-variant mb-4">{flowerTopic} - Final Test</p>

          <div className="bg-surface-container-low rounded-xl p-6 mb-6">
            <div className="text-4xl font-extrabold font-heading mb-1" style={{ color: passed ? "#006e2b" : "#ba1a1a" }}>
              {Math.round(percentage * 100)}%
            </div>
            <p className="text-sm text-on-surface-variant">
              {totalScore.toFixed(1)} / {maxScore} points • {passed ? "Passed (≥80%)" : `Need ≥80% to pass`}
            </p>
          </div>

          {flowerProgressed && (
            <div className="gradient-cta text-white rounded-xl p-4 mb-6 shadow-md">
              <PiFlowerBold className="text-2xl mx-auto mb-1" />
              <p className="font-bold">Your flower reached Full Bloom!</p>
            </div>
          )}

          {/* Per-question breakdown */}
          <div className="text-left space-y-3 mb-6">
            {quizzes.map((q, i) => {
              const r = results[q.id];
              return (
                <div key={q.id} className="rounded-xl bg-surface-container-low p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      r?.correct ? "bg-primary-fixed text-on-primary-fixed" : r?.score > 0 ? "bg-bloom-tulip/20 text-bloom-tulip" : "bg-destructive/10 text-destructive"
                    }`}>
                      {r?.correct ? "✓" : r?.score > 0 ? `${Math.round(r.score * 100)}%` : "✗"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface mb-1">Q{i + 1}: <MathText text={q.question} /></p>
                      {r && <p className="text-xs text-on-surface-variant">{r.feedback}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            {!passed && (
              <Button onClick={() => { setShowResults(false); setCurrentIndex(0); setAnswers({}); setResults({}); }} className="rounded-full gradient-cta text-white border-0">
                <PiLightningBold className="mr-1" /> Retry Mastery Test
              </Button>
            )}
            <Link href={`/flower/${flowerId}`}>
              <Button variant="outline" className="rounded-full">
                <PiArrowLeftBold className="mr-1" /> Back to Flower
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Quiz Questions ---
  if (!currentQuiz) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 animate-fade-in-up mt-8">
        <div className="bg-surface/90 backdrop-blur-xl pebble-shadow rounded-3xl border border-white/20 p-8 text-center pointer-events-auto">
          <h2 className="font-heading text-xl font-bold mb-4">No questions available!</h2>
          <Link href={`/flower/${flowerId}`}>
            <Button variant="outline" className="rounded-full">
              <PiArrowLeftBold className="mr-1" /> Back to Flower
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 animate-fade-in-up bg-surface/90 backdrop-blur-xl rounded-3xl mt-4 lg:mt-8 border border-white/20 pebble-shadow pointer-events-auto mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/flower/${flowerId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary-deep transition-colors">
            <PiArrowLeftBold /> Exit Test
          </Link>
          <button onClick={handleAutoPass} className="px-3 py-1 text-xs font-bold bg-bloom-lavender text-white rounded-full hover:bg-bloom-lavender/90 transition-colors shadow-sm">
            ⚡ Auto-Pass (Dev)
          </button>
        </div>
        <span className="text-sm font-bold text-on-surface-variant hidden sm:inline">{flowerTopic} Mastery</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-on-surface-variant">Question {currentIndex + 1} of {quizzes.length}</span>
          <span className="text-xs text-on-surface-variant">{Object.keys(results).length} answered</span>
        </div>
        <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden">
          <div className="h-full rounded-full transition-all gradient-cta" style={{ width: `${((currentIndex + 1) / quizzes.length) * 100}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-surface-container-lowest pebble-shadow rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentQuiz.type === "mc" ? "bg-bloom-lavender/15 text-bloom-lavender" : "bg-bloom-tulip/15 text-bloom-tulip"}`}>
            {currentQuiz.type === "mc" ? "Multiple Choice" : "Short Answer"}
          </span>
        </div>

        <h2 className="font-heading text-xl font-bold text-on-surface mb-6 leading-relaxed">
          <MathText text={currentQuiz.question} />
        </h2>

        {/* MC Options */}
        {currentQuiz.type === "mc" && currentQuiz.options_json && (
          <div className="flex flex-col gap-3">
            {currentQuiz.options_json.map((option, i) => {
              const result = results[currentQuiz.id];
              const isSelected = answers[currentQuiz.id] === option;
              const isCorrectOption = option === currentQuiz.correct_answer;
              let optionClass = "bg-surface-container-low text-on-surface hover:bg-surface-container-high";

              if (result) {
                if (isCorrectOption) optionClass = "bg-primary-fixed text-on-primary-fixed ring-2 ring-primary-deep";
                else if (isSelected && !result.correct) optionClass = "bg-destructive/10 text-destructive ring-2 ring-destructive/50";
                else optionClass = "bg-surface-container-low text-on-surface-variant opacity-60";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleMCAnswer(option)}
                  disabled={!!result}
                  className={`w-full text-left px-5 py-4 rounded-xl font-medium transition-all ${optionClass} ${!result ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span className="font-bold mr-3 text-sm opacity-60">{String.fromCharCode(65 + i)}.</span>
                  <MathText text={option} />
                </button>
              );
            })}
          </div>
        )}

        {/* Short Answer */}
        {currentQuiz.type === "short" && (
          <div>
            <textarea
              value={answers[currentQuiz.id] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQuiz.id]: e.target.value }))}
              disabled={!!results[currentQuiz.id]}
              placeholder="Type your answer here... You can use $LaTeX$ for math"
              className="w-full min-h-[140px] rounded-xl bg-surface-container-highest text-on-surface p-4 placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-deep/20 transition-all resize-y disabled:opacity-70"
            />
            {!results[currentQuiz.id] && (
              <Button
                onClick={handleShortAnswerGrade}
                disabled={grading || !answers[currentQuiz.id]?.trim()}
                className="mt-3 rounded-full gradient-cta text-white border-0 shadow-sm hover:shadow"
              >
                {grading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Grading...
                  </span>
                ) : (
                  "Submit Answer"
                )}
              </Button>
            )}
          </div>
        )}

        {/* Feedback */}
        {results[currentQuiz.id] && (
          <div className={`mt-4 rounded-xl p-4 ${results[currentQuiz.id].correct ? "bg-primary-fixed/20" : results[currentQuiz.id].score > 0 ? "bg-bloom-tulip/10" : "bg-destructive/10"}`}>
            <div className="flex items-start gap-2">
              {results[currentQuiz.id].correct ? (
                <PiCheckCircleBold className="text-lg text-primary-deep mt-0.5 shrink-0" />
              ) : (
                <PiXCircleBold className="text-lg text-destructive mt-0.5 shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold mb-0.5">
                  {results[currentQuiz.id].correct ? "Correct!" : results[currentQuiz.id].score > 0 ? `Partial Credit (${Math.round(results[currentQuiz.id].score * 100)}%)` : "Incorrect"}
                </p>
                <p className="text-sm text-on-surface-variant">{results[currentQuiz.id].feedback}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="rounded-full"
        >
          <PiArrowLeftBold className="mr-1" /> Previous
        </Button>

        {isLastQuestion && allAnswered ? (
          <Button onClick={handleFinish} className="rounded-full gradient-cta text-white border-0 shadow-md">
            <PiCheckCircleBold className="mr-1" /> Finish Mastery Test
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentIndex((i) => Math.min(quizzes.length - 1, i + 1))}
            disabled={!canAdvance}
            className="rounded-full gradient-cta text-white border-0 shadow-sm"
          >
            Next <PiArrowRightBold className="ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
