import axios from "axios";

// Update this to your backend URL (ngrok for local dev, your deployed URL for prod)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api";

const api = axios.create({ baseURL: BASE_URL, timeout: 120_000 }); // 2 min — extraction is slow

export interface Place {
  name: string;
  type: string | null;
  confidence: number;
  source: string;
}

export interface ExtractResponse {
  places: Place[];
  video_title: string | null;
}

export interface SaveResponse {
  saved: string[];
  failed: string[];
}

export async function extractPlaces(videoUrl: string): Promise<ExtractResponse> {
  const resp = await api.post<ExtractResponse>("/extract", { video_url: videoUrl });
  return resp.data;
}

export async function savePlacesToBeli(
  beliToken: string,
  placeNames: string[]
): Promise<SaveResponse> {
  const resp = await api.post<SaveResponse>("/beli/save", {
    beli_token: beliToken,
    place_names: placeNames,
  });
  return resp.data;
}

export async function beliLogin(
  email: string,
  password: string
): Promise<{ token: string; user_id: string; display_name: string }> {
  const resp = await api.post("/beli/auth", { email, password });
  return resp.data;
}
