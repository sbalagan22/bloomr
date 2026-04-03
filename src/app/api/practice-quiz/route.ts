import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI();

export interface PracticeQuestion {
  type: "mc" | "short";
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
}

export async function POST(request: NextRequest) {
  try {
    const { concepts, unitId }: { concepts: string[]; unitId: string } =
      await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: unit } = await supabase
      .from("units")
      .select("title, content_json")
      .eq("id", unitId)
      .single();

    if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });

    const conceptsList = concepts.join(", ");
    const unitContent = (unit.content_json as { content?: string })?.content ?? "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `Generate a focused practice quiz targeting specific weak concepts. Create 4-5 varied questions (mix of MC and short answer). Zero in precisely on the concepts listed — don't test other topics.

Respond with ONLY valid JSON:
{
  "questions": [
    {
      "type": "mc",
      "question": "...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Brief explanation of why this is correct and the concept it tests"
    },
    {
      "type": "short",
      "question": "...",
      "correct_answer": "reference answer covering key points",
      "explanation": "Key points a good answer should cover"
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Unit: ${unit.title}\nWeak concepts to target: ${conceptsList}\n\nUnit content for context:\n${unitContent.slice(0, 3000)}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
    return NextResponse.json({
      questions: (parsed.questions ?? []) as PracticeQuestion[],
      unitTitle: unit.title,
    });
  } catch (err) {
    console.error("Practice quiz error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
