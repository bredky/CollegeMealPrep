import { Audio } from "expo-av";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import OpenAI from "openai";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { generateVoice } from "../lib/generate-voice-fetch";
import { useAuth } from "../src/context/AuthContext";
import { db } from "../src/firebase/config";
import CameraPopup from "./CameraPopup";

export default function Recipes() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const client = new OpenAI({ apiKey: process.env.EXPO_PUBLIC_OPENAI_KEY });

  const handlePhotoTaken = (uri?: string) => {
    if (uri) {
      setPhotoUri(uri);
      console.log("Photo captured:", uri);
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#FF6B6B', '#FFE66D', '#4ECDC4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recipe Creator</Text>
          <Text style={styles.headerSubtitle}>👨‍🍳 AI-Powered Cooking Assistant</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Camera Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📸 Ingredient Photo</Text>
          
          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity 
                onPress={() => setPhotoUri(null)}
                style={styles.removePhotoButton}
              >
                <Text style={styles.removePhotoText}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setCameraVisible(true)}
              style={styles.cameraButton}
            >
              <Text style={styles.cameraButtonIcon}>📷</Text>
              <Text style={styles.cameraButtonText}>Take Photo of Ingredients</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Input Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🥘 Your Ingredients</Text>
          <TextInput
            placeholder="e.g., chicken, rice, tomatoes..."
            onChangeText={setInput}
            value={input}
            style={styles.input}
            placeholderTextColor="#999"
            multiline
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            onPress={generateRecipes}
            style={[styles.actionButton, styles.primaryButton]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.actionButtonIcon}>🍳</Text>
                <Text style={styles.actionButtonText}>Generate Recipes</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.secondaryButtonRow}>
            <TouchableOpacity 
              onPress={handleGenerate}
              style={[styles.actionButton, styles.secondaryButton]}
            >
              <Text style={styles.secondaryButtonText}>🎙️ Gordon Voice</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push("/saved")}
              style={[styles.actionButton, styles.secondaryButton]}
            >
              <Text style={styles.secondaryButtonText}>⭐ Saved Recipes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.loadingText}>Creating delicious recipes...</Text>
          </View>
        )}

        {/* Recipes List */}
        {recipes.length > 0 && (
          <View style={styles.recipesSection}>
            <Text style={styles.resultTitle}>
              🎉 Found {recipes.length} Recipe{recipes.length > 1 ? 's' : ''}
            </Text>
            
            {recipes.map((recipe, index) => (
              <View key={index} style={styles.recipeCard}>
                {/* Recipe Header */}
                <View style={styles.recipeHeader}>
                  <Text style={styles.recipeNumber}>#{index + 1}</Text>
                  <View style={styles.recipeTitleContainer}>
                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                    <Text style={styles.recipeDescription}>{recipe.description}</Text>
                  </View>
                </View>

                {/* Ingredients */}
                <View style={styles.recipeSection}>
                  <Text style={styles.recipeSectionTitle}>🥗 Ingredients</Text>
                  <View style={styles.ingredientsList}>
                    {recipe.ingredients?.map((ingredient: string, idx: number) => (
                      <View key={idx} style={styles.ingredientItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.ingredientText}>{ingredient}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Steps */}
                <View style={styles.recipeSection}>
                  <Text style={styles.recipeSectionTitle}>👨‍🍳 Instructions</Text>
                  {recipe.steps?.map((step: string, idx: number) => (
                    <View key={idx} style={styles.stepItem}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={() => saveRecipe(recipe)}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>💾 Save Recipe</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <CameraPopup visible={cameraVisible} onClose={handlePhotoTaken} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#fff",
    marginTop: 5,
    opacity: 0.95,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  photoContainer: {
    alignItems: "center",
  },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 15,
    marginBottom: 12,
  },
  removePhotoButton: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  removePhotoText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  cameraButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  cameraButtonIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#333",
    minHeight: 80,
    textAlignVertical: "top",
  },
  buttonContainer: {
    marginBottom: 15,
  },
  actionButton: {
    borderRadius: 15,
    padding: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButton: {
    backgroundColor: "#FF6B6B",
    marginBottom: 12,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  secondaryButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  recipesSection: {
    marginTop: 10,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  recipeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  recipeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  recipeNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FF6B6B",
    marginRight: 12,
  },
  recipeTitleContainer: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  recipeDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  recipeSection: {
    marginBottom: 20,
  },
  recipeSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  ingredientsList: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: "#FF6B6B",
    marginRight: 8,
    fontWeight: "700",
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4ECDC4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});