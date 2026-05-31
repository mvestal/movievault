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

function RecCard({ rec, savedRating, onRate, onNotInterested, notInterested, notTonight, onNotTonight }) {
  return (
    <div style={{
      background: notInterested ? "#111118" : notTonight ? "#0f0f1a" : savedRating ? `linear-gradient(135deg, #1a1a2e 60%, ${RATING_COLORS[savedRating]}18)` : "linear-gradient(135deg, #1a1a2e, #1a1a3a)",
      border: notInterested ? "1px solid #2a2a3a" : notTonight ? "1px solid #2a2a5a" : savedRating ? `1px solid ${RATING_COLORS[savedRating]}55` : "1px solid #3a3a6a",
      borderRadius: 14, padding: 18, opacity: notInterested ? 0.45 : notTonight ? 0.6 : 1, transition: "all 0.2s"
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
        <div style={{ fontSize: 10, color: "#6666aa", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          {savedRating ? "Your Rating" : "Respond"}
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {[1,2,3,4,5].map(v => (
            <button key={v} onClick={() => onRate(v === savedRating ? null : v)}
              style={{
                flex: 1, background: savedRating === v ? RATING_COLORS[v] + "33" : "#0d0d1a",
                border: `2px solid ${savedRating === v ? RATING_COLORS[v] : "#2a2a4a"}`,
                borderRadius: 12, padding: "8px 2px", fontSize: 20, cursor: "pointer",
                transition: "all 0.15s", transform: savedRating === v ? "scale(1.08)" : "scale(1)", lineHeight: 1
              }}>{RATING_EMOJIS[v]}</button>
          ))}
          <button onClick={onNotTonight} title="Not Tonight"
            style={{
              background: notTonight ? "#1a1a3a" : "#0d0d1a",
              border: notTonight ? "2px solid #8888ff" : "2px solid #2a2a4a",
              borderRadius: 12, padding: "8px 8px", fontSize: 16, cursor: "pointer",
              transition: "all 0.15s", lineHeight: 1
            }}>🌙</button>
          <button onClick={onNotInterested} title="Not Interested"
            style={{
              background: notInterested ? "#3a1a1a" : "#0d0d1a",
              border: notInterested ? "2px solid #f8717188" : "2px solid #2a2a4a",
              borderRadius: 12, padding: "8px 8px", fontSize: 16, cursor: "pointer",
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
  const [loadingProfile, setLoadingProfile] = useState(null);
  const [recAudience, setRecAudience] = useState("");
  const [recGenre, setRecGenre] = useState("");
  const [recVibe, setRecVibe] = useState("");
  const [recResults, setRecResults] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState("");
  const [notTonightList, setNotTonightList] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const topRef = useRef(null);

  useEffect(() => {
    const data = load();
    setSaved(data.saved || {});
    setProfiles(data.profiles || {});
  }, []);

  useEffect(() => { save({ saved, profiles }); }, [saved, profiles]);

  useEffect(() => {
    const q = MOVIES.filter(m => (activeGenre === "All" || m.genre === activeGenre) && !saved[m.id]);
    setQueue(q);
    setBatchIndex(0);
    setPending({});
  }, [activeGenre, saved]);

  const batch = queue.slice(batchIndex, batchIndex + BATCH_SIZE);
  const totalRated = Object.keys(saved).filter(k => saved[k]?.rating).length;
  const responded = batch.filter(m => pending[m.id] && (pending[m.id].rating || pending[m.id].notSeen || pending[m.id].notInterested)).length;

  function submitBatch() {
    const newSaved = { ...saved };
    batch.forEach(m => { newSaved[m.id] = pending[m.id] || { rating: null, notSeen: false, forKids: false, skipped: true }; });
    setSaved(newSaved);
    setPending({});
    setBatchIndex(prev => prev + BATCH_SIZE);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
  }

  const [queueError, setQueueError] = useState("");

  async function refillQueue() {
    setQueueLoading(true);
    setQueueError("");
    const lines = [1,2,3,4,5].map(v => {
      const titles = MOVIES.filter(m => saved[m.id]?.rating === v).map(m => m.title);
      return titles.length ? `${v}/5: ${titles.join(", ")}` : null;
    }).filter(Boolean).join("\n");
    const notInt = Object.values(saved).filter(s => s.notInterested).map(s => s.title).join(", ") || "none";
    const prompt = [
      "You are a movie expert. Suggest 10 films for Matt to rate based on his taste.",
      `His ratings (1=worst 5=best):\n${lines || "none yet"}`,
      `He is NOT interested in: ${notInt}`,
      `Genre focus: ${activeGenre !== "All" ? activeGenre : "any"}`,
      "He avoids romance, horror, gratuitous violence. English-language only.",
      "Suggest well-known or critically acclaimed films he may not have seen.",
      "Return a JSON array of 10 films. Example: [{\"title\":\"The Departed\",\"year\":2006,\"genre\":\"Thriller/Suspense\"},{\"title\":\"Heat\",\"year\":1995,\"genre\":\"Action\"}]"
    ].join("\n\n");
    try {
      const text = await aiComplete(prompt);
      setQueueError("Got response, parsing... preview: " + text.substring(0, 80));
      let suggestions;
      try { suggestions = extractJSON(text, "array"); }
      catch(e) {
        const matches = text.match(/\{[^{}]*"title"[^{}]*\}/g);
        if (matches && matches.length > 0) {
          suggestions = matches.map(m => { try { return JSON.parse(m); } catch { return null; } }).filter(Boolean);
        } else { throw new Error("Parse failed. Raw: " + text.substring(0, 150)); }
      }
      const newMovies = suggestions.slice(0, 10).map((s, i) => ({
        id: "ai_" + Date.now() + "_" + i,
        title: s.title, year: s.year || "", genre: s.genre || activeGenre || "Action", ai: true
      }));
      setQueue(prev => [...prev, ...newMovies]);
      setQueueError("");
    } catch(e) {
      setQueueError("Refill failed: " + e.message);
    }
    setQueueLoading(false);
  }

  function rateRecMovie(rec, rating) {
    const movie = MOVIES.find(m => m.title.toLowerCase() === rec.title.toLowerCase());
    const key = movie ? movie.id : "custom_" + rec.title.replace(/\s+/g, "_").toLowerCase();
    setSaved(prev => ({ ...prev, [key]: { ...prev[key], rating, title: rec.title, year: rec.year, genre: rec.genre || "Unknown" } }));
    setRecResults(prev => prev.map(r => r.title === rec.title ? { ...r, savedRating: rating, notInterested: false } : r));
  }

  function notInterestedRec(rec) {
    const movie = MOVIES.find(m => m.title.toLowerCase() === rec.title.toLowerCase());
    const key = movie ? movie.id : "custom_" + rec.title.replace(/\s+/g, "_").toLowerCase();
    setSaved(prev => ({ ...prev, [key]: { ...prev[key], notInterested: true, title: rec.title, year: rec.year } }));
    setRecResults(prev => prev.map(r => r.title === rec.title ? { ...r, notInterested: true, savedRating: null } : r));
    setNotTonightList(prev => prev.filter(t => t !== rec.title));
  }

  function toggleNotTonight(rec) {
    setNotTonightList(prev => prev.includes(rec.title) ? prev.filter(t => t !== rec.title) : [...prev, rec.title]);
  }

  function getRecRating(rec) {
    const movie = MOVIES.find(m => m.title.toLowerCase() === rec.title.toLowerCase());
    if (movie && saved[movie.id]?.rating) return saved[movie.id].rating;
    const key = "custom_" + rec.title.replace(/\s+/g, "_").toLowerCase();
    return saved[key]?.rating || rec.savedRating || null;
  }

  function isNotInterested(rec) {
    const movie = MOVIES.find(m => m.title.toLowerCase() === rec.title.toLowerCase());
    if (movie) return !!saved[movie.id]?.notInterested;
    const key = "custom_" + rec.title.replace(/\s+/g, "_").toLowerCase();
    return !!saved[key]?.notInterested;
  }

  const allRecsResponded = recResults && recResults.length > 0 && recResults.every(r =>
    getRecRating(r) || isNotInterested(r) || notTonightList.includes(r.title)
  );

  async function generateProfile(genre) {
    setLoadingProfile(genre);
    const movies = MOVIES.filter(m => m.genre === genre);
    const lines = [1,2,3,4,5].map(v => {
      const titles = movies.filter(m => saved[m.id]?.rating === v).map(m => m.title);
      return titles.length ? `${v}/5: ${titles.join(", ")}` : null;
    }).filter(Boolean).join("\n");
    const allRatedLines = [1,2,3,4,5].map(v => {
      const titles = MOVIES.filter(m => saved[m.id]?.rating === v).map(m => m.title);
      return titles.length ? `${v}/5: ${titles.join(", ")}` : null;
    }).filter(Boolean).join("\n");

    const prompt = `You are a witty, insightful film critic writing a personality profile for someone based on their movie taste.

Their ${genre} ratings:
${lines}

All their ratings across all genres:
${allRatedLines || "same as above"}

Write a personality profile that:
1. Has a punchy, fun 4-6 word title (like a magazine archetype — e.g. "The Reluctant Intellectual", "Controlled Chaos Enthusiast")
2. Tells them WHO THEY ARE as a person based on these movies — not just what films they like. What does this say about their values, how they see the world, what they need from a movie experience?
3. Calls out specific films as evidence — e.g. "The fact that you gave Gladiator a perfect score but found Tenet boring says everything..."
4. Has a playful, warm tone — like a smart friend who knows you well, not a film school essay
5. 3-4 sentences total

Return JSON only: {"title":"...","description":"..."}`;
    try {
      const text = await aiComplete(prompt);
      setProfiles(prev => ({ ...prev, [genre]: extractJSON(text, "object") }));
    } catch(e) {
      setProfiles(prev => ({ ...prev, [genre]: { title: "Error", description: e.message } }));
    }
    setLoadingProfile(null);
  }

  async function getRecs() {
    setRecLoading(true);
    setRecResults(null);
    setRecError("");
    setNotTonightList([]);
    const lines = [1,2,3,4,5].map(v => {
      const titles = MOVIES.filter(m => saved[m.id]?.rating === v).map(m => m.title);
      return titles.length ? `${v}/5: ${titles.join(", ")}` : null;
    }).filter(Boolean).join("\n");
    const seen = MOVIES.filter(m => saved[m.id]?.rating).map(m => m.title).join(", ") || "none";
    const notInt = Object.values(saved).filter(s => s.notInterested).map(s => s.title).join(", ") || "none";
    const kids = MOVIES.filter(m => saved[m.id]?.forKids).map(m => m.title).join(", ") || "none";
    const forKids = recAudience === "With Boys";
    const prompt = [
      "You are a movie expert. Recommend 3 films for Matt.",
      `Ratings (1=worst 5=best):\n${lines || "none yet"}`,
      `DO NOT recommend: ${seen}`,
      `Not interested in: ${notInt}`,
      `Watching with: ${recAudience}`,
      forKids ? `Kid-appropriate only (ages 8-12). Kid-approved: ${kids}` : "",
      `Genre: ${recGenre || "any"}`,
      `Vibe: ${recVibe || "any"}`,
      "Avoids romance, horror, gratuitous violence. English only.",
      "Streaming: Max, Hulu, Apple TV+, Amazon Prime, Disney+, Peacock. Renting ok.",
      "Keep each reason to 15 words max. Return JSON array: [{\"title\":\"...\",\"year\":2020,\"reason\":\"...\",\"streaming\":\"...\"}]"
    ].filter(Boolean).join("\n\n");
    try {
      const text = await aiComplete(prompt);
      let recs;
      try { recs = extractJSON(text, "array"); }
      catch(e) {
        const matches = text.match(/\{[^{}]*"title"[^{}]*"streaming"[^{}]*\}/g);
        if (matches && matches.length > 0) {
          recs = matches.map(m => { try { return JSON.parse(m); } catch { return null; } }).filter(Boolean);
        } else { throw e; }
      }
      setRecResults(recs);
    } catch(e) { setRecError(e.message); }
    setRecLoading(false);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ saved, profiles }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "film-vault-backup.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.saved) setSaved(data.saved);
        if (data.profiles) setProfiles(data.profiles);
        alert("Import successful!");
      } catch { alert("Invalid backup file."); }
    };
    reader.readAsText(file);
  }

  const pillStyle = (active) => ({ background: active ? "#3a3a8a" : "#1a1a2e", border: active ? "1px solid #8888ff" : "1px solid #2a2a4a", borderRadius: 20, padding: "5px 12px", color: active ? "#c8c8ff" : "#8888aa", fontSize: 11, cursor: "pointer", fontFamily: "monospace", transition: "all 0.2s" });
  const audStyle = (active) => ({ background: active ? "#3a3a8a" : "#0d0d1a", border: active ? "1.5px solid #8888ff" : "1.5px solid #2a2a4a", borderRadius: 10, padding: "8px 14px", color: active ? "#c8c8ff" : "#8888aa", fontSize: 12, cursor: "pointer", fontFamily: "monospace", transition: "all 0.2s" });

  return (
    <div style={{ background: "#0a0a1a", color: "#e8e8f8", fontFamily: "'DM Sans', sans-serif", minHeight: "100vh" }}>
      <div ref={topRef} style={{ background: "linear-gradient(135deg, #0d0d2a, #1a0a2e)", borderBottom: "1px solid #2a2a5a", padding: "20px 20px 0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "#e8e8ff", margin: "0 0 2px" }}>🎬 Matt's Film Vault</h1>
              <p style={{ color: "#6666aa", fontSize: 11, fontFamily: "monospace", margin: "0 0 16px" }}>{totalRated} rated · {queue.length} in queue</p>
            </div>
            <button onClick={() => setShowSettings(!showSettings)} style={{ background: "transparent", border: "none", color: "#6666aa", fontSize: 20, cursor: "pointer", padding: "4px" }}>⚙️</button>
          </div>
          {showSettings && (
            <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ color: "#aaaacc", fontFamily: "monospace", fontSize: 12, marginBottom: 4 }}>Backup & Restore</div>
              <button onClick={exportData} style={{ background: "#2a2a5a", border: "1px solid #4a4aaa", borderRadius: 8, padding: "8px 16px", color: "#c8c8ff", fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>⬇️ Export Ratings</button>
              <label style={{ background: "#2a2a5a", border: "1px solid #4a4aaa", borderRadius: 8, padding: "8px 16px", color: "#c8c8ff", fontSize: 12, cursor: "pointer", fontFamily: "monospace", textAlign: "center" }}>
                ⬆️ Import Ratings
                <input type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
              </label>
            </div>
          )}
          <div style={{ display: "flex" }}>
            {[["rate","📋 Rate"],["profiles","📊 Profiles"],["recs","🤖 Recs"]].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)} style={{ background: tab===t ? "#1a1a3a" : "transparent", border: "none", borderBottom: tab===t ? "2px solid #8888ff" : "2px solid transparent", color: tab===t ? "#c8c8ff" : "#6666aa", padding: "8px 18px", cursor: "pointer", fontFamily: "monospace", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>

        {tab === "rate" && (
          <div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
              {["All", ...GENRES].map(g => <button key={g} onClick={() => setActiveGenre(g)} style={pillStyle(activeGenre === g)}>{g}</button>)}
            </div>
            {batch.length === 0 && queue.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6666aa", fontFamily: "monospace" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
                <div style={{ marginBottom: 16 }}>All caught up{activeGenre !== "All" ? " in " + activeGenre : ""}!</div>
                <button onClick={refillQueue} disabled={queueLoading} style={{ background: "linear-gradient(135deg, #3a3a9a, #5a3a9a)", border: "none", borderRadius: 12, padding: "12px 24px", color: "#e8e8ff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Playfair Display', serif" }}>
                  {queueLoading ? "✨ Finding films..." : "✨ AI Refill Queue"}
                </button>
                {queueError && <p style={{ color: "#f87171", fontFamily: "monospace", fontSize: 11, marginTop: 12 }}>{queueError}</p>}
              </div>
            ) : batch.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#6666aa", fontFamily: "monospace" }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>✅</div><div>Batch done!</div>
              </div>
            ) : (
              <div>
                <div style={{ color: "#6666aa", fontFamily: "monospace", fontSize: 11, marginBottom: 14 }}>
                  Batch {Math.floor(batchIndex / BATCH_SIZE) + 1} · {batch.length} films · {responded}/{batch.length} responded
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
                  {batch.map(m => (
                    <MovieCard key={m.id} movie={m}
                      pending={pending[m.id] || { rating: null, notSeen: false, forKids: false, notInterested: false }}
                      onChange={vals => setPending(prev => ({ ...prev, [m.id]: vals }))} />
                  ))}
                </div>
                <button onClick={submitBatch} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #3a3a9a, #5a3a9a)", border: "none", borderRadius: 14, color: "#e8e8ff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Playfair Display', serif" }}>
                  Submit & Next 5 →
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "profiles" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ color: "#6666aa", fontFamily: "monospace", fontSize: 11, margin: 0 }}>Rate 2+ films per genre to unlock AI taste profiles.</p>
            {GENRES.map(genre => {
              const movies = MOVIES.filter(m => m.genre === genre);
              const rated = movies.filter(m => saved[m.id]?.rating);
              const forKidsCount = movies.filter(m => saved[m.id]?.forKids).length;
              const prof = profiles[genre];
              return (
                <div key={genre} style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 16, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#c8c8ff" }}>{genre}</span>
                    <span style={{ color: "#6666aa", fontFamily: "monospace", fontSize: 11 }}>{rated.length}/{movies.length} rated · 🤪 {forKidsCount}</span>
                  </div>
                  {rated.length >= 2 && (
                    <>
                      <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden", marginBottom: 10, background: "#0d0d1a" }}>
                        {[1,2,3,4,5].map(v => { const c = rated.filter(m => saved[m.id].rating===v).length; return c > 0 ? <div key={v} style={{ flex: c, background: RATING_COLORS[v] }} /> : null; })}
                      </div>
                      <div style={{ display: "flex", gap: 10, fontSize: 11, fontFamily: "monospace", marginBottom: 14 }}>
                        {[1,2,3,4,5].map(v => { const c = rated.filter(m => saved[m.id].rating===v).length; return c > 0 ? <span key={v} style={{ color: RATING_COLORS[v] }}>{RATING_EMOJIS[v]} {c}</span> : null; })}
                      </div>
                    </>
                  )}
                  {rated.length < 2 ? (
                    <div style={{ color: "#3a3a6a", fontFamily: "monospace", fontSize: 11 }}>Rate {2 - rated.length} more to unlock</div>
                  ) : prof ? (
                    <div style={{ background: "#0d0d2a", borderRadius: 10, padding: 14, borderLeft: "3px solid #8888ff" }}>
                      <div style={{ color: "#c8c8ff", fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{prof.title}</div>
                      <div style={{ color: "#aaaacc", fontSize: 13, lineHeight: 1.6 }}>{prof.description}</div>
                      <button onClick={() => generateProfile(genre)} style={{ marginTop: 10, background: "transparent", border: "1px solid #3a3a6a", borderRadius: 8, padding: "4px 10px", color: "#6666aa", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>↻ Refresh</button>
                    </div>
                  ) : (
                    <button onClick={() => generateProfile(genre)} disabled={loadingProfile === genre} style={{ background: loadingProfile === genre ? "#1a1a3a" : "#2a2a5a", border: "1px solid #4a4aaa", borderRadius: 10, padding: "8px 16px", color: "#c8c8ff", fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>
                      {loadingProfile === genre ? "✨ Analyzing..." : "✨ Generate AI Profile"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "recs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "#6666aa", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Who's Watching?</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Solo","With Parents","With Boys"].map(a => <button key={a} onClick={() => setRecAudience(a)} style={audStyle(recAudience === a)}>{a}</button>)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#6666aa", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Genre</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["Any", ...GENRES].map(g => <button key={g} onClick={() => setRecGenre(g === "Any" ? "" : g)} style={pillStyle(recGenre === g || (g === "Any" && !recGenre))}>{g}</button>)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#6666aa", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Tonight's Vibe</div>
                <input value={recVibe} onChange={e => setRecVibe(e.target.value)} placeholder="e.g. epic and emotional, light and fun, tense..."
                  style={{ width: "100%", background: "#0d0d1a", border: "1px solid #2a2a4a", borderRadius: 10, padding: "10px 14px", color: "#e8e8f8", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
              </div>
              <button onClick={getRecs} disabled={!recAudience || recLoading} style={{ background: recAudience && !recLoading ? "linear-gradient(135deg, #3a3a9a, #5a3a9a)" : "#1a1a3a", border: "none", borderRadius: 12, padding: "12px 24px", color: recAudience ? "#e8e8ff" : "#6666aa", fontSize: 14, fontWeight: 700, cursor: recAudience ? "pointer" : "not-allowed", fontFamily: "'Playfair Display', serif" }}>
                {recLoading ? "✨ Finding your films..." : "✨ Get Recommendations"}
              </button>
            </div>

            {recError && <p style={{ color: "#f87171", fontFamily: "monospace", fontSize: 12 }}>Error: {recError}</p>}

            {recResults && recResults.map((r, i) => (
              <RecCard key={i} rec={r}
                savedRating={getRecRating(r)}
                notInterested={isNotInterested(r)}
                notTonight={notTonightList.includes(r.title)}
                onRate={rating => rateRecMovie(r, rating)}
                onNotInterested={() => notInterestedRec(r)}
                onNotTonight={() => toggleNotTonight(r)} />
            ))}

            {allRecsResponded && (
              <button onClick={getRecs} disabled={recLoading} style={{ width: "100%", padding: 14, background: "linear-gradient(135deg, #3a3a9a, #5a3a9a)", border: "none", borderRadius: 14, color: "#e8e8ff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Playfair Display', serif" }}>
                {recLoading ? "✨ Finding more..." : "✨ Get New Recs"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
