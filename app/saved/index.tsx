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
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: "700", marginBottom: 20 }}>
        Saved Recipes ⭐
      </Text>

      <ScrollView>
        {saved.map((r) => (
          <View
            key={r.id}
            style={{
              marginBottom: 20,
              padding: 16,
              backgroundColor: "white",
              borderRadius: 12,
              shadowOpacity: 0.1,
              shadowRadius: 5,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700" }}>{r.title}</Text>
            <Text style={{ marginTop: 6 }}>{r.description}</Text>

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