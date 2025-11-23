import { router } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { db } from "../src/firebase/config";

export default function Settings() {
  const { user, profile, logout } = useAuth();
  const [dietary, setDietary] = useState("");
  const [allergies, setAllergies] = useState("");
  const [editing, setEditing] = useState(false);

  // Update state when profile changes
  useEffect(() => {
    if (profile) {
      setDietary(profile.dietary || "");
      setAllergies(profile.allergies || "");
    }
  }, [profile]);

  const savePreferences = async () => {
    if (!user) return;
    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, { 
        dietary: dietary.trim(), 
        allergies: allergies.trim() 
      });
      setEditing(false);
    } catch (err) {
      console.log("Failed to update preferences:", err);
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
      {/* Welcome Title */}
      <Text style={{ 
        fontSize: 32, 
        fontWeight: "700", 
        textAlign: "center", 
        marginTop: 20, 
        marginBottom: 20,
        color: "#000",
      }}>
        Welcome {profile?.name || user?.email?.split("@")[0] || "User"}
      </Text>

      {/* Fruit Bowl Image */}
      <View style={{ 
        alignItems: "center", 
        marginBottom: 30,
        justifyContent: "center",
      }}>
        <Image
          source={require("../assets/images/fruitbowl.png")}
          style={{
            width: 200,
            height: 150,
            resizeMode: "contain",
          }}
        />
      </View>

      {/* Profile Card */}
      <View
        style={{
          backgroundColor: "#f5f8fa",
          padding: 24,
          borderRadius: 16,
          marginBottom: 20,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 8,
          elevation: 3,
          borderWidth: 1,
          borderColor: "#e0e0e0",
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 20, color: "#000" }}>
          Profile
        </Text>

        {/* Dietary Preferences */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 4, color: "#000" }}>
            Dietary Preferences:
          </Text>
          {editing ? (
            <TextInput
              value={dietary}
              onChangeText={setDietary}
              placeholder="e.g., Vegetarian, Keto"
              placeholderTextColor="#999"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                padding: 10,
                marginTop: 4,
                backgroundColor: "#fff",
                fontSize: 16,
              }}
            />
          ) : (
            <Text style={{ fontSize: 16, color: "#999" }}>{dietary || "—"}</Text>
          )}
        </View>

        {/* Allergies */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 4, color: "#000" }}>
            Allergies:
          </Text>
          {editing ? (
            <TextInput
              value={allergies}
              onChangeText={setAllergies}
              placeholder="e.g., Peanuts, Gluten"
              placeholderTextColor="#999"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                padding: 10,
                marginTop: 4,
                backgroundColor: "#fff",
                fontSize: 16,
              }}
            />
          ) : (
            <Text style={{ fontSize: 16, color: "#999" }}>{allergies || "—"}</Text>
          )}
        </View>

        {editing ? (
          <TouchableOpacity
            onPress={savePreferences}
            style={{
              backgroundColor: "#4a90e2",
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Save Preferences
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setEditing(true)}
            style={{
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#4a90e2", fontSize: 16, fontWeight: "600" }}>
              Edit Preferences
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Links Section */}
      <View style={{ width: "100%", alignItems: "center" }}>
        <TouchableOpacity
          onPress={() => router.push("/recipes")}
          style={{ marginBottom: 16, flexDirection: "row", alignItems: "center" }}
        >
          <Text style={{ color: "#4a90e2", fontSize: 16, fontWeight: "600" }}>
            Build Your Recipe
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/custom-chef")}
          style={{ marginBottom: 20 }}
        >
          <Text style={{ color: "#4a90e2", fontSize: 16, fontWeight: "600" }}>
            Build Your Custom Chef
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 20, fontWeight: "700", color: "#000", marginTop: 20, marginBottom: 20 }}>
          Preferences
        </Text>

        <TouchableOpacity
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: "#d9534f", fontSize: 16, fontWeight: "600" }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}