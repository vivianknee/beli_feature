/**
 * Main screen shown after extraction completes.
 * Displays a checklist of found places; user taps Done to save selected ones to Beli.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useExtractionStore, useAuthStore } from "../store";
import PlaceListItem from "../components/PlaceListItem";
import { savePlacesToBeli } from "../services/api";

export default function ExtractedPlacesScreen({ navigation }: any) {
  const { places, selected, toggleSelected, selectAll, clearExtraction } = useExtractionStore();
  const { beliToken } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const handleDone = async () => {
    if (!beliToken) {
      Alert.alert("Not logged in", "Please log in to your Beli account first.");
      navigation.navigate("Login");
      return;
    }
    if (selected.size === 0) {
      Alert.alert("Nothing selected", "Select at least one place to save.");
      return;
    }

    setSaving(true);
    try {
      const result = await savePlacesToBeli(beliToken, Array.from(selected));
      const msg =
        result.saved.length > 0
          ? `Saved ${result.saved.length} place${result.saved.length > 1 ? "s" : ""} to Beli!${
              result.failed.length > 0 ? `\n\nCouldn't find: ${result.failed.join(", ")}` : ""
            }`
          : "Couldn't find any of those places in Beli's database. Try searching manually.";
      Alert.alert("Done", msg, [{ text: "OK", onPress: () => { clearExtraction(); navigation.popToTop(); } }]);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Something went wrong saving to Beli.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Found {places.length} place{places.length !== 1 ? "s" : ""}</Text>
        <TouchableOpacity onPress={selectAll}>
          <Text style={styles.selectAll}>Select all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={places}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <PlaceListItem
            place={item}
            selected={selected.has(item.name)}
            onToggle={() => toggleSelected(item.name)}
          />
        )}
        style={styles.list}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.doneButton, selected.size === 0 && styles.doneButtonDisabled]}
          onPress={handleDone}
          disabled={saving || selected.size === 0}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.doneText}>
              Save {selected.size} to Beli
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },
  selectAll: { fontSize: 15, color: "#2e7d52", fontWeight: "600" },
  list: { flex: 1 },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e0e0e0",
  },
  doneButton: {
    backgroundColor: "#2e7d52",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  doneButtonDisabled: { backgroundColor: "#a0c4b0" },
  doneText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
