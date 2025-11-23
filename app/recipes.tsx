import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
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
  const [dishGoal, setDishGoal] = useState("");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false); //added for CameraPopup.jsx
  const [photoUri, setPhotoUri] = useState<string | null>(null);//added for CameraPopup.jsx

  const client = new OpenAI({ apiKey: process.env.EXPO_PUBLIC_OPENAI_KEY });
  const analyzeFromPhoto = async () => {
  if (!photoUri) return;

  try {
    setLoading(true);
    console.log("📸 Analyzing image:", photoUri);

    // Convert to base64
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: "base64",
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Identify the food ingredients visible in this photo. 
Return ONLY JSON:
{
  "ingredients": ["item1", "item2", ...]
}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const raw = response.choices?.[0]?.message?.content;

    if (!raw || typeof raw !== "string") {
    console.error("❌ Invalid response:", raw);
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("❌ Error parsing:", raw);
    return;
  }

    const ingredients = parsed.ingredients || [];
    console.log("🧺 Detected ingredients:", ingredients);

    // ⚡ update your input box automatically
    setInput(ingredients.join(", "));

  } catch (err) {
    console.error("❌ Vision analysis failed", err);
  }

  setLoading(false);
};

const goToRecipe = (recipe: { title: string; }) => {
  const id = recipe.title.replace(/\s+/g, "_").toLowerCase();
  router.push({
  pathname: "/saved/[id]",
  params: {
    id: recipe.title.replace(/\s+/g, "_").toLowerCase(),
    recipe: JSON.stringify(recipe),
  },
});

};
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
You are a world-class chef. You must create 5 recipes using ONLY these ingredients:

${input}

User request (may be empty):
${dishGoal || "None"}

Your job:
- try and use the ingredients provided, u dont have to use all of them, you can add a few extras only if needed
- If a user request is provided, shape the recipes around that theme
- If no request is provided, just create the best and realistic recipes.
- Don't get too creative, the recipes must be plausible and actually cookable.

Return JSON in exactly this format:
{
  "recipes": [
    {
      "title": "",
      "description": "",
      "ingredients": [],
      "steps": []
    }
  ]
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

        <TouchableOpacity
          onPress={analyzeFromPhoto}
          style={{
            backgroundColor: "#4CAF50",
            padding: 10,
            borderRadius: 8,
            marginTop: 10
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>
            ✔️ Use This Photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setPhotoUri(null)}>
          <Text style={{ color: "#f44336", marginTop: 8 }}>Remove Photo</Text>
        </TouchableOpacity>
      </View>
    )}


      <TextInput
  placeholder="Ingredients (auto from photo)…"
  value={input}
  onChangeText={setInput}
/>
     <TextInput
  placeholder="What kind of dish are you thinking of? (optional)"
  value={dishGoal}
  onChangeText={setDishGoal}
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
            <TouchableOpacity
              onPress={() => goToRecipe(recipe)}
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: "#0277BD",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "white", fontWeight: "700", textAlign: "center" }}>
                Cook This 🍳
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