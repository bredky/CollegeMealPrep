import { router } from "expo-router";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import OpenAI from "openai"; // expo compatible
import { useState } from "react";
import { Button, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { db } from "../src/firebase/config";

export default function Recipes() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const client = new OpenAI({ apiKey: process.env.EXPO_PUBLIC_OPENAI_KEY });

  const generateRecipes = async () => {
    setLoading(true);
    setRecipes([]);

    const prompt = `
      Generate 5 recipes based on these ingredients: ${input}.
      For each recipe return JSON with:
      {
        "title": "",
        "description": "",
        "ingredients": [],
        "steps": []
      }
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    let content = response?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content returned from OpenAI");
      setRecipes([]);
      setLoading(false);
      return;
    }

    let parsed;
    try {
      parsed = typeof content === "string" ? JSON.parse(content) : content;
    } catch (e) {
      console.log("Bad JSON:", content);
      setRecipes([]);
      setLoading(false);
      return;
    }

    // Normalize ANY format into an array
    let finalRecipes = [];

    if (Array.isArray(parsed.recipes)) {
      finalRecipes = parsed.recipes;
    } else if (Array.isArray(parsed)) {
      finalRecipes = parsed;
    } else if (parsed && typeof parsed === "object") {
      finalRecipes = [parsed];
    }

    setRecipes(finalRecipes);
    setLoading(false);
  };

  const saveRecipe = async (recipe: any) => {
    if (!user) {
      console.log("❌ No user found — cannot save recipe");
      return;
    }

    const id = recipe.title.replace(/\s+/g, "_").toLowerCase();
    const ref = doc(collection(db, "users", user.uid, "recipes"), id);

    console.log("🔍 Attempting to save recipe at path:");
    console.log(`users/${user.uid}/recipes/${id}`);

    try {
      await setDoc(ref, {
        ...recipe,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Recipe saved successfully!");
    } catch (err) {
      console.log("❌ Save failed:", err);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#f7f7f7" }}>
      <Text style={{ fontSize: 26, fontWeight: "700", marginBottom: 10 }}>
        Recipe Chatbot 👩‍🍳
      </Text>

      <TextInput
        placeholder="Enter ingredients…"
        onChangeText={setInput}
        value={input}
        style={{
          padding: 12,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 10,
          backgroundColor: "#fff",
          marginBottom: 10,
        }}
      />

      <Button title="Generate Recipes" onPress={generateRecipes} />
      <View style={{ width: "100%", marginTop: 20 }}>
              <Button
                  title="Saved Recipes"
                  onPress={() => router.push("/saved")}
              />
              </View>
      {loading && <Text style={{ marginTop: 20 }}>Generating…</Text>}

      <ScrollView style={{ marginTop: 20 }}>
        {recipes.map((recipe, index) => (
          <View
            key={index}
            style={{
              backgroundColor: "white",
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700" }}>
              {recipe.title}
            </Text>

            <Text style={{ marginTop: 4, color: "#555" }}>
              {recipe.description}
            </Text>

            <Text style={{ marginTop: 10, fontWeight: "600" }}>Ingredients:</Text>
            {recipe.ingredients.map((i: string, idx: number) => (
              <Text key={idx} style={{ color: "#444" }}>
                • {i}
              </Text>
            ))}

            <Text style={{ marginTop: 10, fontWeight: "600" }}>Steps:</Text>
            {recipe.steps.map((s: string, idx: number) => (
              <Text key={idx} style={{ color: "#444" }}>
                {idx + 1}. {s}
              </Text>
            ))}

            {/* SAVE BUTTON */}
            <TouchableOpacity
              onPress={() => saveRecipe(recipe)}
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: "#4caf50",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "white", fontWeight: "700", textAlign: "center" }}>
                Save Recipe ⭐
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}