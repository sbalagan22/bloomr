import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rollRarity, randomHexColor } from "@/lib/rarity";

export async function POST(request: NextRequest) {
  try {
    const { flowerId } = await request.json();

    if (!flowerId) {
      return NextResponse.json({ error: "Missing flowerId" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the flower belongs to this user
    const { data: flower, error: flowerError } = await supabase
      .from("flowers")
      .select("id, pot_rarity, pot_color")
      .eq("id", flowerId)
      .eq("user_id", user.id)
      .single();

    if (flowerError || !flower) {
      return NextResponse.json({ error: "Flower not found" }, { status: 404 });
    }

    // Get all units for this flower
    const { data: units } = await supabase
      .from("units")
      .select("id")
      .eq("flower_id", flowerId)
      .eq("user_id", user.id);

    if (!units || units.length === 0) {
      return NextResponse.json({ error: "No units found" }, { status: 404 });
    }

    const unitIds = units.map((u) => u.id);

    // Mark all units as completed
    await supabase
      .from("units")
      .update({ completed: true })
      .in("id", unitIds);

    // Get all quizzes across all units
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("id")
      .in("unit_id", unitIds)
      .eq("user_id", user.id);

    // Insert a passing attempt for every quiz
    if (quizzes && quizzes.length > 0) {
      const attempts = quizzes.map((q) => ({
        user_id: user.id,
        quiz_id: q.id,
        answer: "auto-passed",
        score: 1,
        ai_feedback: "Auto-passed for development/testing.",
      }));

      await supabase.from("quiz_attempts").insert(attempts);
    }

    // Roll pot rarity/colour if not already assigned
    const potRarity  = flower.pot_rarity  ?? rollRarity();
    const potColor   = flower.pot_color   ?? randomHexColor();

    // Set flower to full bloom
    await supabase
      .from("flowers")
      .update({
        growth_stage: 4,
        status: "bloomed",
        pot_rarity: potRarity,
        pot_color: potColor,
      })
      .eq("id", flowerId);

    return NextResponse.json({ success: true, potRarity, potColor });
  } catch (err) {
    console.error("auto-pass error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
