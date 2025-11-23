import { Audio } from "expo-av";
import { router } from "expo-router";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import OpenAI from "openai"; // expo compatible
import { useState } from "react";
import { Button, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { generateVoice } from "../lib/generate-voice-fetch";
import { useAuth } from "../src/context/AuthContext";
import { db } from "../src/firebase/config";
import CameraPopup from "./CameraPopup"; //added for CameraPopup.jsx


export default function Recipes() {
  
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false); //added for CameraPopup.jsx
  const [photoUri, setPhotoUri] = useState<string | null>(null);//added for CameraPopup.jsx

  const client = new OpenAI({ apiKey: process.env.EXPO_PUBLIC_OPENAI_KEY });

  //added for CameraPopup.jsx (handler)
  const handlePhotoTaken = (uri?: string) => {
    if (uri) {
      setPhotoUri(uri);
      console.log("Photo captured:", uri);
      // You could use this photo to:
      // - Analyze ingredients with GPT-4 Vision
      // - Store it with a recipe
      // - Upload to Firebase Storage
    }
    setCameraVisible(false);
  };

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

    // ★ Add image to each recipe ★
    const recipesWithImages = await Promise.all(
      finalRecipes.map(async (r: { title: string | number | boolean; }) => ({
        ...r,
        image: await fetchImageForRecipe(r.title),
      }))
    );

    setRecipes(recipesWithImages);
    setLoading(false);
      };

    async function fetchImageForRecipe(title: string | number | boolean) {
      const query = encodeURIComponent(title);
      const apiKey = process.env.EXPO_PUBLIC_SPOON_KEY;

      console.log("🔍 Using Spoonacular key:", apiKey); 
      console.log("🔍 Fetching image for:", title);

      const url = `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=1&apiKey=${apiKey}`;

      console.log("🌐 Spoonacular URL:", url);

      try {
        const res = await fetch(url);
        const data = await res.json();

        console.log("📦 Spoonacular Response:", data);

        if (data?.results?.length > 0) {
          console.log("📸 Found image:", data.results[0].image);
          return data.results[0].image;
        }

        console.warn("⚠️ No results found for:", title);
        return null;
      } catch (err) {
        console.error("❌ Image fetch error:", err);
        return null;
      }
    }
    const handleGenerate = async () => {
    try {
      const fileUri = await generateVoice("This dish is DISGUSTING!");
      console.log("Playing:", fileUri);

      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      await sound.playAsync();

    } catch (err) {
      console.log("Audio error:", err);
    }
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

      {/* //added for CameraPopup.jsx ← ADD CAMERA BUTTON HERE (Above text input) */}
      <TouchableOpacity
        onPress={() => setCameraVisible(true)}
        style={{
          backgroundColor: "#FF6B6B",
          padding: 12,
          borderRadius: 10,
          marginBottom: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>
          📷 Take Photo of Ingredients
        </Text>
      </TouchableOpacity>

      {/* Show captured photo if exists */}
      {photoUri && (
        <View style={{ marginBottom: 10, alignItems: "center" }}>
          <Image 
            source={{ uri: photoUri }} 
            style={{ width: 150, height: 150, borderRadius: 10 }} 
          />
          <TouchableOpacity onPress={() => setPhotoUri(null)}>
            <Text style={{ color: "#f44336", marginTop: 5 }}>Remove Photo</Text>
          </TouchableOpacity>
        </View>
      )}

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

    <Button title="Generate Gordon" onPress={handleGenerate} />
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

            {recipe.image && (
            <Image
              source={{ uri: recipe.image }}
              style={{
                width: "100%",
                height: 180,
                borderRadius: 10,
                marginTop: 10,
              }}
              resizeMode="cover"
            />
          )}
          

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
      {/* /added for CameraPopup.jsx ← ADD CAMERA POPUP AT THE END */}
      <CameraPopup visible={cameraVisible} onClose={handlePhotoTaken} />
    </View>
  );
}