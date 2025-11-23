import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { createFishVoiceModel } from "../lib/create-custom-chefs";
import { useAuth } from "../src/context/AuthContext";
import { db } from "../src/firebase/config";

export default function CustomChef() {
  const { user } = useAuth();
  const [chefName, setChefName] = useState("");
  const [chefPrompt, setChefPrompt] = useState(
    "You are a friendly cooking assistant. Keep answers short and very practical."
  );
  const [isRecording, setIsRecording] = useState(false);
  const [sampleUri, setSampleUri] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const recordingRef = useRef<any>(null);

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

  const startRecording = async () => {
    setStatus(null);

    try {
      if (recordingRef.current) {
        console.log("Cleaning up previous recording…");
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    } catch (err) {
      console.log("Cleanup error:", err);
    }

    const perm = await Audio.requestPermissionsAsync();
    if (perm.status !== "granted") {
      setStatus("Microphone permission denied.");
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

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

      const ref = doc(collection(db, "users", user.uid, "customChefs"), modelId);

      await setDoc(ref, {
        name: chefName,
        voiceId: modelId,
        prompt: chefPrompt,
        createdAt: serverTimestamp(),
      });
      setStatus("Custom Chef Created Successfully!");
    } catch (err) {
      console.log("Custom chef create error:", err);
      setStatus("Failed to create chef.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: "#d4e0ed" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            backgroundColor: "#d4e0ed",
            padding: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => router.back()}
        style={{ marginBottom: 20, marginTop: 30 }}
      >
        <Text style={{ fontSize: 18, color: "#4a90e2", fontWeight: "600" }}>← Back</Text>
      </TouchableOpacity>

      {/* Header with Microphone Icon and Title */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 30, marginTop: 10 }}>
        {/* Microphone Icon */}
        <View style={{
          width: 50,
          height: 50,
          marginRight: 12,
          alignItems: "center",
          justifyContent: "center",
        }}>
          <View style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: "#000",
            position: "relative",
          }}>
            {/* Microphone body */}
            <View style={{
              position: "absolute",
              top: 5,
              left: 8,
              width: 14,
              height: 20,
              borderRadius: 7,
              backgroundColor: "#333",
            }} />
            {/* Microphone stand */}
            <View style={{
              position: "absolute",
              bottom: -5,
              left: 13,
              width: 4,
              height: 8,
              backgroundColor: "#000",
            }} />
            {/* Microphone base */}
            <View style={{
              position: "absolute",
              bottom: -8,
              left: 10,
              width: 10,
              height: 3,
              borderRadius: 2,
              backgroundColor: "#000",
            }} />
            {/* Cable */}
            <View style={{
              position: "absolute",
              bottom: -10,
              left: 14,
              width: 2,
              height: 4,
              backgroundColor: "#000",
            }} />
          </View>
        </View>
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#000" }}>
          Create Custom Chef Voice
        </Text>
      </View>

      {/* Form Card */}
      <View
        style={{
          backgroundColor: "#f5f8fa",
          padding: 24,
          borderRadius: 16,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 8,
          elevation: 3,
          borderWidth: 1,
          borderColor: "#e0e0e0",
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#000" }}>
          Chef Name
        </Text>
        <TextInput
          value={chefName}
          onChangeText={setChefName}
          placeholder="e.g., Grandma, Workout Chef"
          placeholderTextColor="#999"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            backgroundColor: "#fff",
            fontSize: 16,
          }}
        />

        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#000" }}>
          AI Personality Prompt
        </Text>
        <TextInput
          value={chefPrompt}
          onChangeText={setChefPrompt}
          placeholder="Describe how this chef should talk..."
          placeholderTextColor="#999"
          multiline
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            minHeight: 70,
            backgroundColor: "#fff",
            fontSize: 16,
          }}
        />

        {/* Record Button */}
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
          <Text style={{ color: "white", textAlign: "center", fontSize: 16, fontWeight: "600" }}>
            {isRecording ? "Release to stop recording…" : "Hold to record voice sample"}
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
          <Text style={{ color: "white", textAlign: "center", fontSize: 16, fontWeight: "600" }}>
            Upload audio file
          </Text>
        </TouchableOpacity>

        {sampleUri && (
          <Text style={{ color: "#4caf50", marginBottom: 10, fontSize: 14 }}>
            Voice sample recorded
          </Text>
        )}

        {/* Submit */}
        <TouchableOpacity
          disabled={loading}
          onPress={submitCustomChef}
          style={{
            backgroundColor: loading ? "#aaa" : "#4caf50",
            padding: 14,
            borderRadius: 10,
            marginTop: 10,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "600", fontSize: 16 }}>
            {loading ? "Creating Chef…" : "Create Custom Chef"}
          </Text>
        </TouchableOpacity>

        {status && (
          <Text style={{ marginTop: 10, color: "#555", fontSize: 14 }}>{status}</Text>
        )}
      </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

