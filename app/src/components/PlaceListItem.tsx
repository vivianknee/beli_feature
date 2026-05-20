import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Place } from "../services/api";

interface Props {
  place: Place;
  selected: boolean;
  onToggle: () => void;
}

const TYPE_EMOJI: Record<string, string> = {
  restaurant: "🍽",
  cafe: "☕️",
  bakery: "🥐",
  bar: "🍸",
  food_stall: "🥡",
  unknown: "📍",
};

export default function PlaceListItem({ place, selected, onToggle }: Props) {
  const emoji = TYPE_EMOJI[place.type ?? "unknown"] ?? "📍";
  return (
    <TouchableOpacity style={[styles.row, selected && styles.selected]} onPress={onToggle}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.info}>
        <Text style={styles.name}>{place.name}</Text>
        {place.type && <Text style={styles.type}>{place.type}</Text>}
      </View>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  selected: {
    backgroundColor: "#f0faf5",
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  type: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
    textTransform: "capitalize",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#2e7d52",
    borderColor: "#2e7d52",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
