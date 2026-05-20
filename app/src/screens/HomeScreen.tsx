/**
 * Home screen — user can paste a URL manually or this screen is reached
 * via the iOS Share Extension (which pre-fills the URL).
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useExtractionStore } from "../store";
import { extractPlaces } from "../services/api";

export default function HomeScreen({ navigation }: any) {
  const [url, setUrl] = useState("");
  const { setPlaces, setExtracting, isExtracting, setVideoUrl } = useExtractionStore();

  const handleExtract = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setExtracting(true);
    setVideoUrl(trimmed);
    try {
      const result = await extractPlaces(trimmed);
      if (result.places.length === 0) {
        Alert.alert("No places found", "We couldn't find any restaurant or cafe names in that video.");
        return;
      }
      setPlaces(result.places);
      navigation.navigate("Places");
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.detail ?? e.message ?? "Extraction failed.");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>🥢</Text>
        <Text style={styles.heading}>Beli Reel Saver</Text>
        <Text style={styles.sub}>
          Paste a TikTok or Instagram Reel link to extract restaurant names and save them to Beli.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="https://www.tiktok.com/@..."
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleExtract}
        />

        <TouchableOpacity
          style={[styles.button, (!url.trim() || isExtracting) && styles.buttonDisabled]}
          onPress={handleExtract}
          disabled={!url.trim() || isExtracting}
        >
          {isExtracting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Extract Places</Text>
          )}
        </TouchableOpacity>

        {isExtracting && (
          <Text style={styles.hint}>This can take 30–60 seconds...</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  logo: { fontSize: 52, textAlign: "center", marginBottom: 8 },
  heading: { fontSize: 26, fontWeight: "800", textAlign: "center", color: "#1a1a1a", marginBottom: 8 },
  sub: { fontSize: 15, color: "#666", textAlign: "center", marginBottom: 32, lineHeight: 22 },
  input: {
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1a1a1a",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2e7d52",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#a0c4b0" },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  hint: { textAlign: "center", color: "#999", marginTop: 12, fontSize: 13 },
});
