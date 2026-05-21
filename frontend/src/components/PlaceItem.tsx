import { useState, useRef, useEffect } from "react";
import type { Place } from "../types";
import { LIST_TYPES } from "../types";

const TEAL = "#1E6B7A";

interface Props {
  place: Place;
  selected: boolean;
  listType: string;
  onToggle: () => void;
  onListTypeChange: (type: string) => void;
}

export default function PlaceItem({ place, selected, listType, onToggle, onListTypeChange }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: 12,
      border: `1.5px solid ${selected ? TEAL : "#e8e8e8"}`,
      borderRadius: 12,
      background: "#fff",
      position: "relative",
    }}>
      {/* Food image */}
      <div
        onClick={onToggle}
        style={{
          width: 72,
          height: 72,
          borderRadius: 8,
          flexShrink: 0,
          overflow: "hidden",
          background: "#f5f5f5",
          cursor: "pointer",
        }}
      >
        <img
          src="/assets/food.png"
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/assets/restaurant-placeholder.png";
          }}
        />
      </div>

      {/* Info */}
      <div onClick={onToggle} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
        <div style={{ fontSize: 11, color: "#aaa", marginBottom: 2 }}>
          New York, NY
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 3 }}>
          {place.name}
        </div>
        <div style={{ fontSize: 12, color: "#aaa", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
          <img src="/assets/restaurant-placeholder.png" alt="" style={{ width: 18, height: 18, mixBlendMode: "multiply" }} />
          · {listType}
        </div>

        {/* List type dropdown */}
        <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setDropdownOpen((o) => !o); }}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 12,
              color: TEAL,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            Add to my list of <strong style={{ marginLeft: 2 }}>{listType}</strong>
            <span style={{ fontSize: 10, marginLeft: 2 }}>▼</span>
          </button>

          {dropdownOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              zIndex: 50,
              minWidth: 200,
              overflow: "hidden",
            }}>
              {LIST_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={(e) => {
                    e.stopPropagation();
                    onListTypeChange(t);
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    background: t === listType ? "#f0f8f8" : "none",
                    border: "none",
                    fontSize: 13,
                    color: TEAL,
                    cursor: "pointer",
                    borderBottom: "1px solid #f5f5f5",
                    fontWeight: 600,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Checkmark */}
      <div
        onClick={onToggle}
        style={{
          width: 26,
          height: 26,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        {selected ? (
          <div style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#d0d0d0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <img src="/assets/checkmark.png" alt="selected" style={{ width: 15, height: 15, mixBlendMode: "multiply" }} />
          </div>
        ) : (
          <div style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: "1.5px solid #ccc",
          }} />
        )}
      </div>
    </div>
  );
}
