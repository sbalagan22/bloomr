import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { unitId, text } = await request.json();

    if (!unitId || !text) {
      return NextResponse.json(
        { error: "Missing unitId or text" },
        { status: 400 }
      );
    }

    // Check auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Bypassing Supabase Storage caching because edge functions can hit 
    // payload limits handling large binary audio streams. Doing direct proxy.

    // Call ElevenLabs API
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Default Rachel

    if (!apiKey) {
      return NextResponse.json(
        { error: "TTS not configured" },
        { status: 503 }
      );
    }

    // Truncate text to ~5000 chars for TTS
    const truncatedText = text.slice(0, 5000);

    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: truncatedText,
          model_id: "eleven_turbo_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    // Auto-fallback for Free Tier limitations on custom/library voices
    let activeResponse = ttsResponse;
    if (ttsResponse.status === 402) {
      console.warn("Custom voice requires paid plan. Falling back to default Rachel voice.");
      activeResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: truncatedText,
            model_id: "eleven_turbo_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );
    }

    if (!activeResponse.ok) {
      console.error("ElevenLabs error:", activeResponse.status, await activeResponse.text());
      return NextResponse.json(
        { error: "TTS generation failed" },
        { status: 502 }
      );
    }

    const audioBuffer = await activeResponse.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString("base64");
    
    return NextResponse.json({
      audioUrl: `data:audio/mpeg;base64,${base64}`,
    });
  } catch (err) {
    console.error("TTS route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
