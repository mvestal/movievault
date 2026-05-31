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
  let clean = text.replace(/```json\s*/gi, "").replace
