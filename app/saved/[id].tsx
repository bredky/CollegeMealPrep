import { Audio } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import OpenAI from "openai";
import { useRef, useState } from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { generateVoice } from "../../lib/generate-voice-fetch";

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_KEY,
});

export default function RecipeDetail() {
  const { recipe } = useLocalSearchParams();
  const parsed = JSON.parse(recipe as string);

  const [stepIndex, setStepIndex] = useState(0);

  // Recording state
  const [recording, setRecording] = useState<any>(null);
  const recordingRef = useRef<any>(null);

  // ---------------------------------------
  // PLAY CURRENT STEP (your existing code)
  // ---------------------------------------
  const speakStep = async () => {
    try {
      const text = parsed.steps[stepIndex];
      const fileUri = await generateVoice(text);
      
      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      await sound.playAsync();
    } catch (err) {
      console.log("TTS Error:", err);
    }
  };

  // ---------------------------------------
  // 1. START RECORDING (press & hold)
  // ---------------------------------------
  const startRecording = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    try {
      console.log("🎤 Starting recording...");

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission denied.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      recordingRef.current = rec;

      await rec.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await rec.startAsync();

      setRecording(rec);
    } catch (err) {
      console.log("Recording error:", err);
    }
  };

  // ---------------------------------------
  // 2. STOP RECORDING (on release)
  // ---------------------------------------
  const stopRecording = async () => {
    console.log("🛑 Stopping recording...");
    try {
      const rec = recordingRef.current;
      if (!rec) return;

      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        });
      const uri = rec.getURI();

      setRecording(null);
      console.log("🎤 File saved to:", uri);

      if (uri) {
        await processUserVoice(uri);
      }
    } catch (err) {
      console.log("Stop error:", err);
    }
  };

  // ---------------------------------------
  // 3. Transcribe via Whisper
  // ---------------------------------------
    const transcribeAudio = async (uri: string) => {
    console.log("📝 Transcribing with Whisper...");

    const formData: any = new FormData();
    formData.append("file", {
        uri,
        name: "audio.m4a",
        type: "audio/m4a",
    });
    formData.append("model", "whisper-1");

    const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_KEY}`,
        },
        body: formData,
        }
    );

    const data = await response.json();
    console.log("📝 Whisper text:", data.text);

    return data.text ?? "";
    };

  // ---------------------------------------
  // 4. Ask GPT as Gordon Ramsay
  // ---------------------------------------
  const getGordonReply = async (userText: string) => {
    console.log(" Asking Gordon:", userText);

    const systemPrompt = `
You are Gordon Ramsay. 
You MUST respond in Gordon Ramsay's tone:
- direct
- helpful
- a bit insulting but not abusive
- short (1–3 sentences)
- extremely clear cooking guidance

Recipe Title: ${parsed.title}
Recipe Description: ${parsed.description}
Current Step (${stepIndex + 1}): ${parsed.steps[stepIndex]}

Full Steps:
${parsed.steps.join("\n")}
`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
    });

    const answer = resp.choices[0].message.content;
    console.log("Gordon says:", answer);
    return answer;
  };

  // ---------------------------------------
  // 5. Speak using Fish TTS Gordon voice
  // ---------------------------------------
    const speakAsGordon = async (text: string) => {
    await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    });

    const fileUri = await generateVoice(text);
    const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true, volume: 1.0 }
    );

    await sound.playAsync();
    };

  // ---------------------------------------
  // FULL PIPELINE: record → whisper → gpt → tts
  // ---------------------------------------
  const processUserVoice = async (uri: string) => {
    const userText = await transcribeAudio(uri);
    const gordonReply = await getGordonReply(userText);

    // safety fallback
    if (!gordonReply) {
    console.log("⚠️ Gordon reply was empty.");
    return;
}

await speakAsGordon(gordonReply);
  };

  // ---------------------------------------
  // UI
  // ---------------------------------------
  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ fontSize: 16, color: "#555" }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 30, fontWeight: "800", marginTop: 10 }}>
        {parsed.title}
      </Text>

      <Text style={{ marginTop: 10, fontSize: 18, color: "#444" }}>
        {parsed.description}
      </Text>

      <Text style={{ marginTop: 20, fontSize: 20, fontWeight: "700" }}>
        Ingredients
      </Text>

      {parsed.ingredients.map((i: string, idx: number) => (
        <Text key={idx} style={{ marginTop: 4, fontSize: 16 }}>
          • {i}
        </Text>
      ))}

      {/* -------- CURRENT STEP -------- */}
      <Text style={{ marginTop: 30, fontSize: 20, fontWeight: "700" }}>
        Step {stepIndex + 1} of {parsed.steps.length}
      </Text>

      <Text style={{ marginTop: 10, fontSize: 18 }}>
        {parsed.steps[stepIndex]}
      </Text>

      {/* Play Step Button */}
      <TouchableOpacity
        onPress={speakStep}
        style={{
          marginTop: 20,
          backgroundColor: "#2196f3",
          padding: 14,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
          ▶️ Play This Step
        </Text>
      </TouchableOpacity>

      {/* Gordon AI Button */}
      <TouchableOpacity
        onPressIn={startRecording}
        onPressOut={stopRecording}
        style={{
          marginTop: 20,
          backgroundColor: recording ? "#b71c1c" : "#e53935",
          padding: 18,
          borderRadius: 50,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
          🎤 Hold to Ask Gordon
        </Text>
      </TouchableOpacity>

      {/* Navigation */}
      <View style={{ flexDirection: "row", marginTop: 20, gap: 10 }}>
        <TouchableOpacity
          disabled={stepIndex === 0}
          onPress={() => setStepIndex(stepIndex - 1)}
          style={{
            flex: 1,
            backgroundColor: stepIndex === 0 ? "#ccc" : "#9e9e9e",
            padding: 14,
            borderRadius: 10,
          }}
        >
          <Text style={{ textAlign: "center", color: "white", fontWeight: "600" }}>
            ⬅ Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={stepIndex === parsed.steps.length - 1}
          onPress={() => setStepIndex(stepIndex + 1)}
          style={{
            flex: 1,
            backgroundColor:
              stepIndex === parsed.steps.length - 1 ? "#ccc" : "#4caf50",
            padding: 14,
            borderRadius: 10,
          }}
        >
          <Text style={{ textAlign: "center", color: "white", fontWeight: "600" }}>
            Next ➡
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}