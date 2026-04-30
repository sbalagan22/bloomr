import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI();

interface CustomQuizResponse {
  title: string;
  content: string;
  questions: {
    type: "mc" | "short";
    question: string;
    options?: [string, string, string, string];
    correct_answer: string;
    explanation: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, flowerId } = await request.json();

    if (!prompt || !flowerId) {
      return NextResponse.json({ error: "Missing prompt or flowerId" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call OpenAI to generate a custom quiz
    const systemPrompt = `You are a world-class tutor. Given a study topic or specific concept requested by the user, create a short focused review unit.

Return this EXACT JSON structure:
{
  "title": "Custom Practice: [Topic Name]",
  "content": "A brief 2-3 paragraph summary focusing solely on the specific concepts requested.",
  "questions": [
    {
      "type": "mc",
      "question": "...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Brief explanation of why this is correct"
    },
    {
      "type": "short",
      "question": "...",
      "correct_answer": "reference answer covering key points",
      "explanation": "Key points a good answer should cover"
    }
  ]
}

Rules:
- Generate exactly 4-5 questions total (mix of mc and short answer).
- Zero in precisely on what the user wants to practice.
- The correct_answer for MC questions must exactly match one of the options.
- Return ONLY valid JSON.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `I want to practice: ${prompt}` },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message.content ?? "{}") as CustomQuizResponse;

    if (!parsed.questions || !parsed.title) {
      return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });
    }

    // Determine highest order_index for units in the same flower
    const { data: existingUnits } = await supabase
      .from("units")
      .select("order_index")
      .eq("flower_id", flowerId)
      .order("order_index", { ascending: false })
      .limit(1);
    
    let nextIndex = 1;
    if (existingUnits && existingUnits.length > 0) {
        nextIndex = existingUnits[0].order_index + 1;
    }

    // Insert new unit
    const { data: newUnit, error: unitError } = await supabase
      .from("units")
      .insert({
        flower_id: flowerId,
        user_id: user.id,
        title: parsed.title,
        order_index: nextIndex,
        content_json: {
          content: "",
          key_terms: [],
        },
        diagram_mermaid: "",
        is_custom: true,
      })
      .select("id")
      .single();

    if (unitError || !newUnit) {
      return NextResponse.json({ error: "Failed to create custom unit" }, { status: 500 });
    }

    // Insert questions
    const quizzesToInsert = parsed.questions.map((q) => ({
      unit_id: newUnit.id,
      user_id: user.id,
      type: q.type,
      question: q.question,
      options_json: q.options || null,
      correct_answer: q.correct_answer,
    }));

    const { error: quizError } = await supabase
      .from("quizzes")
      .insert(quizzesToInsert);

    if (quizError) {
      return NextResponse.json({ error: "Failed to create questions" }, { status: 500 });
    }

    return NextResponse.json({ success: true, unitId: newUnit.id, title: parsed.title });
  } catch (err) {
    console.error("Custom Quiz generation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
