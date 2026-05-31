import React from 'react';
import { RATING_EMOJIS, RATING_COLORS } from './data';

export default function MovieCard({ movie, pending, onChange }) {
  const { rating, notSeen, forKids, notInterested } = pending;
  const borderColor = notInterested ? "#3a1a1a88" : rating ? RATING_COLORS[rating] + "66" : notSeen ? "#6666aa66" : "#2a2a4a";
  const bg = notInterested ? "#111118" : rating
    ? `linear-gradient(135deg, #1a1a2e 60%, ${RATING_COLORS[rating]}18)`
    : "#1a1a2e";

  return (
    <div style={{ background: bg, border: `1px solid ${borderColor}`, borderRadius: 16, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14, transition: "border 0.2s", opacity: notInterested ? 0.5 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: "#e8e8f8", lineHeight: 1.3 }}>{movie.title}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 5, alignItems: "center" }}>
            <span style={{ background: "#2a2a4a", borderRadius: 20, padding: "2px 10px", fontSize: 10, color: "#8888cc", fontFamily: "monospace" }}>{movie.genre}</span>
            <span style={{ fontSize: 10, color: "#6666aa", fontFamily: "monospace" }}>{movie.year}</span>
          </div>
        </div>
        <button onClick={() => onChange({ rating: notSeen ? rating : null, notSeen: !notSeen, forKids, notInterested: false })}
          style={{ background: notSeen ? "#3a2a6a" : "#0d0d1a", border: notSeen ? "1.5px solid #9966ff" : "1.5px solid #2a2a4a", borderRadius: 10, padding: "6px 10px", fontSize: 20, cursor: "pointer", transform: notSeen ? "scale(1.1)" : "scale(1)", flexShrink: 0 }}
          title="Haven't seen it">🧑‍🦯</button>
      </div>

      <div style={{ opacity: notSeen || notInterested ? 0.3 : 1, pointerEvents: notSeen || notInterested ? "none" : "auto" }}>
        <div style={{ fontSize: 10, color: "#6666aa", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>My Rating</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[1,2,3,4,5].map(v => (
            <button key={v} onClick={() => onChange({ rating: rating === v ? null : v, notSeen: false, forKids, notInterested: false })}
              style={{ flex: 1, background: rating === v ? RATING_COLORS[v] + "33" : "#0d0d1a", border: `2px solid ${rating === v ? RATING_COLORS[v] : "#2a2a4a"}`, borderRadius: 12, padding: "10px 4px", fontSize: 26, cursor: "pointer", transform: rating === v ? "scale(1.08)" : "scale(1)", lineHeight: 1 }}>
              {RATING_EMOJIS[v]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => onChange({ rating, notSeen, forKids: !forKids, notInterested })}
          style={{ display: "flex", alignItems: "center", gap: 6, background: forKids ? "#2a3a2a" : "#0d0d1a", border: forKids ? "1.5px solid #4ade8066" : "1.5px solid #2a2a4a", borderRadius: 10, padding: "7px 12px", cursor: "pointer" }}>
          <span style={{ fontSize: 16 }}>{forKids ? "✅" : "⬜"}</span>
          <span style={{ fontSize: 11, color: forKids ? "#a3e635" : "#6666aa", fontFamily: "monospace" }}>🤪 Kids</span>
        </button>
        <button onClick={() => onChange({ rating: null, notSeen: false, forKids: false, notInterested: !notInterested })}
          title="Not Interested"
          style={{ display: "flex", alignItems: "center", gap: 6, background: notInterested ? "#3a1a1a" : "#0d0d1a", border: notInterested ? "1.5px solid #f8717188" : "1.5px solid #2a2a4a", borderRadius: 10, padding: "7px 12px", cursor: "pointer" }}>
          <span style={{ fontSize: 16 }}>🚫</span>
          <span style={{ fontSize: 11, color: notInterested ? "#f87171" : "#6666aa", fontFamily: "monospace" }}>Not Interested</span>
        </button>
      </div>
    </div>
  );
}
