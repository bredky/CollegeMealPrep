import { router } from "expo-router";
import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login(email, password);
      router.replace("/settings"); // go to settings/home after login
    } catch (err: any) {
      console.log("Login error:", err.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: "#d4e0ed" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
      {/* Logo */}
      <View style={{ marginBottom: 20, alignItems: "center" }}>
        <View style={{ 
          width: 140, 
          height: 140, 
          justifyContent: "center", 
          alignItems: "center",
          marginBottom: 20,
          position: "relative",
        }}>
          {/* Frying Pan */}
          <View style={{ 
            width: 100, 
            height: 100, 
            borderRadius: 50, 
            backgroundColor: "#4a4a4a", 
            justifyContent: "center", 
            alignItems: "center",
            position: "relative",
          }}>
            {/* Inner pan surface */}
            <View style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 40, 
              backgroundColor: "#6a6a6a", 
            }} />
            {/* Egg white */}
            <View style={{ 
              position: "absolute",
              width: 60,
              height: 50,
              borderRadius: 30,
              backgroundColor: "#f5f8fa",
              top: 20,
              left: 20,
            }}>
              {/* Egg yolk */}
              <View style={{ 
                position: "absolute", 
                top: 15, 
                left: 20, 
                width: 20, 
                height: 20, 
                borderRadius: 10, 
                backgroundColor: "#ff9800" 
              }} />
            </View>
            {/* Handle */}
            <View style={{ 
              position: "absolute", 
              right: -30, 
              top: 35, 
              width: 35, 
              height: 12, 
              backgroundColor: "#4a4a4a", 
              borderRadius: 6 
            }} />
          </View>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: "700", 
            color: "#000", 
            letterSpacing: 3,
            marginTop: 10,
          }}>
            SOUS
          </Text>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: "700", 
            color: "#000", 
            letterSpacing: 3,
          }}>
            CHEF
          </Text>
        </View>
      </View>

      {/* Tagline */}
      <Text style={{ fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 40, textAlign: "center" }}>
        Sign up to create your own cookbook
      </Text>

      {/* Login Card */}
      <View style={{
        backgroundColor: "#f5f8fa",
        padding: 24,
        borderRadius: 16,
        width: "100%",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 3,
      }}>
        <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 20, textAlign: "center", color: "#000" }}>
          Log In
        </Text>

        <TextInput
          placeholder="User"
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
          placeholder="Pass"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
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
          onPress={handleLogin}
          style={{
            backgroundColor: "#4a90e2",
            padding: 14,
            borderRadius: 10,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/signup")}>
          <Text style={{ color: "#4a90e2", fontSize: 16, textAlign: "center", fontWeight: "500" }}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}