export async function aiComplete(prompt) {
  const response = await fetch("/.netlify/functions/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  if (data.type === "error") throw new Error(data.error.message);
  return data.content?.find(b => b.type === "text")?.text || "";
}

export function extractJSON(text, type) {
  var clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    var parsed = JSON.parse(clean);
    if (type === "array") {
      if (Array.isArray(parsed)) return parsed;
      var keys = Object.keys(parsed);
      for (var i = 0; i < keys.length; i++) {
        if (Array.isArray(parsed[keys[i]])) return parsed[keys[i]];
      }
    }
    return parsed;
  } catch(e) {}
  var pattern = type === "array" ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  var match = clean.match(pattern);
  if (!match) throw new Error("No JSON found: " + clean.substring(0, 150));
  return JSON.parse(match[0]);
}
