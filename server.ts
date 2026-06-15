import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3006; // changed to avoid conflict

// Basic CORS for development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

// Stub translation endpoint – echoes the user input
app.post("/api/translate", async (req, res) => {
  try {
    const { messages } = req.body;
    const userTexts = messages
      .filter((m: any) => m.role === "user")
      .map((m: any) => m.parts[0].text)
      .join("\n");
    // Use Google Translate public endpoint for Traditional Chinese (zh-TW)
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q=${encodeURIComponent(userTexts)}`);
    const data = await response.json();
    const translated = data[0].map((segment: any) => segment[0]).join("");
    res.json({ text: translated, original: userTexts });
  } catch (error: any) {
    console.error("Translation error:", error);
    res.status(500).json({ error: error.message || "伺服器內部錯誤" });
  }
});

// Vite integration – serve the front‑end during development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
