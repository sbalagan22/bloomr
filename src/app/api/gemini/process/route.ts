import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Types for AI response
interface AIUnit {
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

interface AIResponse {
  units: AIUnit[];
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

    // Build learner context for prompt
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

    // Convert PDF to base64 for OpenAI file input
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 5. Call OpenAI API with PDF as file input
    const systemPrompt = `You are a world-class university professor and educational content designer. Your job is to transform the provided PDF document into a complete, self-contained study guide that a student could use to master the material without needing the original document.

${learnerContext}

UNIT STRUCTURE: Split the material into units by topic or logical section.
- Minimum: 2 units
- Maximum: 5 units
- Each unit should cover one distinct topic, concept, or chapter section.
- If the document covers only one topic, create 2 units: one for core concepts and one for applications/deeper analysis.

CONTENT DEPTH — THIS IS CRITICAL:
Each unit's "content" field must be a thorough, textbook-quality explanation:
- Write 5-8 detailed paragraphs per unit minimum.
- Explain concepts from first principles. Don't assume prior knowledge.
- Include concrete examples, analogies, and real-world applications.
- Walk through problem-solving steps if applicable.
- Explain WHY things work, not just WHAT they are.
- If there are formulas or processes, break them down step by step.
- Use transition sentences between paragraphs to build a clear narrative.
- The content should read like a well-written textbook chapter, not bullet points.

QUESTIONS PER UNIT — dynamic based on unit complexity:
- Multiple choice: minimum 5, maximum 8 questions per unit (exactly 4 options each)
- Short answer: minimum 2, maximum 3 questions per unit
- Questions should progress from recall → understanding → application → analysis
- Include at least 2 application-level questions that test real understanding, not just memorization
- Wrong MC options should be plausible — avoid obviously silly distractors

MATH SUPPORT: If the content involves math, use LaTeX notation wrapped in $...$ for inline math or $$...$$ for display math in questions, options, and content. For example: $x^2 + y^2 = r^2$ or $$\\int_0^1 f(x) dx$$

Return this exact JSON structure:
{
  "units": [
    {
      "title": "Unit title here",
      "content": "Thorough textbook-quality explanation. Multiple detailed paragraphs covering the concept from first principles with examples, analogies, and step-by-step breakdowns. Use $LaTeX$ for any math.",
      "key_terms": [
        { "term": "Term name", "definition": "Clear, complete definition with context" }
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
- 2-5 units total, separated by topic
- 5-8 multiple choice questions per unit with exactly 4 options each
- 2-3 short answer questions per unit
- The correct_answer for MC questions must exactly match one of the options
- Mermaid diagrams must use valid mermaid.js syntax (graph TD, flowchart LR, etc.)
- IMPORTANT: Any node text containing spaces or special characters (like parentheses) MUST be wrapped with double quotes, e.g., A["Node description (info)"] --> B["Another Node"]. Failure to do this will crash the layout.
- Content MUST be thorough — minimum 5 paragraphs per unit, written like a textbook
- Key terms should include 4-10 terms per unit with complete definitions
- Make questions progressively harder within each unit (recall → application → analysis)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      max_tokens: 16384,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "file",
              file: {
                filename: "document.pdf",
                file_data: `data:application/pdf;base64,${base64Data}`,
              },
            },
            {
              type: "text",
              text: `Analyze this PDF about "${topicName}" and create structured study units.`,
            },
          ],
        },
      ],
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 500 }
      );
    }

    // 6. Parse the JSON response (OpenAI JSON mode guarantees valid JSON)
    let parsedResponse: AIResponse;

    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse OpenAI response:", responseText.slice(0, 500));
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
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

    // 7d. Create units and quizzes
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
        continue;
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
    console.error("PDF process error:", err);

    return NextResponse.json(
      { error: "Something went wrong processing your PDF. Please try again." },
      { status: 500 }
    );
  }
}
