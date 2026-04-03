"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  PiArrowLeftBold,
  PiCheckCircleBold,
  PiXCircleBold,
  PiArrowRightBold,
  PiLightningBold,
  PiRepeatBold,
} from "react-icons/pi";
import { FlowerLoader } from "@/components/ui/flower-loader";
import { MathText } from "@/components/math-text";
import type { PracticeQuestion } from "@/app/api/practice-quiz/route";

const PASS_THRESHOLD = 0.8;

export default function PracticeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const flowerId = params.id as string;
  const unitId = params.unitId as string;
  const conceptsParam = searchParams.get("concepts") ?? "";
  const concepts = conceptsParam ? conceptsParam.split(",") : [];

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [unitTitle, setUnitTitle] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<
    Record<number, { correct: boolean; score: number; feedback: string }>
  >({});
  const [grading, setGrading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!concepts.length) {
      setError("No concepts specified for practice.");
      setLoading(false);
      return;
    }

    async function generateQuiz() {
      try {
        const res = await fetch("/api/practice-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concepts, unitId }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setQuestions(data.questions ?? []);
        setUnitTitle(data.unitTitle ?? "");
      } catch (err) {
        setError("Failed to generate practice quiz. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    generateQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId, conceptsParam]);

  const currentQ = questions[currentIndex];

  const handleMCAnswer = (option: string) => {
    if (results[currentIndex] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [currentIndex]: option }));
    const isCorrect = option === currentQ.correct_answer;
    setResults((prev) => ({
      ...prev,
      [currentIndex]: {
        correct: isCorrect,
        score: isCorrect ? 1 : 0,
        feedback: isCorrect
          ? `Correct! ${currentQ.explanation}`
          : `Incorrect. The correct answer is: ${currentQ.correct_answer}. ${currentQ.explanation}`,
      },
    }));
  };

  const handleShortAnswerGrade = useCallback(async () => {
    if (!answers[currentIndex]?.trim()) return;
    setGrading(true);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: `practice_${unitId}_${currentIndex}`,
          question: currentQ.question,
          answer: answers[currentIndex],
          correctAnswer: currentQ.correct_answer,
          practiceMode: true,
        }),
      });
      const data = await res.json();
      setResults((prev) => ({
        ...prev,
        [currentIndex]: {
          correct: data.score >= PASS_THRESHOLD,
          score: data.score,
          feedback: data.feedback ?? (data.score >= PASS_THRESHOLD ? "Good answer!" : `Needs improvement. ${currentQ.explanation}`),
        },
      }));
    } catch {
      setResults((prev) => ({
        ...prev,
        [currentIndex]: { correct: false, score: 0, feedback: "Failed to grade. Please try again." },
      }));
    } finally {
      setGrading(false);
    }
  }, [answers, currentIndex, currentQ, unitId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <FlowerLoader
          text="Generating Practice Quiz..."
          subtext="Targeting your specific weak areas"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 text-center">
        <p className="text-destructive font-medium mb-4">{error}</p>
        <Link href={`/flower/${flowerId}/quiz/${unitId}`}>
          <Button variant="outline" className="rounded-full">
            <PiArrowLeftBold className="mr-1" /> Back to Quiz
          </Button>
        </Link>
      </div>
    );
  }

  // --- Results ---
  if (showResults) {
    const totalScore = Object.values(results).reduce((s, r) => s + r.score, 0);
    const percentage = questions.length > 0 ? totalScore / questions.length : 0;
    const passed = percentage >= PASS_THRESHOLD;

    return (
      <div className="mx-auto max-w-2xl px-6 py-12 animate-fade-in-up mt-4 lg:mt-8">
        <div className="bg-surface/90 backdrop-blur-xl pebble-shadow rounded-3xl border border-white/20 p-8 pointer-events-auto">
          {/* Practice Mode badge */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-4 py-1.5 text-xs font-bold text-amber-800">
              Practice Mode · No grade recorded
            </span>
          </div>

          <div className="text-center mb-6">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                passed ? "bg-primary-fixed" : "bg-destructive/10"
              }`}
            >
              {passed ? (
                <PiCheckCircleBold className="text-3xl text-on-primary-fixed" />
              ) : (
                <PiXCircleBold className="text-3xl text-destructive" />
              )}
            </div>
            <h2 className="font-heading text-2xl font-extrabold text-on-surface mb-1">
              {passed ? "Looking Better! 🌱" : "Keep Practicing 💪"}
            </h2>
            <p className="text-sm text-on-surface-variant">{unitTitle}</p>
          </div>

          <div className="bg-surface-container-low rounded-xl p-5 mb-6 text-center">
            <div
              className="text-3xl font-extrabold font-heading mb-1"
              style={{ color: passed ? "#006e2b" : "#ba1a1a" }}
            >
              {Math.round(percentage * 100)}%
            </div>
            <p className="text-sm text-on-surface-variant">
              {totalScore.toFixed(1)} / {questions.length} points
            </p>
          </div>

          {/* Concepts practiced */}
          {concepts.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Concepts Practiced
              </p>
              <div className="flex flex-wrap gap-2">
                {concepts.map((c, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Per-question breakdown */}
          <div className="space-y-3 mb-6">
            {questions.map((q, i) => {
              const r = results[i];
              return (
                <div key={i} className="rounded-xl bg-surface-container-low p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        r?.correct
                          ? "bg-primary-fixed text-on-primary-fixed"
                          : r?.score > 0
                          ? "bg-bloom-tulip/20 text-bloom-tulip"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {r?.correct ? "✓" : r?.score > 0 ? `${Math.round(r.score * 100)}%` : "✗"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface mb-1">
                        Q{i + 1}: <MathText text={q.question} inline />
                      </p>
                      {r && (
                        <p className="text-xs text-on-surface-variant">{r.feedback}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            <Link href={`/flower/${flowerId}/quiz/${unitId}`}>
              <Button className="w-full rounded-full gradient-cta text-white border-0 font-bold">
                <PiRepeatBold className="mr-2" /> Retry the Real Quiz
              </Button>
            </Link>
            <Link href={`/flower/${flowerId}`}>
              <Button variant="outline" className="w-full rounded-full">
                <PiArrowLeftBold className="mr-1" /> Back to Flower
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQ) return null;

  const canAdvance = results[currentIndex] !== undefined;
  const isLastQuestion = currentIndex === questions.length - 1;
  const allAnswered = questions.every((_, i) => results[i] !== undefined);

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 animate-fade-in-up bg-surface/90 backdrop-blur-xl rounded-3xl mt-4 lg:mt-8 border border-amber-200 pebble-shadow pointer-events-auto mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/flower/${flowerId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary-deep transition-colors"
        >
          <PiArrowLeftBold /> Exit Practice
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-700">
          Practice Mode
        </span>
      </div>

      {/* Concepts being practiced */}
      {concepts.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {concepts.map((c, i) => (
            <span
              key={i}
              className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Question counter (no progress bar — Practice Mode) */}
      <div className="mb-4 flex items-center justify-between text-xs font-semibold text-on-surface-variant">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <span>{unitTitle}</span>
      </div>

      {/* Question Card */}
      <div className="bg-surface-container-lowest pebble-shadow rounded-2xl p-8">
        <div className="mb-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              currentQ.type === "mc"
                ? "bg-bloom-lavender/15 text-bloom-lavender"
                : "bg-bloom-tulip/15 text-bloom-tulip"
            }`}
          >
            {currentQ.type === "mc" ? "Multiple Choice" : "Short Answer"}
          </span>
        </div>

        <h2 className="font-heading text-xl font-bold text-on-surface mb-6 leading-relaxed">
          <MathText text={currentQ.question} />
        </h2>

        {/* MC Options */}
        {currentQ.type === "mc" && currentQ.options && (
          <div className="flex flex-col gap-3">
            {currentQ.options.map((option, i) => {
              const result = results[currentIndex];
              const isSelected = answers[currentIndex] === option;
              const isCorrectOption = option === currentQ.correct_answer;
              let optionClass =
                "bg-surface-container-low text-on-surface hover:bg-surface-container-high";

              if (result) {
                if (isCorrectOption)
                  optionClass =
                    "bg-primary-fixed text-on-primary-fixed ring-2 ring-primary-deep";
                else if (isSelected && !result.correct)
                  optionClass =
                    "bg-destructive/10 text-destructive ring-2 ring-destructive/50";
                else
                  optionClass =
                    "bg-surface-container-low text-on-surface-variant opacity-60";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleMCAnswer(option)}
                  disabled={!!result}
                  className={`w-full text-left px-5 py-4 rounded-xl font-medium transition-all ${optionClass} ${
                    !result ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span className="font-bold mr-3 text-sm opacity-60">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <MathText text={option} inline />
                </button>
              );
            })}
          </div>
        )}

        {/* Short Answer */}
        {currentQ.type === "short" && (
          <div className="flex flex-col gap-3">
            <textarea
              value={answers[currentIndex] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [currentIndex]: e.target.value }))
              }
              disabled={!!results[currentIndex]}
              placeholder="Type your answer here..."
              className="w-full min-h-[120px] rounded-xl bg-surface-container-highest text-on-surface p-4 placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-deep/20 transition-all resize-y disabled:opacity-70"
            />
            {!results[currentIndex] && (
              <Button
                onClick={handleShortAnswerGrade}
                disabled={grading || !answers[currentIndex]?.trim()}
                className="mt-2 rounded-full gradient-cta text-white border-0 py-5 font-bold"
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
        {results[currentIndex] && (
          <div
            className={`mt-4 rounded-xl p-4 ${
              results[currentIndex].correct
                ? "bg-primary-fixed/20"
                : results[currentIndex].score > 0
                ? "bg-bloom-tulip/10"
                : "bg-destructive/10"
            }`}
          >
            <div className="flex items-start gap-2">
              {results[currentIndex].correct ? (
                <PiCheckCircleBold className="text-lg text-primary-deep mt-0.5 shrink-0" />
              ) : (
                <PiXCircleBold className="text-lg text-destructive mt-0.5 shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold mb-0.5">
                  {results[currentIndex].correct
                    ? "Correct!"
                    : results[currentIndex].score > 0
                    ? `Partial Credit (${Math.round(results[currentIndex].score * 100)}%)`
                    : "Incorrect"}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {results[currentIndex].feedback}
                </p>
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
          <Button
            onClick={() => setShowResults(true)}
            className="rounded-full gradient-cta text-white border-0"
          >
            <PiLightningBold className="mr-1" /> See Results
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={!canAdvance}
            className="rounded-full gradient-cta text-white border-0"
          >
            Next <PiArrowRightBold className="ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
