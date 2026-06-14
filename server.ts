import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const SYSTEM_INSTRUCTIONS = `你是一位專業的翻譯員，擅長將英文文章翻譯成流利的繁體中文。
請嚴格遵守以下規則：
1. 輸出格式必須是以一行原文(英文)，下一行翻譯(中文)的方式呈現。
2. 如果輸入的文章較長，請確保每一段英文後方緊接著對應的中文翻譯。
3. 保持專業、流利且自然的翻譯風格。
4. 所有的 UI 與回覆文字都必須使用繁體中文。
5. 每次翻譯時請參考對話歷史以保持脈絡一致。
6. 如果使用者要求翻譯，直接給出翻譯結果，不要有額外的開場白或結語。`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  let aiClient: GoogleGenAI | null = null;
  function getAI() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });
    }
    return aiClient;
  }

  // API Routes
  app.post("/api/translate", async (req, res) => {
    try {
      const { messages } = req.body;
      const ai = getAI();
      
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: messages,
        config: {
          systemInstruction: SYSTEM_INSTRUCTIONS,
          temperature: 0.3, // Lower temperature for more consistent translation
        },
      });

      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Translation error:", error);
      res.status(500).json({ error: error.message || "伺服器內部錯誤" });
    }
  });

  // Vite Integration
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
}

startServer();
