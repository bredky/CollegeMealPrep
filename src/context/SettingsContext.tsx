// src/context/SettingsContext.tsx

import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";

export type UserSettings = {
  darkMode: boolean;
  notificationsEnabled: boolean;
  preferredLanguage: string;
};

type SettingsContextType = {
  settings: UserSettings | null;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  loading: boolean;
};

// default if the user has nothing yet in Firestore
const defaultSettings: UserSettings = {
  darkMode: false,
  notificationsEnabled: true,
  preferredLanguage: "en",
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth() as any;
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Load settings from Firestore when user changes
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setSettings(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const ref = doc(db, "users", user.id);
        const snap = await getDoc(ref);

        if (snap.exists() && snap.data().settings) {
          setSettings(snap.data().settings);
        } else {
          setSettings(defaultSettings);
        }
      } catch (err) {
        console.warn("Failed to load settings from Firestore:", err);
        setSettings(defaultSettings);
      }

      setLoading(false);
    };

    loadSettings();
  }, [user]);

  // Update Firestore when settings change
  const updateSettings = async (patch: Partial<UserSettings>) => {
    if (!user) return;

    const newSettings = {
      ...(settings ?? defaultSettings),
      ...patch,
    };

    setSettings(newSettings);

    try {
      const ref = doc(db, "users", user.id);
      await updateDoc(ref, { settings: newSettings });
    } catch (err) {
      console.warn("Failed to save settings:", err);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
};