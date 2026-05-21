import axios from "axios";
import type { ExtractResponse } from "./types";

const api = axios.create({
  baseURL: "/api",
  timeout: 180_000,
});

export async function extractPlaces(videoUrl: string): Promise<ExtractResponse> {
  const resp = await api.post<ExtractResponse>("/extract", { video_url: videoUrl });
  return resp.data;
}

export async function savePlaces(placeNames: string[]): Promise<void> {
  // Dummy for now — wire up to real Beli API later
  console.log("Saving to Beli:", placeNames);
}
