import { router } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/firebase/config";

export default function SavedRecipes() {
  const { user } = useAuth();
  const [saved, setSaved] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadSaved();
  }, [user]);

  const loadSaved = async () => {
    const ref = collection(db, "users", user.uid, "recipes");
    const snap = await getDocs(ref);
    setSaved(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    );
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#d4e0ed" }}>
      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => router.back()}
        style={{ marginBottom: 20, marginTop: 10 }}
      >
        <Text style={{ fontSize: 18, color: "#4a90e2", fontWeight: "600" }}>← Back</Text>
      </TouchableOpacity>

      {/* Header with Title and Star Icon */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, marginTop: 0 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#000", marginRight: 8 }}>
          Saved Recipes
        </Text>
        <View style={{
          width: 24,
          height: 24,
          position: "relative",
        }}>
          {/* Star Icon */}
          <View style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 24,
            height: 24,
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Text style={{ fontSize: 24, color: "#ffa726" }}>⭐</Text>
          </View>
        </View>
      </View>

      <ScrollView>
        {saved.map((r) => (
          <View
            key={r.id}
            style={{
              marginBottom: 20,
              padding: 16,
              backgroundColor: "#f5f8fa",
              borderRadius: 12,
              shadowOpacity: 0.1,
              shadowRadius: 5,
              borderWidth: 1,
              borderColor: "#e0e0e0",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#000", marginBottom: 8 }}>
              {r.title}
            </Text>
            <Text style={{ marginTop: 6, color: "#666", fontSize: 14 }}>{r.description}</Text>

            <TouchableOpacity
              onPress={() => router.push({
                pathname: "/saved/[id]",
                params: { id: r.id, recipe: JSON.stringify(r) },
              })}
              style={{
                marginTop: 12,
                backgroundColor: "#4caf50",
                padding: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
                Cook This Recipe 🍳
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}