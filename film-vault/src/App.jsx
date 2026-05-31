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

export default function App() {
  const [saved, setSaved] = useState({});
  const [profiles, setProfiles] = useState({});
  const [pending, setPending] = useState({});
  const [queue, setQueue] = useState([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [activeGenre, setActiveGenre] = useState("All");
  const [tab, setTab] = useState("rate");
  const [loadingProfile, setLoadingProfile] = useState(null);
  const [recAudience, setRecAudience] = useState("");
  const [recGenre, setRecGenre] = useState("");
  const [recVibe, setRecVibe] = useState("");
  const [recResults, setRecResults] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState("");
  const topRef = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    const data = load();
    setSaved(data.saved || {});
    setProfiles(data.profiles || {});
  }, []);

  // Save whenever saved or profiles changes
  useEffect(() => {
    save({ saved, profiles });
  }, [saved, profiles]);

  // Rebuild queue when genre or saved changes
  useEffect(() => {
    const q = MOVIES.filter(m =>
      (activeGenre === "All" || m.genre === activeGenre) && !saved[m.id]
    );
    setQueue(q);
    setBatchIndex(0);
    setPending({});
  }, [activeGenre, saved]);

  const batch = queue.slice(batchIndex, batchIndex + BATCH_SIZE);
  const totalRated = Object.keys(saved).length;
  const responded = batch.filter(m => pending[m.id] && (pending[m.id].rating || pending[m.id].notSeen)).length;

  function submitBatch() {
    const newSaved = { ...saved };
    batch.forEach(m => {
      newSaved[m.id] = pending[m.id] || { rating: null, notSeen: false, forKids: false, skipped: true };
    });
    setSaved(newSaved);
    setPending({});
    setBatchIndex(prev => prev + BATCH_SIZE);
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function generateProfile(genre) {
    setLoadingProfile(genre);
    const movies = MOVIES.filter(m => m.genre === genre);
    const lines = [1,2,3,4,5].map(v => {
      const titles = movies.filter(m => saved[m.id]?.rating === v).map(m => m.title);
      return titles.length ? `${v}/5: ${titles.join(", ")}` : null;
    }).filter(Boolean).join("\n");

    const prompt = `Analyze this person's ${genre} movie taste and write a short profile.
Ratings:\n${lines}
Give it a punchy 4-6 word title and write 2-3 sentences about what patterns you see.
YOUR ENTIRE RESPONSE MUST BE VALID JSON ONLY. NO BACKTICKS. NO OTHER TEXT.
{"title":"...","description":"..."}`;

    try {
      const text = await aiComplete(prompt);
      const result = extractJSON(text, "object");
      setProfiles(prev => ({ ...prev, [genre]: result }));
    } catch(e) {
      setProfiles(prev => ({ ...prev, [genre]: { title: "Error", description: e.message } }));
    }
    setLoadingProfile(null);
  }

  async function getRecs() {
    setRecLoading(true);
    setRecResults(null);
    setRecError("");

    const lines = [1,2,3,4,5].map(v => {
      const titles = MOVIES.filter(m => saved[m.id]?.rating === v).map(m => m.title);
      return titles.length ? `${v}/5: ${titles.join(", ")}` : null;
    }).filter(Boolean).join("\n");

    const seen = MOVIES.filter(m => saved[m.id]?.rating).map(m => m.title).join(", ") || "none";
    const kids = MOVIES.filter(m => saved[m.id]?.forKids).map(m => m.title).join(", ") || "none";
    const forKids = recAudience === "With Boys";

    const prompt = [
      "You are a movie expert. Recommend 3 films for Matt based on his taste ratings.",
      `His ratings (1=worst 5=best):\n${lines || "none yet"}`,
      `DO NOT recommend these already-seen films: ${seen}`,
      `Watching with: ${recAudience}`,
      forKids ? `MUST be appropriate for kids ages 8-12. Kid-approved films: ${kids}` : "",
      `Genre preference: ${recGenre || "any"}`,
      `Tonight's vibe: ${recVibe || "any"}`,
      "He avoids romance, horror, and gratuitous violence. English-language films only.",
      "Streaming services: Max, Hulu, Apple TV+, Amazon Prime, Disney+, Peacock. Renting is fine too.",
      "YOUR ENTIRE RESPONSE MUST BE A VALID JSON ARRAY ONLY. NO BACKTICKS. NO OTHER TEXT.",
      '[{"title":"...","year":2020,"reason":"Why it matches his taste specifically","streaming":"Where to watch"}]'
    ].filter(Boolean).join("\n\n");

    try {
      const text = await aiComplete(prompt);
      const recs = extractJSON(text, "array");
      setRecResults(recs);
    } catch(e) {
      setRecError(e.message);
    }
    setRecLoading(false);
  }

  // Styles
  const pillStyle = (active) => ({
    background: active ? "#3a3a8a" : "#1a1a2e",
    border: active ? "1px solid #8888ff" : "1px solid #2a2a4a",
    borderRadius: 20, padding: "5px 12px",
    color: active ? "#c8c8ff" : "#8888aa",
    fontSize: 11, cursor: "pointer", fontFamily: "monospace",
    transition: "all 0.2s"
  });

  const audStyle = (active) => ({
    background: active ? "#3a3a8a" : "#0d0d1a",
    border: active ? "1.5px solid #8888ff" : "1.5px solid #2a2a4a",
    borderRadius: 10, padding: "8px 14px",
    color: active ? "#c8c8ff" : "#8888aa",
    fontSize: 12, cursor: "pointer", fontFamily: "monospace",
    transition: "all 0.2s"
  });

  return (
    <div style={{ background: "#0a0a1a", color: "#e8e8f8", fontFamily: "'DM Sans', sans-serif", minHeight: "100vh" }}>

      {/* Header */}
      <div ref={topRef} style={{ background: "linear-gradient(135deg, #0d0d2a, #1a0a2e)", borderBottom: "1px solid #2a2a5a", padding: "20px 20px 0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#e8e8ff", margin: "0 0 2px" }}>
            🎬 Matt's Film Vault
          </h1>
          <p style={{ color: "#6666aa", fontSize: 11, fontFamily: "monospace", margin: "0 0 16px" }}>
            {totalRated} rated · {queue.length} in queue
          </p>
          <div style={{ display: "flex" }}>
            {[["rate","📋 Rate"],["profiles","📊 Profiles"],["recs","🤖 Recs"]].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab===t ? "#1a1a3a" : "transparent",
                border: "none",
                borderBottom: tab===t ? "2px solid #8888ff" : "2px solid transparent",
                color: tab===t ? "#c8c8ff" : "#6666aa",
                padding: "8px 18px", cursor: "pointer",
                fontFamily: "monospace", fontSize: 12,
                letterSpacing: 1, textTransform: "uppercase",
                transition: "all 0.2s"
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>

        {/* RATE TAB */}
        {tab === "rate" && (
          <div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
              {["All", ...GENRES].map(g => (
                <button key={g} onClick={() => setActiveGenre(g)} style={pillStyle(activeGenre === g)}>{g}</button>
              ))}
            </div>

            {batch.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6666aa", fontFamily: "monospace" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                All caught up{activeGenre !== "All" ? " in " + activeGenre : ""}!
              </div>
            ) : (
              <div>
                <div style={{ color: "#6666aa", fontFamily: "monospace", fontSize: 11, marginBottom: 14 }}>
                  Batch {Math.floor(batchIndex / BATCH_SIZE) + 1} · {batch.length} films · {responded}/{batch.length} responded
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
                  {batch.map(m => (
                    <MovieCard
                      key={m.id}
                      movie={m}
                      pending={pending[m.id] || { rating: null, notSeen: false, forKids: false }}
                      onChange={vals => setPending(prev => ({ ...prev, [m.id]: vals }))}
                    />
                  ))}
                </div>
                <button onClick={submitBatch} style={{
                  width: "100%", padding: 14,
                  background: "linear-gradient(135deg, #3a3a9a, #5a3a9a)",
                  border: "none", borderRadius: 14,
                  color: "#e8e8ff", fontSize: 15, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'Playfair Display', serif",
                  letterSpacing: 0.5
                }}>
                  Submit & Next 5 →
                </button>
              </div>
            )}
          </div>
        )}

        {/* PROFILES TAB */}
        {tab === "profiles" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ color: "#6666aa", fontFamily: "monospace", fontSize: 11, margin: 0 }}>
              Rate 2+ films per genre to unlock AI taste profiles.
            </p>
            {GENRES.map(genre => {
              const movies = MOVIES.filter(m => m.genre === genre);
              const rated = movies.filter(m => saved[m.id]?.rating);
              const forKidsCount = movies.filter(m => saved[m.id]?.forKids).length;
              const prof = profiles[genre];

              return (
                <div key={genre} style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 16, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#c8c8ff" }}>{genre}</span>
                    <span style={{ color: "#6666aa", fontFamily: "monospace", fontSize: 11 }}>
                      {rated.length}/{movies.length} rated · 🤪 {forKidsCount}
                    </span>
                  </div>

                  {rated.length >= 2 && (
                    <>
                      <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden", marginBottom: 10, background: "#0d0d1a" }}>
                        {[1,2,3,4,5].map(v => {
                          const c = rated.filter(m => saved[m.id].rating === v).length;
                          return c > 0 ? <div key={v} style={{ flex: c, background: RATING_COLORS[v] }} /> : null;
                        })}
                      </div>
                      <div style={{ display: "flex", gap: 10, fontSize: 11, fontFamily: "monospace", marginBottom: 14 }}>
                        {[1,2,3,4,5].map(v => {
                          const c = rated.filter(m => saved[m.id].rating === v).length;
                          return c > 0 ? <span key={v} style={{ color: RATING_COLORS[v] }}>{RATING_EMOJIS[v]} {c}</span> : null;
                        })}
                      </div>
                    </>
                  )}

                  {rated.length < 2 ? (
                    <div style={{ color: "#3a3a6a", fontFamily: "monospace", fontSize: 11 }}>
                      Rate {2 - rated.length} more to unlock
                    </div>
                  ) : prof ? (
                    <div style={{ background: "#0d0d2a", borderRadius: 10, padding: 14, borderLeft: "3px solid #8888ff" }}>
                      <div style={{ color: "#c8c8ff", fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                        {prof.title}
                      </div>
                      <div style={{ color: "#aaaacc", fontSize: 13, lineHeight: 1.6 }}>{prof.description}</div>
                      <button onClick={() => generateProfile(genre)} style={{
                        marginTop: 10, background: "transparent",
                        border: "1px solid #3a3a6a", borderRadius: 8,
                        padding: "4px 10px", color: "#6666aa",
                        fontSize: 11, cursor: "pointer", fontFamily: "monospace"
                      }}>↻ Refresh</button>
                    </div>
                  ) : (
                    <button onClick={() => generateProfile(genre)} disabled={loadingProfile === genre} style={{
                      background: loadingProfile === genre ? "#1a1a3a" : "#2a2a5a",
                      border: "1px solid #4a4aaa", borderRadius: 10,
                      padding: "8px 16px", color: "#c8c8ff",
                      fontSize: 12, cursor: "pointer", fontFamily: "monospace"
                    }}>
                      {loadingProfile === genre ? "✨ Analyzing..." : "✨ Generate AI Profile"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* RECS TAB */}
        {tab === "recs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>

              <div>
                <div style={{ fontSize: 11, color: "#6666aa", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  Who's Watching?
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Solo","With Parents","With Boys"].map(a => (
                    <button key={a} onClick={() => setRecAudience(a)} style={audStyle(recAudience === a)}>{a}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "#6666aa", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  Genre
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["Any", ...GENRES].map(g => (
                    <button key={g} onClick={() => setRecGenre(g === "Any" ? "" : g)}
                      style={pillStyle(recGenre === g || (g === "Any" && !recGenre))}>{g}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "#6666aa", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  Tonight's Vibe
                </div>
                <input
                  value={recVibe}
                  onChange={e => setRecVibe(e.target.value)}
                  placeholder="e.g. epic and emotional, light and fun, tense..."
                  style={{
                    width: "100%", background: "#0d0d1a",
                    border: "1px solid #2a2a4a", borderRadius: 10,
                    padding: "10px 14px", color: "#e8e8f8",
                    fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif"
                  }}
                />
              </div>

              <button onClick={getRecs} disabled={!recAudience || recLoading} style={{
                background: recAudience && !recLoading
                  ? "linear-gradient(135deg, #3a3a9a, #5a3a9a)"
                  : "#1a1a3a",
                border: "none", borderRadius: 12,
                padding: "12px 24px",
                color: recAudience ? "#e8e8ff" : "#6666aa",
                fontSize: 14, fontWeight: 700,
                cursor: recAudience ? "pointer" : "not-allowed",
                fontFamily: "'Playfair Display', serif"
              }}>
                {recLoading ? "✨ Finding your films..." : "✨ Get Recommendations"}
              </button>
            </div>

            {recError && (
              <p style={{ color: "#f87171", fontFamily: "monospace", fontSize: 12 }}>Error: {recError}</p>
            )}

            {recResults && recResults.map((r, i) => (
              <div key={i} style={{
                background: "linear-gradient(135deg, #1a1a2e, #1a1a3a)",
                border: "1px solid #3a3a6a", borderRadius: 14, padding: 18
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: "#e8e8ff" }}>
                    {r.title} <span style={{ color: "#6666aa", fontSize: 12, fontWeight: "normal" }}>({r.year})</span>
                  </div>
                  <div style={{ background: "#2a2a5a", borderRadius: 8, padding: "3px 10px", fontSize: 11, color: "#8888ff", fontFamily: "monospace", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {r.streaming}
                  </div>
                </div>
                <div style={{ color: "#aaaacc", fontSize: 13, lineHeight: 1.6 }}>{r.reason}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
