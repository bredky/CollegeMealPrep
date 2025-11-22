"use client";

import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";

const FISH_API_KEY = "bdde826fdc2b4731905432351b021321";
const GORDON_MODEL_ID = "e605a2a42b0a44ccb7af2e42e1676c92";

export async function generateVoice(text, outputFileName = "gordon_voice.mp3") {
  console.log("🟦 [generateVoice] Called with text:", text);

  try {
    console.log("🟦 Sending request to Fish API...");

    const response = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FISH_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        reference_id: GORDON_MODEL_ID,
        format: "mp3",
      }),
    });

    console.log("🟩 Response status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.log("❌ API ERROR:", errText);
      throw new Error("API error");
    }

    console.log("🟦 Converting response to ArrayBuffer...");
    const arrayBuffer = await response.arrayBuffer();
    console.log("🟩 arrayBuffer length:", arrayBuffer.byteLength);

    // Convert to base64
    console.log("🟦 Converting ArrayBuffer → base64...");
    const base64Data = Buffer.from(new Uint8Array(arrayBuffer)).toString("base64");

    // Save using legacy API (works in Expo Go)
    console.log("🟦 Writing base64 file using LEGACY API...");
    const fileUri = `${FileSystem.cacheDirectory}${outputFileName}`;

    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log("🟩 File saved:", fileUri);
    return fileUri;

  } catch (err) {
    console.log("❌ [generateVoice] ERROR:", err);
    throw err;
  }
}