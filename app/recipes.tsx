import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import OpenAI from "openai"; // expo compatible
import { useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { db } from "../src/firebase/config";
import CameraPopup from "./CameraPopup"; //added for CameraPopup.jsx

export default function Recipes() {
  
  const { user, profile } = useAuth();
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

    const dietaryInfo = profile?.dietary ? `Dietary restrictions: ${profile.dietary}. ` : "";
    const allergyInfo = profile?.allergies ? `Allergies to avoid: ${profile.allergies}. ` : "";
    const dietaryAllergyNote = (dietaryInfo || allergyInfo) ? `\n\nIMPORTANT: ${dietaryInfo}${allergyInfo}All recipes MUST comply with these restrictions and avoid any allergens.` : "";

    const prompt = `
You are a world-class chef. You must create 5 recipes using ONLY these ingredients:

${input}

User request (may be empty):
${dishGoal || "None"}${dietaryAllergyNote}

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
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: "#d4e0ed" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={{ flex: 1 }}>
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          onScrollBeginDrag={Keyboard.dismiss}
        >
      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => router.back()}
        style={{ marginBottom: 20, marginTop: 30 }}
      >
        <Text style={{ fontSize: 18, color: "#4a90e2", fontWeight: "600" }}>← Back</Text>
      </TouchableOpacity>

      {/* Header with Eggs Image and Title */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, marginTop: 0 }}>
        {/* Eggs Image */}
        <View style={{ marginRight: 12 }}>
          <Image
            source={require("../assets/images/eggs.png")}
            style={{
              width: 60,
              height: 50,
              resizeMode: "contain",
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 26, fontWeight: "700", color: "#000" }}>
            Build Your Recipe
          </Text>
          <View style={{ 
            height: 2, 
            backgroundColor: "#000", 
            marginTop: 4,
            width: "100%",
          }} />
        </View>
      </View>

      {/* Upload Photo Button */}
      <TouchableOpacity
        onPress={() => setCameraVisible(true)}
        style={{
          backgroundColor: "#4a90e2",
          padding: 16,
          borderRadius: 12,
          marginBottom: 16,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
          Upload Photo of Ingredients
        </Text>
      </TouchableOpacity>

      {/* Show captured photo if exists */}
      {photoUri && (
        <View style={{ marginBottom: 16, alignItems: "center" }}>
          <Image 
            source={{ uri: photoUri }} 
            style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 12 }} 
          />

          <TouchableOpacity
            onPress={analyzeFromPhoto}
            style={{
              backgroundColor: "#4a90e2",
              padding: 12,
              borderRadius: 10,
              marginBottom: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#fff",
              marginRight: 8,
              justifyContent: "center",
              alignItems: "center",
            }}>
              <View style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#4a90e2",
              }} />
            </View>
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
              Use This Photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setPhotoUri(null)}>
            <Text style={{ color: "#d9534f", marginTop: 8, fontSize: 14, fontWeight: "500" }}>
              Remove Photo
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Generate Recipes and Saved Recipes Buttons */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={generateRecipes}
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: "#f5f8fa",
            padding: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#ddd",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#000", fontWeight: "700", fontSize: 16 }}>
            Generate Recipes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/saved")}
          style={{
            flex: 1,
            backgroundColor: "#f5f8fa",
            padding: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#ddd",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#000", fontWeight: "700", fontSize: 16 }}>
            Saved Recipes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Customize Section */}
      <Text style={{ fontSize: 18, fontWeight: "700", color: "#4a90e2", marginBottom: 12 }}>
        Customize
      </Text>

      {/* Input Fields */}
      <TextInput
        placeholder="Add Ingredients (optional)"
        placeholderTextColor="#999"
        value={input}
        onChangeText={setInput}
        style={{
          backgroundColor: "#f5f8fa",
          padding: 12,
          borderRadius: 10,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#ddd",
          fontSize: 16,
          minHeight: 50,
        }}
        multiline
      />
      <TextInput
        placeholder="What kind of dish are you thinking of? (optional)"
        placeholderTextColor="#999"
        value={dishGoal}
        onChangeText={setDishGoal}
        style={{
          backgroundColor: "#f5f8fa",
          padding: 12,
          borderRadius: 10,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: "#ddd",
          fontSize: 16,
          minHeight: 50,
        }}
        multiline
      />

      {loading && (
        <Text style={{ marginTop: 10, marginBottom: 10, color: "#666", fontSize: 16, textAlign: "center" }}>
          Generating…
        </Text>
      )}

      <View style={{ marginTop: 10 }}>
        {recipes.map((recipe, index) => (
          <View
            key={index}
            style={{
              backgroundColor: "#f5f8fa",
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 3,
              borderWidth: 1,
              borderColor: "#e0e0e0",
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
                Save Recipe
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
                Cook This
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
        </ScrollView>
        {/* /added for CameraPopup.jsx ← ADD CAMERA POPUP AT THE END */}
        <CameraPopup visible={cameraVisible} onClose={handlePhotoTaken} />
      </View>
    </KeyboardAvoidingView>
  );
}