import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Types for Gemini response
interface GeminiUnit {
  title: string;
  content: string;
  key_terms: { term: string; definition: string }[];
  diagram_mermaid: string;
  mc_questions: {
    question: string;
    options: [string, string, string, string];
    correct_answer: string;
  }[];
  short_answers: {
    question: string;
    correct_answer: string;
  }[];
  // backward compat
  short_answer?: {
    question: string;
    correct_answer: string;
  };
}

interface GeminiResponse {
  units: GeminiUnit[];
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();
    const { fileUrl, topicName, flowerType } = body;

    if (!fileUrl || !topicName || !flowerType) {
      return NextResponse.json(
        { error: "Missing required fields: fileUrl, topicName, flowerType" },
        { status: 400 }
      );
    }

    // Validate flower type
    const validFlowerTypes = ["rose", "tulip", "sunflower", "daisy", "lavender"];
    if (!validFlowerTypes.includes(flowerType)) {
      return NextResponse.json(
        { error: "Invalid flower type" },
        { status: 400 }
      );
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 3. Fetch learner profile
    const { data: profile } = await supabase
      .from("learner_profiles")
      .select("primary_language, learning_style, preferences_json")
      .eq("user_id", user.id)
      .single();

    // Build learner context for Gemini prompt
    const learnerContext = profile
      ? `
Student profile: primary_language=${profile.primary_language}, learning_style=${profile.learning_style}.
${profile.primary_language !== "English" ? "Simplify vocabulary. Define technical terms inline. Keep sentences short." : ""}
${profile.learning_style === "ADHD" ? "Break content into max 5-minute chunks. Use bullet points. Add frequent knowledge checks." : ""}
`.trim()
      : "No learner profile available. Use clear, standard explanations.";

    // 4. Download the PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("uploads")
      .download(fileUrl);

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: `Failed to download file: ${downloadError?.message || "Unknown error"}` },
        { status: 500 }
      );
    }

    // Convert to base64 for Gemini inline data
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 5. Call Gemini API
    const prompt = `You are an expert educational content creator. Analyze the following PDF document about "${topicName}" and create structured study units.

${learnerContext}

IMPORTANT: You must return ONLY valid JSON, with no markdown formatting, no code fences, and no extra text. The response must be parseable by JSON.parse().

DYNAMIC UNIT COUNT: Create a number of units proportional to the content length and complexity:
- Very short/simple content: 1-2 units
- Medium content: 3-5 units
- Large/complex content: 6-7 units
- Maximum: 10 units
Each unit should cover a distinct concept or section.

DYNAMIC QUIZ COUNT: Each unit should have a proportional number of questions:
- 2-5 multiple choice questions depending on unit complexity
- 1-2 short answer questions depending on unit complexity

MATH SUPPORT: If the content involves math, use LaTeX notation wrapped in $...$ for inline math or $$...$$ for display math in questions, options, and content. For example: $x^2 + y^2 = r^2$ or $$\\int_0^1 f(x) dx$$

Return this exact JSON structure:
{
  "units": [
    {
      "title": "Unit title here",
      "content": "Detailed explanation of the concept. Use clear paragraphs. Include examples where helpful. This should be comprehensive enough for a student to learn the concept from this text alone. Use $LaTeX$ for any math expressions.",
      "key_terms": [
        { "term": "Term name", "definition": "Clear definition" }
      ],
      "diagram_mermaid": "graph TD\\n    A[Concept A] --> B[Concept B]\\n    B --> C[Concept C]",
      "mc_questions": [
        {
          "question": "What is...?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": "Option A"
        }
      ],
      "short_answers": [
        {
          "question": "Explain the concept of... in your own words.",
          "correct_answer": "A good answer would include..."
        }
      ]
    }
  ]
}

Rules:
- Each unit must have 2-5 multiple choice questions with exactly 4 options each
- Each unit must have 1-2 short answer questions
- The correct_answer for MC questions must exactly match one of the options
- Mermaid diagrams must use valid mermaid.js syntax (graph TD, flowchart LR, etc.)
- IMPORTANT: Any node text containing spaces or special characters (like parentheses) MUST be wrapped with double quotes, e.g., A["Node description (info)"] --> B["Another Node"]. Failure to do this will crash the layout.
- Content should be thorough — at least 3-4 paragraphs per unit
- Key terms should include 3-8 terms per unit
- Make questions progressively harder within each unit
- Return ONLY the JSON object, nothing else`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      },
      { text: prompt },
    ]);

    const responseText = result.response.text();

    // 6. Parse the JSON response
    let parsedResponse: GeminiResponse;
    try {
      // Try direct parse first
      parsedResponse = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from markdown code fences
      const jsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find JSON object in the response
        const objectMatch = responseText.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          parsedResponse = JSON.parse(objectMatch[0]);
        } else {
          console.error("Failed to parse Gemini response:", responseText.slice(0, 500));
          return NextResponse.json(
            { error: "Failed to parse AI response. Please try again." },
            { status: 500 }
          );
        }
      }
    }

    // Validate the response structure
    if (!parsedResponse.units || !Array.isArray(parsedResponse.units) || parsedResponse.units.length === 0) {
      return NextResponse.json(
        { error: "AI returned an invalid response structure. Please try again." },
        { status: 500 }
      );
    }

    // 7. Create DB records

    // 7a. Get or create garden
    let gardenId: string;
    const { data: existingGarden } = await supabase
      .from("gardens")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingGarden) {
      gardenId = existingGarden.id;
    } else {
      const { data: newGarden, error: gardenError } = await supabase
        .from("gardens")
        .insert({ user_id: user.id })
        .select("id")
        .single();

      if (gardenError || !newGarden) {
        return NextResponse.json(
          { error: `Failed to create garden: ${gardenError?.message || "Unknown error"}` },
          { status: 500 }
        );
      }
      gardenId = newGarden.id;
    }

    // 7b. Assign to first empty grid spot (center outward)
    const { data: existingFlowers } = await supabase
      .from("flowers")
      .select("pos_x, pos_z")
      .eq("garden_id", gardenId)
      .not("pos_x", "is", null);

    const occupied = new Set(existingFlowers?.map(f => `${f.pos_x},${f.pos_z}`) || []);
    let spawnX = 0;
    let spawnZ = 0;
    let found = false;
    
    const gridSearch = [0, 3, -3, 6, -6, 9, -9, 12, -12];
    for (const x of gridSearch) {
      for (const z of gridSearch) {
        if (!occupied.has(`${x},${z}`)) {
          spawnX = x;
          spawnZ = z;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    // 7c. Create flower with random pattern and new coords
    const patternId = Math.floor(Math.random() * 5) + 1; // 1-5
    const patternOffsetX = Math.random(); // 0.0-1.0
    const patternOffsetY = Math.random(); // 0.0-1.0

    const { data: flower, error: flowerError } = await supabase
      .from("flowers")
      .insert({
        garden_id: gardenId,
        user_id: user.id,
        topic_name: topicName,
        flower_type: flowerType,
        pattern_id: patternId,
        pattern_offset_x: patternOffsetX,
        pattern_offset_y: patternOffsetY,
        pos_x: spawnX,
        pos_z: spawnZ,
        growth_stage: 0,
        status: "growing",
      })
      .select("id")
      .single();

    if (flowerError || !flower) {
      return NextResponse.json(
        { error: `Failed to create flower: ${flowerError?.message || "Unknown error"}` },
        { status: 500 }
      );
    }

    // 7c. Create units and quizzes
    for (let i = 0; i < parsedResponse.units.length; i++) {
      const unit = parsedResponse.units[i];

      const { data: unitRecord, error: unitError } = await supabase
        .from("units")
        .insert({
          flower_id: flower.id,
          user_id: user.id,
          title: unit.title,
          order_index: i,
          content_json: {
            content: unit.content,
            key_terms: unit.key_terms,
          },
          diagram_mermaid: unit.diagram_mermaid,
        })
        .select("id")
        .single();

      if (unitError || !unitRecord) {
        console.error(`Failed to create unit ${i}:`, unitError);
        continue; // Skip this unit but continue with others
      }

      // Create MC quizzes for this unit
      const mcQuizzes = unit.mc_questions.map((q) => ({
        unit_id: unitRecord.id,
        user_id: user.id,
        type: "mc" as const,
        question: q.question,
        options_json: q.options,
        correct_answer: q.correct_answer,
      }));

      // Create short answer quizzes (support both array and single)
      const shortAnswers = unit.short_answers || (unit.short_answer ? [unit.short_answer] : []);
      const saQuizzes = shortAnswers.map((sa) => ({
        unit_id: unitRecord.id,
        user_id: user.id,
        type: "short" as const,
        question: sa.question,
        options_json: null,
        correct_answer: sa.correct_answer,
      }));

      const allQuizzes = [...mcQuizzes, ...saQuizzes];

      const { error: quizError } = await supabase
        .from("quizzes")
        .insert(allQuizzes);

      if (quizError) {
        console.error(`Failed to create quizzes for unit ${i}:`, quizError);
      }
    }

    // 8. Return the flower ID
    return NextResponse.json({ flowerId: flower.id }, { status: 201 });
  } catch (err) {
    console.error("Gemini process error:", err);

    // Handle specific error types
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
