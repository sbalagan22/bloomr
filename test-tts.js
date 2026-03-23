require('dotenv').config({ path: '.env.local' });

async function test() {
  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: "Hello world this is a test.",
      model_id: "eleven_turbo_v2",
    })
  });
  
  if (!res.ok) {
    console.error("Error:", res.status, await res.text());
  } else {
    console.log("Success! buffer length:", (await res.arrayBuffer()).byteLength);
  }
}
test();
