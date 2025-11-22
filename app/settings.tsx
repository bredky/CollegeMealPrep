import { router } from "expo-router";
import { Button, Text, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";

export default function Home() {
  const { user, profile, logout } = useAuth();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f7f7f7",
        padding: 24,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Card */}
      <View
        style={{
          width: "100%",
          padding: 24,
          borderRadius: 16,
          backgroundColor: "white",
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
          elevation: 5,
          marginBottom: 30,
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
          Welcome 👋
        </Text>

        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>Email:</Text>
          <Text style={{ fontSize: 16, color: "#555" }}>{user?.email}</Text>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>Name:</Text>
          <Text style={{ fontSize: 16, color: "#555" }}>
            {profile?.name ?? "—"}
          </Text>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>Bio:</Text>
          <Text style={{ fontSize: 16, color: "#555" }}>
            {profile?.bio ?? "—"}
          </Text>
        </View>
      </View>

      <View style={{ width: "100%" }}>
        <Button
          title="Logout"
          color="#d9534f"
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
        />
      </View>

      <View style={{ width: "100%", marginTop: 20 }}>
        <Button
            title="Go to Recipes 🍲"
            onPress={() => router.push("/recipes")}
        />
        </View>
    </View>
  );
}