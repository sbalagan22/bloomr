import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, checkFlowyLimit, incrementFlowyUsage } from "@/lib/plan";

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flowerId, messages } = body;

    if (!flowerId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Missing required fields: flowerId, messages" },
        { status: 400 }
      );
    }

    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch flower and units for context
    const { data: flower, error: flowerError } = await supabase
      .from("flowers")
      .select("topic_name")
      .eq("id", flowerId)
      .eq("user_id", user.id)
      .single();

    if (flowerError || !flower) {
      return NextResponse.json(
        { error: "Flower not found or unauthorized" },
        { status: 404 }
      );
    }

    // 3. Check Flowy daily limit (Free: 10/day/flower)
    const plan = await getUserPlan();
    const flowyCheck = await checkFlowyLimit(user.id, flowerId, plan);
    if (!flowyCheck.allowed) {
      return NextResponse.json(
        { error: "FLOWY_LIMIT_REACHED", used: flowyCheck.used, limit: flowyCheck.limit },
        { status: 403 }
      );
    }

    const { data: units } = await supabase
      .from("units")
      .select("title, content_json")
      .eq("flower_id", flowerId)
      .order("order_index");

    // Build context string from units
    let contextString = `Topic: ${flower.topic_name}\n\n`;
    if (units && units.length > 0) {
      units.forEach((u, i) => {
        contextString += `--- Unit ${i + 1}: ${u.title} ---\n`;
        if (u.content_json && typeof u.content_json === 'object') {
          const content = (u.content_json as any).content || "";
          contextString += `${content}\n\n`;
        }
      });
    } else {
      contextString += "No units found for this topic yet.\n";
    }

    const systemPrompt = `You are Flowy, the user's personal AI tutor and assistant, specialized in being highly intelligent, encouraging, and Socratic for a student learning about ${flower.topic_name}.
Below is the course material the student is studying. 
Answer their questions ONLY using this material. If they ask something outside the scope of the material, politely redirect them to the topics covered.
When answering, ALWAYS try to provide concrete examples, reference the specific terminology from the resources, and explain things clearly. Keep your answers relatively brief but highly substantive and encouraging. Use markdown formatting.

COURSE MATERIAL CONTEXT:
${contextString}`;

    // Prepare messages for OpenAI
    const openAiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }))
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      max_completion_tokens: 8192,
      messages: openAiMessages as any,
      temperature: 0.5,
    });

    const reply = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Increment usage count after successful response
    await incrementFlowyUsage(user.id, flowerId);

    return NextResponse.json({ reply, used: flowyCheck.used + 1, limit: flowyCheck.limit });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Failed to process chat request." },
      { status: 500 }
    );
  }
}
