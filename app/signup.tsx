import { router } from "expo-router";
import { useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
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
        style={{ marginBottom: 20, marginTop: 30 }}
      >
        <Text style={{ fontSize: 18, color: "#4a90e2", fontWeight: "600" }}>← Back</Text>
      </TouchableOpacity>

      {/* Lemon Image - Top Right */}
      <View style={{
        position: "absolute",
        top: 40,
        right: 20,
        zIndex: 1,
      }}>
        <Image
          source={require("../assets/images/lemon.png")}
          style={{
            width: 100,
            height: 100,
            resizeMode: "contain",
          }}
        />
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

      {/* Guy Holding Bag Image - Bottom */}
      <View style={{
        position: "absolute",
        bottom: 20,
        alignSelf: "center",
        alignItems: "center",
      }}>
        <Image
          source={require("../assets/images/guyholdingbag.png")}
          style={{
            width: 200,
            height: 240,
            resizeMode: "contain",
          }}
        />
      </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}