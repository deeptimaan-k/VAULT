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

  const { message, vaultData, history = [], files = [] } = req.body;
  const hasFiles = Array.isArray(files) && files.length > 0;

  if (!message?.trim() && !hasFiles)
    return res.status(400).json({ error: "message or files required" });

  const ALLOWED_MIME = ["image/jpeg","image/png","image/webp","image/gif","application/pdf"];
  if (hasFiles) {
    for (const f of files as any[]) {
      if (!ALLOWED_MIME.includes(f.mimeType))
        return res.status(400).json({ error: `Unsupported file type: ${f.mimeType}` });
      if ((f.base64?.length ?? 0) > 7_000_000)
        return res.status(400).json({ error: "File too large. Max 4MB per file." });
    }
  }

  const docMode = hasFiles ? `

═══ DOCUMENT SCAN MODE ═══
The user uploaded ${files.length === 2 ? "TWO images (FRONT + BACK of the same document)" : "ONE document image"}.

Instructions:
1. Read ALL visible text carefully — every number, name, date, address
2. Identify the document type
3. List every extracted field as bullet points using **Field**: Value format
4. At the VERY END (last line), append the save tag:
   [SAVE:CategoryName:{"Field":"Value"}]

Category + field mapping:
• Aadhaar Card  → [SAVE:PersonalData:{"Name":"","DOB":"","AdharNumber":"","MobileNumber":"","Address":""}]
• PAN Card      → [SAVE:PersonalData:{"Name":"","DOB":"","PanNumber":"","FatherName":""}]
• Driving Lic.  → [SAVE:PersonalData:{"Name":"","DOB":"","DrivingLicence":"","MobileNumber":"","Address":""}]
• Passport      → [SAVE:PersonalData:{"Name":"","DOB":"","PassportNumber":"","Expiry":"","Address":""}]
• Voter ID      → [SAVE:PersonalData:{"Name":"","DOB":"","EpicNumber":"","Address":""}]
• Bank Passbook → [SAVE:FinancialData:{"AccountHolderName":"","BankName":"","AccountNumber":"","IFSC":"","AccountType":"","BranchName":""}]
• Credit Card   → [SAVE:Card:{"CardHolderName":"","CardNumber":"","Expiry":"","CardType":"","IssuedBank":"","Debit/Credit":"Credit"}]
• Debit Card    → [SAVE:Card:{"CardHolderName":"","CardNumber":"","Expiry":"","CardType":"","IssuedBank":"","Debit/Credit":"Debit"}]
• Other         → [SAVE:Documents:{"Title":"","DocType":"","DocNumber":"","IssuedBy":"","IssueDate":"","ExpiryDate":""}]

Rules: only fill clearly visible fields, leave others "", valid JSON, [SAVE:...] is the absolute last line.` : "";

  const systemInstruction = `You are Radiant AI, a smart personal assistant inside "My Vault" — a secure personal data manager. You have full access to the user's vault data below.

FORMATTING RULES:
- Use plain bullet points with "• " (bullet + space), NOT asterisks or dashes
- Bold important labels using **text**
- Keep responses short and scannable
- No markdown headers (#, ##), no --- dividers
- If asked for a password or sensitive value, provide it — the user owns this data
- Never make up data not in the vault

NAVIGATION: At the end of your reply for text queries only, if about ONE category append one tag:
[NAVIGATE:personal] [NAVIGATE:financial] [NAVIGATE:card] [NAVIGATE:media] [NAVIGATE:others] [NAVIGATE:documents]
Do NOT add NAVIGATE in document scan mode.

USER'S VAULT DATA:
${buildVaultContext(vaultData)}

Today: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}${docMode}`;

  try {
    const contents: any[] = (history as any[]).slice(-10).map((m: any) => ({
      role: m.role === "bot" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const parts: any[] = [];
    if (hasFiles) {
      for (const f of files as any[]) {
        if (f.base64 && f.mimeType) {
          parts.push({ inlineData: { mimeType: f.mimeType, data: f.base64 } });
        }
      }
    }
    parts.push({ text: message?.trim() || "Extract all information from this document and identify its type." });
    contents.push({ role: "user", parts });

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
