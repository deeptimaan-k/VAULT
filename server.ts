import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

// ─── MongoDB ────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI || "";

const RecordSchema = new mongoose.Schema({
  userId:    { type: String, required: true, index: true },
  sheetName: { type: String, required: true, index: true },
  data:      { type: mongoose.Schema.Types.Map, of: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

const VaultRecord = (mongoose.models.VaultRecord ||
  mongoose.model("VaultRecord", RecordSchema)) as any;

let isMongoConfigured = false;
if (MONGODB_URI) {
  isMongoConfigured = true;
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("[MongoDB] Connected."))
    .catch(err => console.error("[MongoDB] Connection failed:", err));
} else {
  console.warn("[MongoDB] MONGODB_URI not set — using sandbox fallback.");
}

// ─── Firebase token decoder ─────────────────────────────────────────────────

let firebaseProjectId = "";
try {
  const raw = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8");
  firebaseProjectId = JSON.parse(raw).projectId || "";
} catch {
  console.warn("[Auth] firebase-applet-config.json not found — basic token validation only.");
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

// ─── Sandbox (offline) DB ──────────────────────────────────────────────────

interface SandboxDoc {
  _id: string; userId: string; sheetName: string;
  data: any; createdAt: string; updatedAt: string;
}

const SANDBOX_FILE = path.join(process.cwd(), "sandbox_vault_db.json");

function loadSandboxDocs(): SandboxDoc[] {
  try {
    if (fs.existsSync(SANDBOX_FILE))
      return JSON.parse(fs.readFileSync(SANDBOX_FILE, "utf8"));
  } catch { /* ignore */ }
  return [];
}

function saveSandboxDocs(docs: SandboxDoc[]) {
  try { fs.writeFileSync(SANDBOX_FILE, JSON.stringify(docs, null, 2), "utf8"); }
  catch (e) { console.error("[Sandbox] Write failed:", e); }
}

const DEFAULT_SEED_DATA: Record<string, any[]> = {
  "PersonalData": [
    { Name: "Aarav Sharma", DOB: "1994-08-14", AdharNumber: "5123 4567 8901",
      PanNumber: "BPLPS1234H", DrivingLicence: "DL-1420160089234",
      MobileNumber: "+91 98123 45678", AlternateMobileNumber: "+91 98123 99999",
      EmailID: "aarav.sharma@gmail.com", EpicNumber: "XYZ1234567" },
    { Name: "Diya Patel", DOB: "2000-11-23", AdharNumber: "9876 5432 1098",
      PanNumber: "CLYPP9988G", DrivingLicence: "GJ-0120190014321",
      MobileNumber: "+91 98765 43210", AlternateMobileNumber: "",
      EmailID: "diya.patel@hotmail.com", EpicNumber: "ABC9876543" },
  ],
  "FinancialData": [
    { AccountHolderName: "Aarav Sharma", AccountType: "Savings", BankName: "HDFC Bank",
      AccountNumber: "50100234567891", IFSC: "HDFC0000012", UserID: "aarav_hdfc_net",
      Password: "SecurePassword123!", LinkedMobileNumber: "+91 98123 45678",
      LinkedEmail: "aarav.sharma@gmail.com",
      SecurityAnswers: "First pet: Sparky. Place of birth: New Delhi.",
      CustomerID: "88127394", ProfilePassword: "ProfilePass1!" },
  ],
  "Card": [
    { "Debit/Credit": "Credit", CardType: "Visa", IssuedBank: "SBI Card",
      CardNumber: "4321-8899-7711-0022", Expiry: "09/28", CVV: "452",
      PIN: "4102", CardHolderName: "AARAV SHARMA" },
  ],
  "Media/Gmail": [
    { Particulars: "Google Account (Primary)", Userid: "as.sharma.1994@gmail.com",
      Password: "MySuperSecretGmailPass2026", MobileNumber: "+91 98123 45678",
      RecoveryMail: "recovery.sharma@outlook.com" },
  ],
  "Others": [
    { Particulars: "Apt B4 Wi-Fi", Userid: "Sharma_Home_5G",
      Password: "sharmasignalkey9988", MobileNumber: "",
      Remarks: "Router sits behind the main smart TV in the living room." },
  ],
  "Documents": [
    { Title: "Adhar Scan Copy", DocType: "Aadhaar Card", DocNumber: "5123 4567 8901",
      FileAttachment: "" },
  ],
};

// ─── Vault context builder (for Gemini prompt) ─────────────────────────────

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

// ─── Gemini helper with retry + fallback models ────────────────────────────

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
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        break; // non-retryable error — skip to next model
      }
    }
  }

  throw lastError ?? new Error("All Gemini models failed.");
}

// ─── Server ────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Auth middleware
  const authenticateUser = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized. Missing bearer token." });
    }
    const decoded = decodeFirebaseToken(authHeader.split(" ")[1]);
    if (!decoded) {
      return res.status(401).json({ error: "Unauthorized. Invalid or expired token." });
    }
    req.userId = decoded.uid;
    req.userEmail = decoded.email;
    next();
  };

  // ── Status ──────────────────────────────────────────────────────────────

  app.get("/api/mongodb/status", (_req: any, res: any) => {
    res.json({ connected: mongoose.connection.readyState === 1, uriConfigured: isMongoConfigured });
  });

  // ── Read records ────────────────────────────────────────────────────────

  app.get("/api/mongodb/records", authenticateUser, async (req: any, res: any) => {
    try {
      const grouped: Record<string, any[]> = {
        "PersonalData": [], "FinancialData": [], "Card": [],
        "Media/Gmail": [], "Others": [], "Documents": [],
      };

      if (!isMongoConfigured) {
        let allDocs = loadSandboxDocs();
        let userDocs = allDocs.filter(d => d.userId === req.userId);

        if (userDocs.length === 0) {
          const nowIso = new Date().toISOString();
          const seedDocs: SandboxDoc[] = [];
          for (const [sheetName, items] of Object.entries(DEFAULT_SEED_DATA)) {
            items.forEach((item, i) => {
              seedDocs.push({
                _id: `${sheetName}_${req.userId}_${i}_${Math.random().toString(36).substring(2, 9)}`,
                userId: req.userId, sheetName, data: item,
                createdAt: nowIso, updatedAt: nowIso,
              });
            });
          }
          allDocs = [...allDocs, ...seedDocs];
          saveSandboxDocs(allDocs);
          userDocs = seedDocs;
        }

        userDocs.forEach(doc => {
          if (grouped[doc.sheetName]) {
            grouped[doc.sheetName].push({ _rowNum: doc._id, sheetName: doc.sheetName, ...doc.data });
          }
        });

        return res.json({ success: true, isLive: false, data: grouped });
      }

      let docs = await VaultRecord.find({ userId: req.userId });

      if (docs.length === 0) {
        const promises: Promise<any>[] = [];
        for (const [sheetName, items] of Object.entries(DEFAULT_SEED_DATA)) {
          for (const item of items) {
            promises.push(new VaultRecord({ userId: req.userId, sheetName, data: item }).save());
          }
        }
        await Promise.all(promises);
        docs = await VaultRecord.find({ userId: req.userId });
      }

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

  // ── Create record ───────────────────────────────────────────────────────

  app.post("/api/mongodb/records", authenticateUser, async (req: any, res: any) => {
    try {
      const { sheetName, ...data } = req.body;
      if (!sheetName) return res.status(400).json({ error: "sheetName is required" });

      if (!isMongoConfigured) {
        const allDocs = loadSandboxDocs();
        const nowIso = new Date().toISOString();
        const newId = `rec_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
        allDocs.push({ _id: newId, userId: req.userId, sheetName, data, createdAt: nowIso, updatedAt: nowIso });
        saveSandboxDocs(allDocs);
        return res.json({ success: true, message: "Record saved to sandbox.", id: newId });
      }

      const record = new VaultRecord({ userId: req.userId, sheetName, data });
      await record.save();
      res.json({ success: true, message: "Record saved to MongoDB.", id: record._id });
    } catch (err: any) {
      console.error("[Records] Create error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Update record ───────────────────────────────────────────────────────

  app.put("/api/mongodb/records/:id", authenticateUser, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { _rowNum, sheetName, createdAt, updatedAt, ...cleanData } = req.body;

      if (!isMongoConfigured) {
        const allDocs = loadSandboxDocs();
        const idx = allDocs.findIndex(d => d._id === id && d.userId === req.userId);
        if (idx === -1) return res.status(404).json({ error: "Record not found." });
        allDocs[idx].data = cleanData;
        allDocs[idx].updatedAt = new Date().toISOString();
        saveSandboxDocs(allDocs);
        return res.json({ success: true, message: "Record updated in sandbox." });
      }

      const record = await VaultRecord.findOneAndUpdate(
        { _id: id, userId: req.userId },
        { $set: { data: cleanData } },
        { new: true },
      );
      if (!record) return res.status(404).json({ error: "Record not found." });
      res.json({ success: true, message: "Record updated in MongoDB." });
    } catch (err: any) {
      console.error("[Records] Update error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Delete record ───────────────────────────────────────────────────────

  app.delete("/api/mongodb/records/:id", authenticateUser, async (req: any, res: any) => {
    try {
      const { id } = req.params;

      if (!isMongoConfigured) {
        let allDocs = loadSandboxDocs();
        const before = allDocs.length;
        allDocs = allDocs.filter(d => !(d._id === id && d.userId === req.userId));
        if (allDocs.length === before) return res.status(404).json({ error: "Record not found." });
        saveSandboxDocs(allDocs);
        return res.json({ success: true, message: "Record deleted from sandbox." });
      }

      const record = await VaultRecord.findOneAndDelete({ _id: id, userId: req.userId });
      if (!record) return res.status(404).json({ error: "Record not found." });
      res.json({ success: true, message: "Record deleted from MongoDB." });
    } catch (err: any) {
      console.error("[Records] Delete error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Gemini AI Chat ──────────────────────────────────────────────────────

  app.post("/api/chat", authenticateUser, async (req: any, res: any) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
    if (!GEMINI_API_KEY) {
      return res.status(503).json({ error: "GEMINI_API_KEY not configured. Add it to .env." });
    }

    const { message, vaultData, history = [], files = [] } = req.body;
    const hasFiles = Array.isArray(files) && files.length > 0;

    if (!message?.trim() && !hasFiles) {
      return res.status(400).json({ error: "message or files required" });
    }

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

      // Build current message — images first, then text
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
  }); // ← route handler correctly closed here

  // ── Static / Vite middleware ────────────────────────────────────────────

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
    console.log("[Server] Vite dev middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: any, res: any) => res.sendFile(path.join(distPath, "index.html")));
    console.log("[Server] Serving production build from dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Vault server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
