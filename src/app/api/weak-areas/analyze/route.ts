import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI();

interface QuizResult {
  quizId: string;
  question: string;
  score: number;
  type: "mc" | "short";
  userAnswer?: string;
}

export interface WeakArea {
  concept: string;
  unitId: string;
  unitTitle: string;
}

export async function POST(request: NextRequest) {
  try {
    const { results, unitId }: { results: QuizResult[]; unitId: string } =
      await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: unit } = await supabase
      .from("units")
      .select("title")
      .eq("id", unitId)
      .single();
    const unitTitle = unit?.title ?? "Unknown Unit";

    // Questions scoring below 60% are weak areas
    const weakItems = results.filter((r) => r.score < 0.6);

    if (weakItems.length === 0) {
      return NextResponse.json({ weakAreas: [] });
    }

    // One batched OpenAI call to extract concept names
    const questionsText = weakItems
      .map((item, i) => `${i + 1}. ${item.question}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: `You are an educational assistant. For each quiz question, identify the core concept being tested (2-5 words, e.g. "Newton's Third Law", "Cell Membrane Transport"). Respond with ONLY valid JSON: {"concepts": ["concept1", "concept2", ...]}`,
        },
        {
          role: "user",
          content: `Identify the concept for each question:\n${questionsText}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    let concepts: string[] = [];
    try {
      const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
      concepts = parsed.concepts ?? [];
    } catch {
      concepts = weakItems.map((_, i) => `Concept ${i + 1}`);
    }

    const weakAreas: WeakArea[] = weakItems.map((item, i) => ({
      concept: concepts[i] ?? "Unknown concept",
      unitId,
      unitTitle,
    }));

    // Persist weak_areas to quiz_attempts
    for (let i = 0; i < weakItems.length; i++) {
      const item = weakItems[i];
      const weakAreaData: WeakArea[] = [
        { concept: concepts[i] ?? "Unknown concept", unitId, unitTitle },
      ];

      if (item.type === "mc") {
        // MC attempts aren't saved by /api/grade, insert them now
        await supabase.from("quiz_attempts").insert({
          user_id: user.id,
          quiz_id: item.quizId,
          answer: item.userAnswer ?? "",
          score: item.score,
          ai_feedback: `Incorrect. Concept: ${concepts[i]}`,
          weak_areas: weakAreaData,
        });
      } else {
        // Short answer was already saved by /api/grade — update most recent record
        const { data: existing } = await supabase
          .from("quiz_attempts")
          .select("id")
          .eq("quiz_id", item.quizId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (existing) {
          await supabase
            .from("quiz_attempts")
            .update({ weak_areas: weakAreaData })
            .eq("id", existing.id);
        }
      }
    }

    return NextResponse.json({ weakAreas });
  } catch (err) {
    console.error("Weak areas analyze error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
