import { router } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
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
