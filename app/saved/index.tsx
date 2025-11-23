import { router } from "expo-router";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/firebase/config";

export default function SavedRecipes() {
  const { user } = useAuth();
  const [saved, setSaved] = useState<any[]>([]);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [selectedRating, setSelectedRating] = useState<number>(0);

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
        style={{ marginBottom: 20, marginTop: 30 }}
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
            <View style={{
              width: 20,
              height: 20,
              backgroundColor: "#ffa726",
              borderRadius: 10,
            }} />
          </View>
        </View>
      </View>

      <ScrollView>
        {saved.map((r, index) => (
          <Animated.View
            key={r.id}
            entering={FadeInDown.delay(index * 100).springify()}
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
            {r.image && (
              <Image
                source={{ uri: r.image }}
                style={{
                  width: "100%",
                  height: 180,
                  borderRadius: 10,
                  marginTop: 8,
                  marginBottom: 8,
                }}
                resizeMode="cover"
              />
            )}
            <Text style={{ marginTop: 6, color: "#666", fontSize: 14 }}>{r.description}</Text>

            {/* Display Existing Rating */}
            {r.rating && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 4 }}>
                <Text style={{ fontSize: 14, color: "#666", marginRight: 8 }}>Your Rating:</Text>
                <View style={{ flexDirection: "row" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Text key={star} style={{ fontSize: 18, color: star <= r.rating ? "#ffa726" : "#ddd" }}>
                      ★
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Rating Button */}
            <TouchableOpacity
              onPress={() => {
                setSelectedRecipe(r);
                setSelectedRating(r.rating || 0);
                setRatingModalVisible(true);
              }}
              style={{
                marginTop: 12,
                backgroundColor: "#f5f8fa",
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#4a90e2",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#4a90e2", textAlign: "center", fontWeight: "600", fontSize: 14 }}>
                {r.rating ? "Update Rating" : "Rate Recipe"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({
                pathname: "/saved/[id]",
                params: { id: r.id, recipe: JSON.stringify(r) },
              })}
              style={{
                marginTop: 8,
                backgroundColor: "#4caf50",
                padding: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
                Cook This Recipe
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
        
        {/* Rating Modal */}
        <Modal
          visible={ratingModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setRatingModalVisible(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
            activeOpacity={1}
            onPress={() => setRatingModalVisible(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#f5f8fa",
                borderRadius: 20,
                padding: 24,
                width: "80%",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 8, color: "#000" }}>
                Rate This Recipe
              </Text>
              {selectedRecipe && (
                <Text style={{ fontSize: 16, color: "#666", marginBottom: 20, textAlign: "center" }}>
                  {selectedRecipe.title}
                </Text>
              )}
              
              {/* Star Rating */}
              <View style={{ flexDirection: "row", marginBottom: 20, gap: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarButton
                    key={star}
                    starNumber={star}
                    selected={selectedRating >= star}
                    onPress={() => setSelectedRating(star)}
                  />
                ))}
              </View>

              <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                {selectedRating > 0 ? `You rated this ${selectedRating} star${selectedRating > 1 ? 's' : ''}` : "Tap a star to rate"}
              </Text>

              <TouchableOpacity
                onPress={async () => {
                  if (selectedRating > 0 && selectedRecipe && user) {
                    try {
                      const ref = doc(db, "users", user.uid, "recipes", selectedRecipe.id);
                      await updateDoc(ref, { rating: selectedRating });
                      // Reload saved recipes to show updated rating
                      await loadSaved();
                    } catch (err) {
                      console.log("Failed to save rating:", err);
                    }
                  }
                  setRatingModalVisible(false);
                  setSelectedRating(0);
                }}
                style={{
                  backgroundColor: "#4a90e2",
                  padding: 12,
                  borderRadius: 8,
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                  {selectedRating > 0 ? "Save Rating" : "Done"}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </View>
  );
}

// Star Rating Component with Animation
function StarButton({ starNumber, selected, onPress }: { starNumber: number; selected: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    scale.value = withSpring(1.2, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Animated.View style={animatedStyle}>
        <View
          style={{
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 32, color: selected ? "#ffa726" : "#ddd" }}>
            ★
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}