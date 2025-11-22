import { router } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
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
    <View
      style={{
        flex: 1,
        backgroundColor: "#f7f7f7",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* SIGN UP CARD */}
      <View
        style={{
          backgroundColor: "white",
          padding: 24,
          borderRadius: 16,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Create Account
        </Text>

        {/* INPUT STYLES */}
        <TextInput
          placeholder="Name"
          onChangeText={setName}
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 10,
            marginBottom: 12,
            backgroundColor: "#fafafa",
          }}
        />

        <TextInput
          placeholder="Email"
          onChangeText={setEmail}
          autoCapitalize="none"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 10,
            marginBottom: 12,
            backgroundColor: "#fafafa",
          }}
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          onChangeText={setPassword}
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 10,
            marginBottom: 12,
            backgroundColor: "#fafafa",
          }}
        />

        <TextInput
          placeholder="Bio"
          onChangeText={setBio}
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 10,
            marginBottom: 20,
            backgroundColor: "#fafafa",
          }}
        />

        <Button title="Create Account" onPress={onSignup} />
      </View>

      {/* LOGIN REDIRECT */}
      <View style={{ marginTop: 20 }}>
        <Button
          title="Already have an account? Log in"
          onPress={() => router.push("/login")}
          color="#555"
        />
      </View>
    </View>
  );
}