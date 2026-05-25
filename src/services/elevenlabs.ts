const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export async function synthesizeSpeech(text: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || apiKey.includes("your_elevenlabs_api_key_here") || !voiceId) {
    return null;
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.42,
        similarity_boost: 0.78,
        style: 0.28,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs request failed: ${response.status}`);
  }

  return response.arrayBuffer();
}
