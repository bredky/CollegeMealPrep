import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import React, { useRef, useState } from "react";
import { Button, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { createFishVoiceModel } from "../lib/create-custom-chefs";
import { useAuth } from "../src/context/AuthContext";
import { db } from "../src/firebase/config";

export default function Settings() {
  const { user, profile, logout } = useAuth();
const [chefName, setChefName] = useState("");
const [chefPrompt, setChefPrompt] = useState(
  "You are a friendly cooking assistant. Keep answers short and very practical."
);
const [isRecording, setIsRecording] = useState(false);
const [sampleUri, setSampleUri] = useState<string | null>(null);
const [status, setStatus] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const recordingRef = useRef<any>(null);
  const [dietary, setDietary] = useState(profile?.dietary ?? "");
  const [allergies, setAllergies] = useState(profile?.allergies ?? "");
  const [editing, setEditing] = useState(false);
  
const pickAudioFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["audio/*", "audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) {
      setStatus("File selection canceled.");
      return;
    }

    const file = result.assets?.[0];
    if (!file) {
      setStatus("Failed to load file.");
      return;
    }

    setSampleUri(file.uri);
    setStatus(`Selected file: ${file.name}`);
  } catch (err) {
    console.log("File picker error:", err);
    setStatus("Could not pick audio file.");
  }
};
  const savePreferences = async () => {
    if (!user) return;
    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, { dietary, allergies });
      setEditing(false);
    } catch (err) {
      console.log("Failed to update preferences:", err);
    }
  };
  // 🎤 Start recording
const startRecording = async () => {
  setStatus(null);

  // 1️⃣ Make sure no previous recording is active
  try {
    if (recordingRef.current) {
      console.log("Cleaning up previous recording…");
      await recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
  } catch (err) {
    console.log("Cleanup error:", err);
  }

  // 2️⃣ Request mic permissions
  const perm = await Audio.requestPermissionsAsync();
  if (perm.status !== "granted") {
    setStatus("Microphone permission denied.");
    return;
  }

  // 3️⃣ Set audio mode
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  // 4️⃣ Create a NEW recording
  const rec = new Audio.Recording();
  recordingRef.current = rec;

  try {
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    setIsRecording(true);
  } catch (err) {
    console.log("Recording start error:", err);
    setStatus("Failed to start recording");
  }
};

// 🛑 Stop recording
const stopRecording = async () => {
  setIsRecording(false);

  try {
    const rec = recordingRef.current;
    if (!rec) return;

    await rec.stopAndUnloadAsync();
    const uri = rec.getURI();
    setSampleUri(uri);
    setStatus("Voice sample recorded!");
  } catch (err) {
    setStatus("Failed to stop recording");
  }
};

const submitCustomChef = async () => {
  if (!chefName.trim()) {
    setStatus("Enter a chef name.");
    return;
  }
  if (!sampleUri) {
    setStatus("Record a voice sample first.");
    return;
  }
  if (!user) return;

  try {
    setLoading(true);
    setStatus("Uploading to Fish Audio…");

    // FIXED
    const fishResponse = await createFishVoiceModel(chefName, sampleUri, {
      description: `Custom chef model: ${chefName}`,
      visibility: "private",
      enhanceAudioQuality: true,
    });

    const modelId = fishResponse.modelId;

    if (!modelId) {
      setStatus("Fish API did not return a model ID.");
      return;
    }

    setStatus("Saving to Firebase…");

    // 2. Save custom chef in Firestore
    const ref = doc(collection(db, "users", user.uid, "customChefs"), modelId);

    await setDoc(ref, {
      name: chefName,
      voiceId: modelId,
      prompt: chefPrompt,
      createdAt: serverTimestamp(),
    });
    setStatus("🎉 Custom Chef Created Successfully!");
    } catch (err) {
        console.log("Custom chef create error:", err);
        setStatus("Failed to create chef.");
    } finally {
        setLoading(false);
    }
    };
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: "#f7f7f7",
        padding: 24,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: "100%",
          padding: 24,
          borderRadius: 16,
          backgroundColor: "white",
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
          elevation: 5,
          marginBottom: 30,
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 16, textAlign: "center" }}>
          Settings ⚙️
        </Text>

        {/* Dietary Preferences */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>Dietary Preferences:</Text>
          {editing ? (
            <TextInput
              value={dietary}
              onChangeText={setDietary}
              placeholder="e.g., Vegetarian, Keto"
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 8,
                marginTop: 4,
              }}
            />
          ) : (
            <Text style={{ fontSize: 16, color: "#555" }}>{dietary || "—"}</Text>
          )}
        </View>

        {/* Allergies */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>Allergies:</Text>
          {editing ? (
            <TextInput
              value={allergies}
              onChangeText={setAllergies}
              placeholder="e.g., Peanuts, Gluten"
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 8,
                marginTop: 4,
              }}
            />
          ) : (
            <Text style={{ fontSize: 16, color: "#555" }}>{allergies || "—"}</Text>
          )}
        </View>

        {editing ? (
          <Button title="Save Preferences" onPress={savePreferences} />
        ) : (
          <Button title="Edit Preferences" onPress={() => setEditing(true)} />
        )}
      </View>
    {/* -------------------------------------------- */}
{/* CUSTOM CHEF SECTION */}
{/* -------------------------------------------- */}
<View
  style={{
    width: "100%",
    padding: 24,
    borderRadius: 16,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 30,
    marginTop: 20
  }}
>
  <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
    🎙️ Create Custom Chef Voice
  </Text>

  <Text style={{ fontSize: 16, fontWeight: "600" }}>Chef Name</Text>
  <TextInput
    value={chefName}
    onChangeText={setChefName}
    placeholder="e.g., Grandma, Workout Chef"
    style={{
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 8,
      padding: 8,
      marginTop: 4,
      marginBottom: 16,
    }}
  />

  <Text style={{ fontSize: 16, fontWeight: "600" }}>AI Personality Prompt</Text>
  <TextInput
    value={chefPrompt}
    onChangeText={setChefPrompt}
    placeholder="Describe how this chef should talk..."
    multiline
    style={{
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 8,
      padding: 8,
      marginTop: 4,
      minHeight: 70,
      marginBottom: 16,
    }}
  />

  {/* RECORD BUTTON */}
  <TouchableOpacity
    onPressIn={startRecording}
    onPressOut={stopRecording}
    style={{
      backgroundColor: isRecording ? "#b71c1c" : "#e53935",
      padding: 14,
      borderRadius: 40,
      marginBottom: 10,
    }}
  >
    <Text style={{ color: "white", textAlign: "center", fontSize: 16 }}>
      {isRecording ? "Release to stop recording…" : "🎤 Hold to record voice sample"}
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
  onPress={pickAudioFile}
  style={{
    backgroundColor: "#6a1b9a",
    padding: 14,
    borderRadius: 40,
    marginBottom: 10,
  }}
>
  <Text style={{ color: "white", textAlign: "center", fontSize: 16 }}>
    📁 Upload audio file
  </Text>
</TouchableOpacity>

  {sampleUri && (
    <Text style={{ color: "#4caf50", marginBottom: 10 }}>
      Voice sample recorded ✔
    </Text>
  )}

  {/* SUBMIT */}
  <TouchableOpacity
    disabled={loading}
    onPress={submitCustomChef}
    style={{
      backgroundColor: loading ? "#aaa" : "#4caf50",
      padding: 14,
      borderRadius: 10,
    }}
  >
    <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
      {loading ? "Creating Chef…" : "Create Custom Chef"}
    </Text>
  </TouchableOpacity>

  {status && (
    <Text style={{ marginTop: 10, color: "#555" }}>{status}</Text>
  )}
</View>
      {/* Logout */}
      <View style={{ width: "100%" }}>
        <Button
          title="Logout"
          color="#d9534f"
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
        />
      </View>

      {/* Navigate to Recipes */}
      <View style={{ width: "100%", marginTop: 20 }}>
        <Button title="Go to Recipes 🍲" onPress={() => router.push("/recipes")} />
      </View>
    </ScrollView>
  );
}