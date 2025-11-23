import { router } from "expo-router";
import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [name, setName] = useState("");

  const onSignup = async () => {
    await signup(email, password, bio, name);
    router.replace("/settings");
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: "#d4e0ed" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 200 }}
          keyboardShouldPersistTaps="handled"
          style={{ position: "relative" }}
          showsVerticalScrollIndicator={false}
        >
      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => router.back()}
        style={{ marginBottom: 20, marginTop: 10 }}
      >
        <Text style={{ fontSize: 18, color: "#4a90e2", fontWeight: "600" }}>← Back</Text>
      </TouchableOpacity>

      {/* Lemon Illustration - Top Right */}
      <View style={{
        position: "absolute",
        top: 40,
        right: 20,
        zIndex: 1,
      }}>
        <View style={{
          width: 100,
          height: 100,
          alignItems: "center",
          justifyContent: "center",
        }}>
          {/* Lemon */}
          <View style={{
            width: 70,
            height: 80,
            borderRadius: 35,
            backgroundColor: "#ffeb3b",
            position: "relative",
            transform: [{ rotate: "-15deg" }],
          }}>
            <View style={{
              position: "absolute",
              bottom: -5,
              left: 10,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#ffc107",
            }} />
            {/* Leaves */}
            <View style={{
              position: "absolute",
              top: -15,
              right: 15,
              width: 20,
              height: 25,
              borderRadius: 10,
              backgroundColor: "#4caf50",
              transform: [{ rotate: "45deg" }],
            }} />
            <View style={{
              position: "absolute",
              top: -12,
              right: 25,
              width: 18,
              height: 22,
              borderRadius: 9,
              backgroundColor: "#66bb6a",
              transform: [{ rotate: "-30deg" }],
            }} />
          </View>
        </View>
      </View>

      {/* Create Account Card */}
      <View
        style={{
          backgroundColor: "#f5f8fa",
          padding: 24,
          borderRadius: 16,
          marginTop: 60,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 8,
          elevation: 3,
          borderWidth: 1,
          borderColor: "#e0e0e0",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            marginBottom: 20,
            textAlign: "center",
            color: "#000",
          }}
        >
          Create Account
        </Text>

        <TextInput
          placeholder="Name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 10,
            marginBottom: 12,
            backgroundColor: "#fff",
            fontSize: 16,
          }}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 10,
            marginBottom: 12,
            backgroundColor: "#fff",
            fontSize: 16,
          }}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 10,
            marginBottom: 12,
            backgroundColor: "#fff",
            fontSize: 16,
          }}
        />

        <TextInput
          placeholder="Bio"
          placeholderTextColor="#999"
          value={bio}
          onChangeText={setBio}
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 10,
            marginBottom: 20,
            backgroundColor: "#fff",
            fontSize: 16,
          }}
        />

        <TouchableOpacity
          onPress={onSignup}
          style={{
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Text style={{ color: "#4a90e2", fontSize: 18, fontWeight: "700" }}>
            Create Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Login Redirect */}
      <View style={{ marginTop: 20, alignItems: "center" }}>
        <Text style={{ color: "#000", fontSize: 16, marginBottom: 4 }}>
          Already have an account?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={{ color: "#4a90e2", fontSize: 16, fontWeight: "600" }}>
            Log in
          </Text>
        </TouchableOpacity>
      </View>

      {/* Man with Groceries Illustration - Bottom */}
      <View style={{
        position: "absolute",
        bottom: 20,
        alignSelf: "center",
        alignItems: "center",
      }}>
        <View style={{
          width: 120,
          height: 140,
          alignItems: "center",
        }}>
          {/* Head */}
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "#fdbcb4",
            marginBottom: 5,
            position: "relative",
          }}>
            {/* Eyes */}
            <View style={{
              position: "absolute",
              top: 15,
              left: 12,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#000",
            }} />
            <View style={{
              position: "absolute",
              top: 15,
              right: 12,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#000",
            }} />
            {/* Mustache (croissant) */}
            <View style={{
              position: "absolute",
              bottom: 8,
              left: 10,
              width: 30,
              height: 8,
              borderRadius: 15,
              backgroundColor: "#d4a574",
              transform: [{ rotate: "180deg" }],
            }} />
          </View>
          {/* Body/Shirt */}
          <View style={{
            width: 60,
            height: 50,
            backgroundColor: "#90c695",
            borderRadius: 8,
            position: "relative",
          }}>
            {/* Grocery Bag */}
            <View style={{
              position: "absolute",
              bottom: -10,
              left: 5,
              width: 50,
              height: 60,
              backgroundColor: "#8b6f47",
              borderRadius: 4,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}>
              {/* Fruits in bag - simplified */}
              <View style={{
                position: "absolute",
                top: 10,
                left: 10,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#ff6b6b",
              }} />
              <View style={{
                position: "absolute",
                top: 15,
                right: 10,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#4ecdc4",
              }} />
              <View style={{
                position: "absolute",
                bottom: 15,
                left: 15,
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: "#ffe66d",
              }} />
            </View>
          </View>
        </View>
      </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}