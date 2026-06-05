import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json({ limit: "15mb" }));

const MONGODB_URI = process.env.MONGODB_URI || "";
const isMongoConfigured = !!MONGODB_URI;

const RecordSchema = new mongoose.Schema({
  userId:    { type: String, required: true, index: true },
  sheetName: { type: String, required: true, index: true },
  data:      { type: mongoose.Schema.Types.Map, of: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const VaultRecord = (mongoose.models.VaultRecord ||
  mongoose.model("VaultRecord", RecordSchema)) as any;

let cachedDb: typeof mongoose | null = null;
async function connectToDatabase() {
  if (!isMongoConfigured) return null;
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  cachedDb = await mongoose.connect(MONGODB_URI);
  return cachedDb;
}

// ─── Firebase token decoder ─────────────────────────────────────────────────

let firebaseProjectId = "";
try {
  const raw = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8");
  firebaseProjectId = JSON.parse(raw).projectId || "";
} catch {
  try {
    const fallback = path.join(process.cwd(), "dist", "firebase-applet-config.json");
    if (fs.existsSync(fallback))
      firebaseProjectId = JSON.parse(fs.readFileSync(fallback, "utf8")).projectId || "";
  } catch {
    console.warn("[Auth] firebase-applet-config.json not found.");
  }
}

function decodeFirebaseToken(token: string): { uid: string; email?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    const nowSecs = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSecs) return null;
    if (firebaseProjectId) {
      if (payload.aud !== firebaseProjectId) return null;
      if (payload.iss !== `https://securetoken.google.com/${firebaseProjectId}`) return null;
    }
    if (!payload.sub) return null;
    return { uid: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

// ─── Auth middleware ────────────────────────────────────────────────────────

const authenticateUser = async (req: any, res: any, next: any) => {
  try {
    if (isMongoConfigured) await connectToDatabase();
  } catch (err: any) {
    return res.status(503).json({ error: `Database connection error: ${err.message}` });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized. Missing bearer token." });
  const decoded = decodeFirebaseToken(authHeader.split(" ")[1]);
  if (!decoded) return res.status(401).json({ error: "Unauthorized. Invalid or expired token." });
  req.userId = decoded.uid;
  req.userEmail = decoded.email;
  next();
};

// ─── Status ─────────────────────────────────────────────────────────────────

app.get("/api/mongodb/status", async (_req: any, res: any) => {
  try {
    if (isMongoConfigured) await connectToDatabase();
    res.json({ connected: isMongoConfigured && mongoose.connection.readyState === 1, uriConfigured: isMongoConfigured });
  } catch (err: any) {
    res.json({ connected: false, uriConfigured: isMongoConfigured, error: err.message });
  }
});

// ─── Read records ────────────────────────────────────────────────────────────

app.get("/api/mongodb/records", authenticateUser, async (req: any, res: any) => {
  try {
    const grouped: Record<string, any[]> = {
      "PersonalData": [], "FinancialData": [], "Card": [],
      "Media/Gmail": [], "Others": [], "Documents": [],
    };
    const docs = await VaultRecord.find({ userId: req.userId });
    docs.forEach((doc: any) => {
      if (grouped[doc.sheetName]) {
        const rawData = doc.data instanceof Map ? Object.fromEntries(doc.data) : (doc.data || {});
        grouped[doc.sheetName].push({ _rowNum: doc._id.toString(), sheetName: doc.sheetName, ...rawData });
      }
    });
    res.json({ success: true, isLive: true, data: grouped });
  } catch (err: any) {
    console.error("[Records] Read error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Create record ───────────────────────────────────────────────────────────

app.post("/api/mongodb/records", authenticateUser, async (req: any, res: any) => {
  try {
    const { sheetName, ...data } = req.body;
    if (!sheetName) return res.status(400).json({ error: "sheetName is required" });
    const record = new VaultRecord({ userId: req.userId, sheetName, data });
    await record.save();
    res.json({ success: true, message: "Record saved to MongoDB.", id: record._id });
  } catch (err: any) {
    console.error("[Records] Create error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Update record ───────────────────────────────────────────────────────────

app.put("/api/mongodb/records/:id", authenticateUser, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { _rowNum, sheetName, createdAt, updatedAt, ...cleanData } = req.body;
    const record = await VaultRecord.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { data: cleanData } },
      { new: true },
    );
    if (!record) return res.status(404).json({ error: "Item not found or unauthorized." });
    res.json({ success: true, message: "Record updated successfully!", id: record._id });
  } catch (err: any) {
    console.error("[Records] Update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Delete record ───────────────────────────────────────────────────────────

app.delete("/api/mongodb/records/:id", authenticateUser, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const record = await VaultRecord.findOneAndDelete({ _id: id, userId: req.userId });
    if (!record) return res.status(404).json({ error: "Item not found or unauthorized." });
    res.json({ success: true, message: "Record deleted from MongoDB." });
  } catch (err: any) {
    console.error("[Records] Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Vault context builder ────────────────────────────────────────────────────

function buildVaultContext(data: Record<string, any[]>): string {
  const labels: Record<string, string> = {
    "PersonalData":  "Personal Information",
    "FinancialData": "Bank Accounts & Financial",
    "Card":          "Credit/Debit Cards",
    "Media/Gmail":   "Social Media & Online Accounts",
    "Others":        "Other Records",
    "Documents":     "Documents & IDs",
  };
  const parts: string[] = [];
  for (const [sheet, records] of Object.entries(data || {})) {
    if (!records?.length) continue;
    parts.push(`\n### ${labels[sheet] || sheet} (${records.length} record${records.length > 1 ? "s" : ""})`);
    records.forEach((rec, idx) => {
      parts.push(`\nRecord ${idx + 1}:`);
      for (const [k, v] of Object.entries(rec)) {
        if (k.startsWith("_") || k === "sheetName" || !v) continue;
        parts.push(k === "FileAttachment" ? `  ${k}: [file attached]` : `  ${k}: ${v}`);
      }
    });
  }
  return parts.join("\n") || "Vault is empty.";
}

// ─── Gemini helper with retry + fallback models ───────────────────────────────

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
];

async function callGemini(
  apiKey: string,
  contents: any[],
  systemInstruction: string,
): Promise<{ text: string; model: string }> {
  const ai = new GoogleGenAI({ apiKey });
  let lastError: any;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: { systemInstruction, maxOutputTokens: 600 },
        });
        return { text: response.text ?? "", model };
      } catch (err: any) {
        lastError = err;
        const msg: string = err?.message ?? "";
        const isRetryable =
          msg.includes("503") || msg.includes("UNAVAILABLE") ||
          msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("high demand") || msg.includes("overloaded");

        console.warn(`[Gemini] ${model} attempt ${attempt + 1} failed: ${msg}`);

        if (isRetryable) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        break;
      }
    }
  }

  throw lastError ?? new Error("All Gemini models failed.");
}

// ─── Gemini AI Chat ───────────────────────────────────────────────────────────

app.post("/api/chat", authenticateUser, async (req: any, res: any) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
  if (!GEMINI_API_KEY)
    return res.status(503).json({ error: "GEMINI_API_KEY not configured on server." });

  const { message, vaultData, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "message is required" });

  const systemInstruction = `You are Vault AI, a smart personal assistant inside "My Vault" — a secure personal data manager. You have full access to the user's vault data below.

FORMATTING RULES (strictly follow):
- Use plain bullet points with "• " (bullet character + space), NOT asterisks or dashes
- Bold important labels like names or field titles using **text**
- Keep responses short and scannable
- No markdown headers (#, ##), no --- dividers
- If asked for a password or sensitive value, provide it directly — the user owns this data
- Never make up data not in the vault

NAVIGATION: At the very end of your reply, if the answer is specifically about ONE category, append exactly one of these tags on its own line:
[NAVIGATE:personal] — for Personal Information
[NAVIGATE:financial] — for Bank Accounts & Financial
[NAVIGATE:card] — for Credit/Debit Cards
[NAVIGATE:media] — for Social Media & Online Accounts
[NAVIGATE:others] — for Other Records
[NAVIGATE:documents] — for Documents & IDs
Only add one tag when it makes sense to go there. Skip the tag for general questions.

USER'S VAULT DATA:
${buildVaultContext(vaultData)}

Today: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`;

  try {
    const contents: any[] = (history as any[]).slice(-10).map((m: any) => ({
      role: m.role === "bot" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    contents.push({ role: "user", parts: [{ text: message }] });

    const { text, model } = await callGemini(GEMINI_API_KEY, contents, systemInstruction);
    return res.json({ reply: text, model });
  } catch (err: any) {
    console.error("[Chat] All Gemini models failed:", err?.message);
    return res.status(500).json({
      error: err?.message || "Gemini service temporarily unavailable. Please try again.",
    });
  }
});

export default app;
