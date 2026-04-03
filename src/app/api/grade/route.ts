import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
    const { quizId, answer, correctAnswer, question, lectureMaterial, practiceMode } = await request.json();

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

    // Call OpenAI Responses API to grade the short answer
    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      instructions: `You are a fair and encouraging teacher grading a short answer question. Respond with ONLY valid JSON: {"score": <number 0.0-1.0>, "feedback": "<2-3 sentence encouraging feedback>"}

Scoring guide:
- 1.0 = Perfect or near-perfect answer covering all key points.
- 0.7-0.9 = Good answer, covers most key points.
- 0.4-0.6 = Partial understanding, missing some key aspects.
- 0.1-0.3 = Shows minimal understanding.
- 0.0 = Completely wrong or irrelevant.

CRITICAL INSTRUCTION: You MUST carefully compare the student's answer against BOTH the provided "Reference Answer" AND the "Lecture Material" (if provided). Grant partial marks generously if the student has understood the core concept, even if phrased differently. If the student is partially correct or missing something, ALWAYS explain exactly what is missing in the feedback.`,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Lecture Material (Context):\n${lectureMaterial || "N/A"}\n\nQuestion: ${question}\n\nReference Answer: ${correctAnswer}\n\nStudent's Answer: ${answer}\n\nRespond with JSON.`,
            },
          ],
        },
      ],
      text: { format: { type: "json_object" } },
    });

    const responseText = response.output_text;

    let score = 0.5;
    let feedback = "Your answer has been recorded.";

    if (responseText) {
      try {
        // Handle potential markdown fences or preamble
        let cleaned = responseText.trim();
        const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (fenceMatch) {
          cleaned = fenceMatch[1].trim();
        }
        if (!cleaned.startsWith("{")) {
          const first = cleaned.indexOf("{");
          const last = cleaned.lastIndexOf("}");
          if (first !== -1 && last > first) {
            cleaned = cleaned.slice(first, last + 1);
          }
        }
        const parsed = JSON.parse(cleaned);
        score = Math.max(0, Math.min(1, parsed.score));
        feedback = parsed.feedback || feedback;
      } catch (parseError) {
        console.error("Failed to parse grading response:", responseText);
        // Fall back to basic string matching
        const scoreMatch = responseText.match(/"score"\s*:\s*([\d.]+)/);
        if (scoreMatch) {
          score = Math.max(0, Math.min(1, parseFloat(scoreMatch[1])));
        }
        const feedbackMatch = responseText.match(/"feedback"\s*:\s*"([^"]+)"/);
        if (feedbackMatch) {
          feedback = feedbackMatch[1];
        }
      }
    }

    // Save quiz attempt (skip in practice mode — no real quizId)
    if (!practiceMode) {
      await supabase.from("quiz_attempts").insert({
        user_id: user.id,
        quiz_id: quizId,
        answer,
        score,
        ai_feedback: feedback,
      });
    }

    return NextResponse.json({ score, feedback });
  } catch (err) {
    console.error("Grade route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
