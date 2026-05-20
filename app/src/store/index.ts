import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Place } from "../services/api";

interface AuthState {
  beliToken: string | null;
  displayName: string | null;
  setAuth: (token: string, displayName: string) => void;
  clearAuth: () => void;
  loadAuth: () => Promise<void>;
}

interface ExtractionState {
  videoUrl: string | null;
  places: Place[];
  selected: Set<string>;
  isExtracting: boolean;
  setVideoUrl: (url: string) => void;
  setPlaces: (places: Place[]) => void;
  toggleSelected: (name: string) => void;
  selectAll: () => void;
  clearExtraction: () => void;
  setExtracting: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  beliToken: null,
  displayName: null,

  setAuth: async (token, displayName) => {
    await SecureStore.setItemAsync("beli_token", token);
    await SecureStore.setItemAsync("beli_display_name", displayName);
    set({ beliToken: token, displayName });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync("beli_token");
    await SecureStore.deleteItemAsync("beli_display_name");
    set({ beliToken: null, displayName: null });
  },

  loadAuth: async () => {
    const token = await SecureStore.getItemAsync("beli_token");
    const displayName = await SecureStore.getItemAsync("beli_display_name");
    if (token) set({ beliToken: token, displayName: displayName ?? "" });
  },
}));

export const useExtractionStore = create<ExtractionState>((set, get) => ({
  videoUrl: null,
  places: [],
  selected: new Set(),
  isExtracting: false,

  setVideoUrl: (url) => set({ videoUrl: url }),
  setPlaces: (places) =>
    set({ places, selected: new Set(places.map((p) => p.name)) }), // select all by default
  toggleSelected: (name) => {
    const next = new Set(get().selected);
    next.has(name) ? next.delete(name) : next.add(name);
    set({ selected: next });
  },
  selectAll: () => set({ selected: new Set(get().places.map((p) => p.name)) }),
  clearExtraction: () => set({ videoUrl: null, places: [], selected: new Set() }),
  setExtracting: (v) => set({ isExtracting: v }),
}));
