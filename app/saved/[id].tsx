import { Audio } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import OpenAI from "openai";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { CHEFS } from "../../lib/chefs";
import { generateVoice } from "../../lib/generate-voice-fetch";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/firebase/config";

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_KEY,
});

export default function RecipeDetail() {
  const { recipe } = useLocalSearchParams();
  const parsed = JSON.parse(recipe as string);

  // -------------------------
  // TYPE FIX HERE
  // -------------------------
  type BuiltInChefId = keyof typeof CHEFS;
  type CustomChefId = `custom-${string}`;
  type ChefId = BuiltInChefId | CustomChefId;

  const [chefId, setChefId] = useState<ChefId>("gordon");

  const { user } = useAuth();
  const [customChefs, setCustomChefs] = useState<any[]>([]);

  // -------------------------
  // LOAD CUSTOM CHEFS
  // -------------------------
  useEffect(() => {
    if (!user) return;

    const loadChefs = async () => {
      const ref = collection(db, "users", user.uid, "customChefs");
      const snap = await getDocs(ref);
      const out: SetStateAction<any[]> = [];

      snap.forEach((doc) => {
        out.push({ id: doc.id, ...doc.data() });
      });

      setCustomChefs(out);
    };

    loadChefs();
  }, [user]);

  // -------------------------
  // RESOLVE CURRENT CHEF
  // -------------------------
  let chef: any = null;

  if (chefId.startsWith("custom-")) {
    const id = chefId.replace("custom-", "");
    chef = customChefs.find((c) => c.id === id);
  } else {
    chef = CHEFS[chefId as BuiltInChefId];
  }

  const [stepIndex, setStepIndex] = useState(0);

  // Recording state
  const [recording, setRecording] = useState<any>(null);
  const recordingRef = useRef<any>(null);

  // Chef selection modal state
  const [chefModalVisible, setChefModalVisible] = useState(false);

  // -------------------------
  // PLAY CURRENT STEP
  // -------------------------
  const speakStep = async () => {
    try {
      const text = parsed.steps[stepIndex];
      const fileUri = await generateVoice(text, chef.voiceId);

      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      await sound.playAsync();
    } catch (err) {
      console.log("TTS Error:", err);
    }
  };

  // -------------------------
  // START RECORDING
  // -------------------------
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

      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();

      setRecording(rec);
    } catch (err) {
      console.log("Recording error:", err);
    }
  };

  // -------------------------
  // STOP RECORDING
  // -------------------------
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

      if (uri) await processUserVoice(uri);
    } catch (err) {
      console.log("Stop error:", err);
    }
  };

  // -------------------------
  // TRANSCRIBE VIA WHISPER
  // -------------------------
  const transcribeAudio = async (uri: string) => {
    console.log("📝 Transcribing with Whisper...");

    const formData: any = new FormData();
    formData.append("file", {
      uri,
      name: "audio.m4a",
      type: "audio/m4a",
    });
    formData.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_KEY}` },
      body: formData,
    });

    const data = await response.json();
    console.log("📝 Whisper text:", data.text);

    return data.text ?? "";
  };

  // -------------------------
  // GPT REPLY IN CHEF STYLE
  // -------------------------
  const getChefReply = async (userText: string) => {
    const systemPrompt = `
${chef.prompt}

Recipe Title: ${parsed.title}
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

    return resp.choices[0].message.content;
  };

  // -------------------------
  // SPEAK AS CHEF (Fish TTS)
  // -------------------------
  const speakAsChef = async (text: string) => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    const fileUri = await generateVoice(text, chef.voiceId);

    const { sound } = await Audio.Sound.createAsync(
      { uri: fileUri },
      { shouldPlay: true, volume: 1.0 }
    );

    await sound.playAsync();
  };

  // -------------------------
  // FULL PIPELINE
  // -------------------------
  const processUserVoice = async (uri: string) => {
    const userText = await transcribeAudio(uri);
    const chefReply = await getChefReply(userText);

    if (!chefReply) {
      console.log("⚠️ Chef reply was empty.");
      return;
    }

    await speakAsChef(chefReply);
  };

  // -------------------------
  // GET CHEF IMAGE
  // -------------------------
  const getChefImage = () => {
    if (!chef) return null;
    if (chef.image) {
      // Built-in chef with require() image
      return chef.image;
    }
    // Custom chef might have image URL (for now return null as user mentioned)
    return null;
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: "#d4e0ed" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={{ flex: 1 }}>
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Back Button and Chef Selector */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: 10 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ fontSize: 18, color: "#4a90e2", fontWeight: "600" }}>← Back</Text>
            </TouchableOpacity>

            {/* Chef Selector Button - Top Right */}
            <TouchableOpacity
              onPress={() => setChefModalVisible(true)}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: "#f5f8fa",
                borderWidth: 2,
                borderColor: "#4a90e2",
                overflow: "hidden",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {chef && getChefImage() ? (
                <Image
                  source={getChefImage()}
                  style={{ width: "100%", height: "100%", borderRadius: 25 }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: "#ddd",
                }} />
              )}
            </TouchableOpacity>
          </View>

          {/* Recipe Title */}
          <Text style={{ fontSize: 32, fontWeight: "700", marginBottom: 10, color: "#000" }}>
            {parsed.title}
          </Text>

          {/* Description */}
          <Text style={{ marginTop: 10, fontSize: 18, color: "#444", marginBottom: 20 }}>
            {parsed.description}
          </Text>

          {/* Ingredients Section */}
          <View style={{
            backgroundColor: "#f5f8fa",
            padding: 20,
            borderRadius: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#e0e0e0",
          }}>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12, color: "#000" }}>
              Ingredients
            </Text>
            {parsed.ingredients.map((i: string, idx: number) => (
              <Text key={idx} style={{ marginTop: 6, fontSize: 16, color: "#444" }}>
                • {i}
              </Text>
            ))}
          </View>

          {/* Current Step Section */}
          <View style={{
            backgroundColor: "#f5f8fa",
            padding: 20,
            borderRadius: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#e0e0e0",
          }}>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 8, color: "#000" }}>
              Step {stepIndex + 1} of {parsed.steps.length}
            </Text>
            <Text style={{ marginTop: 10, fontSize: 18, color: "#444", lineHeight: 26 }}>
              {parsed.steps[stepIndex]}
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Control Buttons - Fixed at Bottom */}
        <View style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#d4e0ed",
          paddingVertical: 20,
          paddingHorizontal: 24,
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
        }}>
          {/* Previous Step Button */}
          <TouchableOpacity
            disabled={stepIndex === 0}
            onPress={() => setStepIndex(stepIndex - 1)}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: stepIndex === 0 ? "#ccc" : "#f5f8fa",
              borderWidth: 2,
              borderColor: stepIndex === 0 ? "#999" : "#4a90e2",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: stepIndex === 0 ? "#999" : "#4a90e2", fontSize: 20, fontWeight: "600" }}>←</Text>
          </TouchableOpacity>

          {/* Play Step Button */}
          <TouchableOpacity
            onPress={speakStep}
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: "#4a90e2",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 24 }}>▶</Text>
          </TouchableOpacity>

          {/* Hold to Talk Button */}
          <TouchableOpacity
            onPressIn={startRecording}
            onPressOut={stopRecording}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: recording ? "#d9534f" : "#f5f8fa",
              borderWidth: 2,
              borderColor: recording ? "#b71c1c" : "#4a90e2",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: recording ? "#fff" : "#4a90e2",
            }} />
          </TouchableOpacity>

          {/* Next Step Button */}
          <TouchableOpacity
            disabled={stepIndex === parsed.steps.length - 1}
            onPress={() => setStepIndex(stepIndex + 1)}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: stepIndex === parsed.steps.length - 1 ? "#ccc" : "#f5f8fa",
              borderWidth: 2,
              borderColor: stepIndex === parsed.steps.length - 1 ? "#999" : "#4a90e2",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: stepIndex === parsed.steps.length - 1 ? "#999" : "#4a90e2", fontSize: 20, fontWeight: "600" }}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Chef Selection Modal */}
        <Modal
          visible={chefModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setChefModalVisible(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "flex-end",
            }}
            activeOpacity={1}
            onPress={() => setChefModalVisible(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#f5f8fa",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                height: "60%",
                padding: 24,
              }}
            >
              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setChefModalVisible(false)}
                style={{ alignSelf: "flex-end", marginBottom: 20 }}
              >
                <Text style={{ fontSize: 24, color: "#4a90e2", fontWeight: "600" }}>×</Text>
              </TouchableOpacity>

              {/* Current Chef Display */}
              {chef && (
                <View style={{ alignItems: "center", marginBottom: 30 }}>
                  {getChefImage() ? (
                    <Image
                      source={getChefImage()}
                      style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 12 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: "#ddd",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 12,
                    }}>
                      <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: "#ccc",
                      }} />
                    </View>
                  )}
                  <Text style={{ fontSize: 24, fontWeight: "700", color: "#000" }}>
                    {chef.name}
                  </Text>
                </View>
              )}

              {/* Chef List */}
              <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#000" }}>
                Select a Chef
              </Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Built-in Chefs */}
                {Object.entries(CHEFS).map(([id, c]) => {
                  const isSelected = chefId === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() => {
                        setChefId(id as BuiltInChefId);
                        setChefModalVisible(false);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 16,
                        backgroundColor: isSelected ? "#e3f2fd" : "#fff",
                        borderRadius: 12,
                        marginBottom: 12,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? "#4a90e2" : "#e0e0e0",
                      }}
                    >
                      {c.image ? (
                        <Image
                          source={c.image}
                          style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          backgroundColor: "#ddd",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 12,
                        }}>
                          <View style={{
                            width: 30,
                            height: 30,
                            borderRadius: 15,
                            backgroundColor: "#aaa",
                          }} />
                        </View>
                      )}
                      <Text style={{
                        fontSize: 18,
                        fontWeight: isSelected ? "700" : "600",
                        color: isSelected ? "#4a90e2" : "#000",
                      }}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Custom Chefs */}
                {customChefs.map((c) => {
                  const isSelected = chefId === `custom-${c.id}`;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => {
                        setChefId(`custom-${c.id}` as CustomChefId);
                        setChefModalVisible(false);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 16,
                        backgroundColor: isSelected ? "#e3f2fd" : "#fff",
                        borderRadius: 12,
                        marginBottom: 12,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? "#4a90e2" : "#e0e0e0",
                      }}
                    >
                      <View style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: "#ddd",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}>
                        <View style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: "#aaa",
                        }} />
                      </View>
                      <Text style={{
                        fontSize: 18,
                        fontWeight: isSelected ? "700" : "600",
                        color: isSelected ? "#4a90e2" : "#000",
                      }}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}