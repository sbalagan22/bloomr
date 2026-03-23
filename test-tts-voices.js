require('dotenv').config({ path: '.env.local' });

async function test() {
  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  const res = await fetch(`https://api.elevenlabs.io/v1/voices`, {
    headers: { "xi-api-key": apiKey }
  });
  const data = await res.json();
  console.log("Available voices:");
  data.voices.forEach(v => console.log(`- ${v.name} (${v.voice_id}): ${v.category}`));
}
test();
