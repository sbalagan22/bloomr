import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
    const { quizId, answer, correctAnswer, question } = await request.json();

    if (!quizId || !answer || !correctAnswer || !question) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call OpenAI to grade the short answer
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      max_tokens: 8192,
      messages: [
        {
          role: "system",
          content: `You are a fair and encouraging teacher grading a short answer question. Respond with ONLY valid JSON: {"score": <number 0.0-1.0>, "feedback": "<2-3 sentence encouraging feedback>"}

Scoring guide:
- 1.0 = Perfect or near-perfect answer covering all key points
- 0.7-0.9 = Good answer, covers most key points
- 0.4-0.6 = Partial understanding, missing some key aspects
- 0.1-0.3 = Shows minimal understanding
- 0.0 = Completely wrong or irrelevant`,
        },
        {
          role: "user",
          content: `Question: ${question}\n\nCorrect/Reference Answer: ${correctAnswer}\n\nStudent's Answer: ${answer}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0].message.content;

    let score = 0.5;
    let feedback = "Your answer has been recorded.";

    if (responseText) {
      try {
        const parsed = JSON.parse(responseText);
        score = Math.max(0, Math.min(1, parsed.score));
        feedback = parsed.feedback || feedback;
      } catch {
        console.error("Failed to parse grading response:", responseText);
      }
    }

    // Save quiz attempt
    await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      quiz_id: quizId,
      answer,
      score,
      ai_feedback: feedback,
    });

    return NextResponse.json({ score, feedback });
  } catch (err) {
    console.error("Grade route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
