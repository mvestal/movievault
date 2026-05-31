import React, { useState, useEffect, useRef } from 'react';
import { GENRES, MOVIES, RATING_EMOJIS, RATING_COLORS, BATCH_SIZE } from './data';
import { aiComplete, extractJSON } from './api';
import MovieCard from './MovieCard';

const STORAGE_KEY = "film-vault-v1";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { saved: {}, profiles: {} };
  } catch { return { saved: {}, profiles: {} }; }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function RecCard({ rec, savedRating, onRate, onNotInterested, notInterested }) {
  return (
    <div style={{
      background: notInterested ? "#111118" : savedRating ? `linear-gradient(135deg, #1a1a2e 60%, ${RATING_COLORS[savedRating]}18)` : "linear-gradient(135deg, #1a1a2e, #1a1a3a)",
      border: notInterested ? "1px solid #2a2a3a" : savedRating ? `1px solid ${RATING_COLORS[savedRating]}55` : "1px solid #3a3a6a",
      borderRadius: 14, padding: 18, opacity: notInterested ? 0.5 : 1
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: "#e8e8ff" }}>
          {rec.title} <span style={{ color: "#6666aa", fontSize: 12, fontWeight: "normal" }}>({rec.year})</span>
        </div>
        <div style={{ background: "#2a2a5a", borderRadius: 8, padding: "3px 10px", fontSize: 11, color: "#8888ff", fontFamily: "monospace", whiteSpace: "nowrap", flexShrink: 0 }}>
          {rec.streaming}
        </div>
      </div>
      <div style={{ color: "#aaaacc", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{rec.reason}</div>
      <div>
        <div style={{ fontSize: 10, color: "#6666aa", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          {savedRating ? "Your Rating" : "Rate if you've seen it"}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[1,2,3,4,5].map(v => (
            <button key={v} onClick={() => onRate(v === savedRating ? null : v)}
              style={{
                flex: 1, background: savedRating === v ? RATING_COLORS[v] + "33" : "#0d0d1a",
                border: `2px solid ${savedRating === v ? RATING_COLORS[v] : "#2a2a4a"}`,
                borderRadius: 12, padding: "8px 4px", fontSize: 22, cursor: "pointer",
                transition: "all 0.15s", transform: savedRating === v ? "scale(1.08)" : "scale(1)", lineHeight: 1
              }}>{RATING_EMOJIS[v]}</button>
          ))}
          <button onClick={onNotInterested} title="Not Interested"
            style={{
              background: notInterested ? "#3a1a1a" : "#0d0d1a",
              border: notInterested ? "2px solid #f8717188" : "2px solid #2a2a4a",
              borderRadius: 12, padding: "8px 10px", fontSize: 18, cursor: "pointer",
              transition: "all 0.15s", lineHeight: 1
            }}>🚫</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [saved, setSaved] = useState({});
  const [profiles, setProfiles] = useState({});
  const [pending, setPending] = useState({});
  const [queue, setQueue] = useState([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [activeGenre, setActiveGenre] = useState("All");
  const [tab, setTab] = useState("rate");
  const [loadingProfile, setLoadingProfile] =
