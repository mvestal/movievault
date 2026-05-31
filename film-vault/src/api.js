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

export function extractJSON(text, type = "array") {
  const pattern = type === "array" ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = text.match(pattern);
  if (!match) throw new Error("No JSON found in response");
  return JSON.parse(match[0]);
}
