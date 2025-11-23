import { router } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { db } from "../src/firebase/config";

export default function Settings() {
  const { user, profile, logout } = useAuth();
  const [dietary, setDietary] = useState(profile?.dietary ?? "");
  const [allergies, setAllergies] = useState(profile?.allergies ?? "");
  const [editing, setEditing] = useState(false);

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
        Welcome
      </Text>

      {/* Fruit Basket Illustration */}
      <View style={{ 
        alignItems: "center", 
        marginBottom: 30,
        height: 150,
        justifyContent: "center",
      }}>
        <View style={{
          width: 200,
          height: 120,
          position: "relative",
        }}>
          {/* Basket */}
          <View style={{
            position: "absolute",
            bottom: 0,
            left: 20,
            width: 160,
            height: 80,
            backgroundColor: "#d4a574",
            borderRadius: 8,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}>
            {/* Basket weave pattern */}
            <View style={{
              position: "absolute",
              top: 10,
              left: 10,
              width: 140,
              height: 2,
              backgroundColor: "#b8956a",
            }} />
            <View style={{
              position: "absolute",
              top: 20,
              left: 10,
              width: 140,
              height: 2,
              backgroundColor: "#b8956a",
            }} />
          </View>
          {/* Fruits - simplified representation */}
          {/* Apple */}
          <View style={{
            position: "absolute",
            bottom: 50,
            left: 30,
            width: 25,
            height: 25,
            borderRadius: 12.5,
            backgroundColor: "#ff6b6b",
          }} />
          {/* Grapes */}
          <View style={{
            position: "absolute",
            bottom: 60,
            left: 60,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "#9b59b6",
          }} />
          {/* Banana */}
          <View style={{
            position: "absolute",
            bottom: 70,
            left: 90,
            width: 30,
            height: 15,
            borderRadius: 15,
            backgroundColor: "#f1c40f",
            transform: [{ rotate: "-30deg" }],
          }} />
          {/* Pineapple */}
          <View style={{
            position: "absolute",
            bottom: 65,
            left: 120,
            width: 25,
            height: 30,
            borderRadius: 12,
            backgroundColor: "#f39c12",
          }} />
          {/* Pear */}
          <View style={{
            position: "absolute",
            bottom: 55,
            right: 30,
            width: 22,
            height: 28,
            borderRadius: 11,
            backgroundColor: "#2ecc71",
          }} />
        </View>
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
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
          style={{ marginBottom: 16 }}
        >
          <Text style={{ color: "#d9534f", fontSize: 16, fontWeight: "600" }}>
            Logout
          </Text>
        </TouchableOpacity>

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

        <Text style={{ fontSize: 20, fontWeight: "700", color: "#000", marginTop: 20 }}>
          Settings
        </Text>
      </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}