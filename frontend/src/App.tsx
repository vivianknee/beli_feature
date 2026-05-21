import { useState } from "react";
import type { Place } from "./types";
import { defaultListType } from "./types";
import { extractPlaces, savePlaces } from "./api";
import PlaceItem from "./components/PlaceItem";

const TEAL = "#1E6B7A";

export default function App() {
  const [url, setUrl] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [listTypes, setListTypes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const hasResults = places.length > 0;
  const allSelected = places.length > 0 && selected.size === places.length;

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(places.map((p) => p.name)));
  }

  function setListType(name: string, type: string) {
    setListTypes((prev) => ({ ...prev, [name]: type }));
  }

  async function handleExtract() {
    if (!url.trim() || loading) return;
    setError("");
    setPlaces([]);
    setSelected(new Set());
    setLoading(true);

    try {
      const data = await extractPlaces(url.trim());
      const initialTypes: Record<string, string> = {};
      data.places.forEach((p) => { initialTypes[p.name] = defaultListType(p.type); });
      setPlaces(data.places);
      setSelected(new Set(data.places.map((p) => p.name)));
      setListTypes(initialTypes);
    } catch (e: any) {
      setError(e.response?.data?.detail ?? e.message ?? "Extraction failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    const names = Array.from(selected);
    await savePlaces(names);
    showToast(`${names.length} spot${names.length !== 1 ? "s" : ""} bookmarked on Beli!`);
  }

  function handleCancel() {
    setUrl("");
    setPlaces([]);
    setSelected(new Set());
    setError("");
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  // ── Loading screen ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#fff",
      }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          overflow: "hidden",
          marginBottom: 16,
        }}>
          <img src="/assets/beli.jpg" alt="beli" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <p style={{ fontSize: 17, color: TEAL, fontStyle: "italic", marginBottom: 6 }}>
          Just a moment...
        </p>
        <p style={{ fontSize: 13, color: "#bbb" }}>
          Getting your spots ready
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fff" }}>

      {/* ── Input view ── */}
      {!hasResults && (
        <>
          {/* Centered logo + text */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 140,
          }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", marginBottom: 16 }}>
              <img src="/assets/beli.jpg" alt="beli" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <p style={{ fontSize: 17, color: TEAL, fontStyle: "italic", marginBottom: 6 }}>
              Find your next spot
            </p>
            <p style={{ fontSize: 13, color: "#bbb" }}>
              Paste a TikTok or Instagram link below
            </p>
          </div>

          {/* Sticky bottom input */}
          <div style={{
            position: "fixed", bottom: 0,
            left: "50%", transform: "translateX(-50%)",
            width: "100%", maxWidth: 430,
            padding: "16px 24px 36px",
            background: "#fff",
            borderTop: "1px solid #f0f0f0",
          }}>
            {error && (
              <div style={{
                padding: "10px 14px", background: "#fff0f0",
                border: "1.5px solid #fcc", borderRadius: 10,
                fontSize: 13, color: "#c0392b", marginBottom: 10,
              }}>
                {error}
              </div>
            )}
            <input
              type="url"
              placeholder="https://www.tiktok.com/@..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExtract()}
              style={{
                width: "100%",
                border: "1.5px solid #e0e0e0",
                borderRadius: 12,
                padding: "13px 16px",
                fontSize: 15,
                outline: "none",
                marginBottom: 10,
                color: "#111",
              }}
            />
            <button
              onClick={handleExtract}
              disabled={!url.trim()}
              style={{
                width: "100%",
                background: !url.trim() ? "#a8cece" : TEAL,
                color: "#fff", border: "none", borderRadius: 50,
                padding: "15px", fontSize: 16, fontWeight: 600,
                cursor: !url.trim() ? "not-allowed" : "pointer",
              }}
            >
              Extract Places
            </button>
          </div>
        </>
      )}

      {/* Results top bar */}
      {hasResults && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 20px 16px", position: "relative",
        }}>
          <button
            onClick={handleCancel}
            style={{
              position: "absolute", left: 20,
              background: "none", border: "none",
              fontSize: 15, color: "#111", cursor: "pointer", padding: 0,
            }}
          >
            Cancel
          </button>
          <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden" }}>
            <img src="/assets/beli.jpg" alt="beli" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      )}

      {/* Results title */}
      {hasResults && (
        <div style={{ padding: "0 24px 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: TEAL, marginBottom: 4 }}>
            Picked just for you!
          </h1>
          <p style={{ fontSize: 14, color: "#aaa" }}>Select the spots you want to try</p>
        </div>
      )}

      {/* ── Results view ── */}
      {hasResults && (
        <>
          {/* Selection bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "0 24px", marginBottom: 12,
          }}>
            <span style={{ fontSize: 13, color: "#aaa" }}>
              {selected.size} spot{selected.size !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={toggleAll}
              style={{
                background: "none", border: "none", fontSize: 13,
                color: "#555", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4, padding: 0,
              }}
            >
              {allSelected && (
                <img src="/assets/checkmark.png" alt="" style={{ width: 11, height: 11 }} />
              )}
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>

          {/* Place list */}
          <div style={{
            padding: "0 24px",
            display: "flex", flexDirection: "column", gap: 10,
            paddingBottom: 110,
          }}>
            {places.map((p) => (
              <PlaceItem
                key={p.name}
                place={p}
                selected={selected.has(p.name)}
                listType={listTypes[p.name] ?? "Restaurants"}
                onToggle={() => toggle(p.name)}
                onListTypeChange={(t) => setListType(p.name, t)}
              />
            ))}
          </div>

          {/* Sticky footer */}
          <div style={{
            position: "fixed", bottom: 0,
            left: "50%", transform: "translateX(-50%)",
            width: "100%", maxWidth: 430,
            padding: "16px 24px 36px",
            background: "#fff",
            borderTop: "1px solid #f0f0f0",
          }}>
            <button
              onClick={handleSave}
              disabled={selected.size === 0}
              style={{
                width: "100%",
                background: selected.size === 0 ? "#a8cece" : TEAL,
                color: "#fff", border: "none", borderRadius: 50,
                padding: "16px", fontSize: 16, fontWeight: 600,
                cursor: selected.size === 0 ? "not-allowed" : "pointer",
              }}
            >
              Bookmark on Beli
            </button>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)",
          background: "#111", color: "#fff", padding: "12px 20px",
          borderRadius: 10, fontSize: 14, fontWeight: 600,
          whiteSpace: "nowrap", zIndex: 100,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
