// lib/create-custom-chef.ts
const FISH_API_KEY = process.env.EXPO_PUBLIC_FISH_API_KEY ?? "YOUR_API_KEY";

export async function createFishVoiceModel(
  title: string,
  audioUri: string,
  options?: {
    description?: string;
    visibility?: "private" | "public" | "unlist";
    enhanceAudioQuality?: boolean;
  }
) {
  const visibility = options?.visibility ?? "private";
  const description = options?.description ?? "";
  const enhanceAudioQuality =
    options?.enhanceAudioQuality !== undefined
      ? String(options.enhanceAudioQuality)
      : "true";

  // ----------------------------------------
  // Build multipart form-data
  // ----------------------------------------
  const formData = new FormData();

  // Voice sample (required)
  formData.append(
    "voices",
    {
      uri: audioUri,
      name: "sample.m4a",
      type: "audio/m4a",
    } as any
  );

  // Required fields
  formData.append("title", title);
  formData.append("type", "tts");
  formData.append("train_mode", "fast");

  // Optional fields
  formData.append("visibility", visibility);
  formData.append("description", description);
  formData.append("enhance_audio_quality", enhanceAudioQuality);

  // ----------------------------------------
  // Send to Fish Audio API
  // ----------------------------------------
  const response = await fetch("https://api.fish.audio/model", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FISH_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    console.log("❌ Fish model error:", err);
    throw new Error("Failed to create voice model");
  }

  // Parse Fish Audio response JSON
  const data = await response.json();
  console.log("🎉 Model created:", data);

  // Fish returns "_id", not "id"
  if (!data._id) {
    console.log("❌ Fish API did not return a valid _id field:", data);
    throw new Error("Fish API did not return a model ID");
  }

  // Return in your app's expected format
  return {
    modelId: data._id, // this fixes your Firebase path issue
    raw: data,          // full model payload
  };
}