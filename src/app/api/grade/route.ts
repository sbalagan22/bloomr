import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

    // Call Gemini to grade the short answer
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a fair and encouraging teacher grading a short answer question. Respond with ONLY valid JSON (no markdown, no code fences): {"score": <number 0.0-1.0>, "feedback": "<2-3 sentence encouraging feedback>"}

Scoring guide:
- 1.0 = Perfect or near-perfect answer covering all key points
- 0.7-0.9 = Good answer, covers most key points
- 0.4-0.6 = Partial understanding, missing some key aspects
- 0.1-0.3 = Shows minimal understanding
- 0.0 = Completely wrong or irrelevant

Question: ${question}

Correct/Reference Answer: ${correctAnswer}

Student's Answer: ${answer}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let score = 0.5;
    let feedback = "Your answer has been recorded.";

    if (responseText) {
      try {
        // Strip markdown code fences if present
        let cleaned = responseText.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
        }
        const parsed = JSON.parse(cleaned);
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
