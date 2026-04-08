import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { rollRarity, randomHexColor } from "@/lib/rarity";
import { checkSeedLimit } from "@/lib/plan";

const openai = new OpenAI();

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
    const { fileUrl, topicName, flowerType, textContent, sourceType } = body;

    if (!topicName || !flowerType) {
      return NextResponse.json(
        { error: "Missing required fields: topicName, flowerType" },
        { status: 400 }
      );
    }

    if (!fileUrl && !textContent) {
      return NextResponse.json(
        { error: "Missing content: provide either a file or text content" },
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

    // 2b. Check seed limit (Free: 3/week)
    const seedCheck = await checkSeedLimit();
    if (!seedCheck.allowed) {
      return NextResponse.json(
        { error: "SEED_LIMIT_REACHED", used: seedCheck.used, limit: seedCheck.limit },
        { status: 403 }
      );
    }

    // 3. Fetch learner profile
    const { data: profile } = await supabase
      .from("learner_profiles")
      .select("primary_language, learning_style, preferences_json")
      .eq("user_id", user.id)
      .single();

    // Build learner context for prompt
    const isEsl = profile?.preferences_json?.is_esl;
    const isVisual = profile?.preferences_json?.is_visual_learner;
    const isAdhd = profile?.learning_style === "ADHD";

    const learnerContext = profile
      ? `
Student profile: primary_language=${profile.primary_language}, learning_style=${profile.learning_style}.
${profile.primary_language !== "English" ? "Translate any necessary content accurately." : ""}
${isEsl ? "STUDENT IS AN ESL LEARNER: You must simplify language, reduce complexity, avoid idioms, and use high-frequency vocabulary in all generated content." : ""}
${isAdhd ? "STUDENT HAS ADHD: Break content into max 5-minute chunks. Use bullet points. Add frequent knowledge checks." : ""}
${isVisual ? "STUDENT IS A VISUAL LEARNER: You MUST increase emphasis on Mermaid diagrams. Include a detailed, comprehensive Mermaid concept map in EVERY unit, and summarize complex paragraphs into structured diagrams where possible." : ""}
`.trim()
      : "No learner profile available. Use clear, standard explanations.";

    // 4. Build AI input based on source type
    type InputContent =
      | { type: "input_text"; text: string }
      | { type: "input_file"; filename: string; file_data: string }
      | { type: "input_image"; image_url: string; detail: "auto" | "low" | "high" };

    let aiInputContent: InputContent[];

    if (sourceType === "image" && fileUrl) {
      // IMAGE: download from Supabase, send as vision input
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("uploads")
        .download(fileUrl);

      if (downloadError || !fileData) {
        return NextResponse.json(
          { error: `Failed to download image: ${downloadError?.message || "Unknown error"}` },
          { status: 500 }
        );
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");
      const ext = fileUrl.split(".").pop()?.toLowerCase() || "jpeg";
      const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

      aiInputContent = [
        {
          type: "input_image",
          image_url: `data:${mimeType};base64,${base64Data}`,
          detail: "auto" as const,
        },
        {
          type: "input_text",
          text: `This image contains study material about "${topicName}". First, extract ALL text and content visible in the image (OCR). Then analyze the extracted content and create structured study units. Return ONLY raw JSON.`,
        },
      ];
    } else if (textContent) {
      // TEXT / VOICE / YOUTUBE: send raw text
      // Truncate to ~100k chars to stay within model context limits
      const truncated = textContent.length > 100000 ? textContent.slice(0, 100000) + "\n\n[Content truncated due to length]" : textContent;
      aiInputContent = [
        {
          type: "input_text",
          text: `Here is study material about "${topicName}":\n\n${truncated}\n\nAnalyze this content and create structured study units. Return ONLY raw JSON.`,
        },
      ];
    } else if (fileUrl) {
      // PDF: existing flow
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("uploads")
        .download(fileUrl);

      if (downloadError || !fileData) {
        return NextResponse.json(
          { error: `Failed to download file: ${downloadError?.message || "Unknown error"}` },
          { status: 500 }
        );
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");

      aiInputContent = [
        {
          type: "input_file",
          filename: "lecture.pdf",
          file_data: `data:application/pdf;base64,${base64Data}`,
        },
        {
          type: "input_text",
          text: `Analyze this PDF about "${topicName}" and create structured study units. Return ONLY raw JSON.`,
        },
      ];
    } else {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    // 5. Call OpenAI Responses API
    const systemPrompt = `You are a world-class university professor and educational content designer. Your job is to transform the provided PDF document into a complete, self-contained study guide that a student could use to master the material without needing the original document.

${learnerContext}

UNIT STRUCTURE & STRICT SEPARATION:
- Split the material into units rigidly following the structural divisions of the original document (e.g. by explicit chapter, section, or major heading). 
- Minimum: 2 units, Maximum: 5 units.
- VERY IMPORTANT: The quizzes generated inside a specific unit must **ONLY** test the material covered exactly in that specific unit. Do not let quizzes bleed across unit boundaries.

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

DYNAMIC QUIZZES PER UNIT (DEPENDS ON COMPLEXITY):
- Quantities MUST adapt to the length and complexity of the document.
- For a relatively simple/short topic document: exactly 5 MC questions and 2 Short Answer questions per unit.
- For a more complex/long topic document: up to 8 MC questions and 3 Short Answer questions per unit.
- Make the questions progressively harder within each unit (recall → application → analysis).
- Include at least 2 application-level questions that test real understanding, not just memorization.
- Wrong MC options should be plausible — avoid obviously silly distractors.

MATH SUPPORT: If the content involves math, use LaTeX notation wrapped in $...$ for inline math or $$...$$ for display math in questions, options, and content. For example: $x^2 + y^2 = r^2$ or $$\\\\int_0^1 f(x) dx$$

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
- 2-5 units total, rigidly separated exactly by the original document's structure.
- 5-8 multiple choice questions per unit (scales dynamically based on complexity) with exactly 4 options each.
- 2-3 short answer questions per unit (scales dynamically).
- The correct_answer for MC questions must exactly match one of the options.
- Mermaid diagrams must use valid mermaid.js syntax (graph TD, flowchart LR, etc.).
- IMPORTANT: Any node text containing spaces or special characters (like parentheses) MUST be wrapped with double quotes, e.g., A["Node description (info)"] --> B["Another Node"]. Failure to do this will crash the layout.
- Content MUST be thorough — minimum 5 paragraphs per unit, written like a textbook.
- Key terms should include 4-10 terms per unit with complete definitions
- Make questions progressively harder within each unit (recall → application → analysis)
- Return ONLY valid JSON. No markdown, no code fences — just the JSON object.`;

    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      instructions: systemPrompt,
      input: [
        {
          role: "user",
          content: aiInputContent,
        },
      ],
      text: { format: { type: "json_object" } },
    });

    const responseText = response.output_text;

    if (!responseText) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 500 }
      );
    }

    // 6. Parse the JSON response
    let parsedResponse: AIResponse;

    try {
      // OpenAI with json_object format should return clean JSON,
      // but handle edge cases with fences or preamble text
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

      parsedResponse = JSON.parse(cleaned);
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

    // 7c. Create flower with random rarity, pot color, and pattern
    const patternId = Math.floor(Math.random() * 5) + 1;
    const potRarity = rollRarity();
    const potColor = randomHexColor();

    const { data: flower, error: flowerError } = await supabase
      .from("flowers")
      .insert({
        garden_id: gardenId,
        user_id: user.id,
        topic_name: topicName,
        flower_type: flowerType,
        pattern_id: patternId,
        pattern_offset_x: Math.random(),
        pattern_offset_y: Math.random(),
        pot_rarity: potRarity,
        pot_color: potColor,
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
    console.error("Process error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      { error: `Something went wrong processing your content: ${message}` },
      { status: 500 }
    );
  }
}
