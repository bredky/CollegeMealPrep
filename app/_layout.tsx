import { Slot } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";
import { SettingsProvider } from "../src/context/SettingsContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Slot />
      </SettingsProvider>
    </AuthProvider>
  );
}