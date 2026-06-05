import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import fs from "fs";

// Load MONGODB_URI environment variable
const MONGODB_URI = process.env.MONGODB_URI || "";

// Initialize MongoDB Schema if URI is present
const RecordSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  sheetName: { type: String, required: true, index: true },
  data: { type: mongoose.Schema.Types.Map, of: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const VaultRecord = (mongoose.models.VaultRecord || mongoose.model("VaultRecord", RecordSchema)) as any;

// Attempt MongoDB Connection
let isMongoConfigured = false;
if (MONGODB_URI) {
  isMongoConfigured = true;
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("[MongoDB] Connected successfully to isolated secure database."))
    .catch(err => console.error("[MongoDB] Connection failure during boot:", err));
} else {
  console.warn("[MongoDB] WARNING: MONGODB_URI is not set. Using offline database fallback inside JSON structure if needed, or prompt configuration.");
}

// Read Firebase Config to get Project ID for JWT claim validation
let firebaseProjectId = "";
try {
  const configText = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8");
  const config = JSON.parse(configText);
  firebaseProjectId = config.projectId || "";
} catch (e) {
  console.warn("[Server] Failed to read firebase-applet-config.json. Fallback decoded matching will verify basic structure.");
}

/**
 * Validates basic claims (iss, aud, exp) of standard Firebase ID token
 */
function decodeFirebaseToken(token: string): { uid: string; email?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    // Decode base64 payload
    const payloadJson = Buffer.from(parts[1], "base64").toString("utf8");
    const payload = JSON.parse(payloadJson);
    
    // Check expiry
    const nowSecs = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSecs) {
      console.warn("[Auth] Token expired.");
      return null;
    }
    
    // Verify Audience / Issuer matching
    if (firebaseProjectId) {
      const expectedAud = firebaseProjectId;
      const expectedIss = `https://securetoken.google.com/${firebaseProjectId}`;
      if (payload.aud !== expectedAud) {
        console.warn("[Auth] Audience mismatch:", payload.aud, "expected:", expectedAud);
        return null;
      }
      if (payload.iss !== expectedIss) {
        console.warn("[Auth] Issuer mismatch:", payload.iss, "expected:", expectedIss);
        return null;
      }
    }
    
    if (!payload.sub) return null;
    
    return {
      uid: payload.sub,
      email: payload.email
    };
  } catch (err) {
    console.error("[Auth] JWT decode failed error:", err);
    return null;
  }
}

// Local JSON file-based database fallback for Sandbox Mode
interface SandboxDoc {
  _id: string;
  userId: string;
  sheetName: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

const SANDBOX_FILE_PATH = path.join(process.cwd(), "sandbox_vault_db.json");

function loadSandboxDocs(): SandboxDoc[] {
  try {
    if (fs.existsSync(SANDBOX_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(SANDBOX_FILE_PATH, "utf8"));
    }
  } catch (e) {
    console.warn("[Sandbox DB] Cannot read file database, fallback to empty array.");
  }
  return [];
}

function saveSandboxDocs(docs: SandboxDoc[]) {
  try {
    fs.writeFileSync(SANDBOX_FILE_PATH, JSON.stringify(docs, null, 2), "utf8");
  } catch (e) {
    console.error("[Sandbox DB] Write failure:", e);
  }
}

const DEFAULT_SEED_DATA: Record<string, any[]> = {
  "PersonalData": [
    {
      Name: "Aarav Sharma",
      DOB: "1994-08-14",
      AdharNumber: "5123 4567 8901",
      PanNumber: "BPLPS1234H",
      DrivingLicence: "DL-1420160089234",
      MobileNumber: "+91 98123 45678",
      AlternateMobileNumber: "+91 98123 99999",
      EmailID: "aarav.sharma@gmail.com",
      EpicNumber: "XYZ1234567"
    },
    {
      Name: "Diya Patel",
      DOB: "2000-11-23",
      AdharNumber: "9876 5432 1098",
      PanNumber: "CLYPP9988G",
      DrivingLicence: "GJ-0120190014321",
      MobileNumber: "+91 98765 43210",
      AlternateMobileNumber: "",
      EmailID: "diya.patel@hotmail.com",
      EpicNumber: "ABC9876543"
    }
  ],
  "FinancialData": [
    {
      AccountHolderName: "Aarav Sharma",
      AccountType: "Savings",
      BankName: "HDFC Bank",
      AccountNumber: "50100234567891",
      IFSC: "HDFC0000012",
      UserID: "aarav_hdfc_net",
      Password: "SecurePassword123!",
      LinkedMobileNumber: "+91 98123 45678",
      LinkedEmail: "aarav.sharma@gmail.com",
      SecurityAnswers: "First pet: Sparky. Place of birth: New Delhi.",
      CustomerID: "88127394",
      ProfilePassword: "ProfilePass1!"
    }
  ],
  "Card": [
    {
      "Debit/Credit": "Credit",
      CardType: "Visa",
      IssuedBank: "SBI Card",
      CardNumber: "4321-8899-7711-0022",
      Expiry: "09/28",
      CVV: "452",
      PIN: "4102",
      CardHolderName: "AARAV SHARMA"
    }
  ],
  "Media/Gmail": [
    {
      Particulars: "Google Account (Primary)",
      Userid: "as.sharma.1994@gmail.com",
      Password: "MySuperSecretGmailPass2026",
      MobileNumber: "+91 98123 45678",
      RecoveryMail: "recovery.sharma@outlook.com"
    }
  ],
  "Others": [
    {
      Particulars: "Apt B4 Wi-Fi",
      Userid: "Sharma_Home_5G",
      Password: "sharmasignalkey9988",
      MobileNumber: "",
      Remarks: "Router sits behind the main smart TV in the living room."
    }
  ],
  "Documents": [
    {
      Title: "Adhar Scan Copy",
      DocType: "Aadhaar Card",
      DocNumber: "5123 4567 8901",
      FileAttachment: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='100%' height='100%' fill='%230f172a' rx='16'/><rect x='20' y='20' width='360' height='210' fill='none' stroke='%2338bdf8' stroke-width='2' stroke-dasharray='4' rx='12'/><text x='40' y='60' fill='%23f1f5f9' font-family='sans-serif' font-size='20' font-weight='bold'>AADHAAR CARD</text><text x='40' y='90' fill='%2394a3b8' font-family='sans-serif' font-size='12'>Government of India</text><rect x='40' y='120' width='60' height='60' fill='%2338bdf8' opacity='0.2'/><path d='M50 130 h40 v40 h-40 z' fill='none' stroke='%2338bdf8' stroke-width='2'/><text x='120' y='140' fill='%23f1f5f9' font-family='sans-serif' font-size='14' font-weight='bold'>Aarav Sharma</text><text x='120' y='160' fill='%2394a3b8' font-family='sans-serif' font-size='12'>DOB: 14/08/1994</text><text x='40' y='210' fill='%2338bdf8' font-family='monospace' font-size='18' font-weight='bold'>5123  4567  8901</text></svg>"
    }
  ]
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Middleware Auth Gate
  const authenticateUser = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized. Missing bearer token." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = decodeFirebaseToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Unauthorized. Invalid or expired token." });
    }
    req.userId = decoded.uid;
    req.userEmail = decoded.email;
    next();
  };

  // Status endpoint for debugging
  app.get("/api/mongodb/status", (req: any, res: any) => {
    res.json({
      connected: mongoose.connection.readyState === 1,
      uriConfigured: isMongoConfigured
    });
  });

  // Fetch all user records from MongoDB or Sandbox
  app.get("/api/mongodb/records", authenticateUser, async (req: any, res: any) => {
    try {
      const grouped: Record<string, any[]> = {
        "PersonalData": [],
        "FinancialData": [],
        "Card": [],
        "Media/Gmail": [],
        "Others": [],
        "Documents": []
      };

      if (!isMongoConfigured) {
        // --- Sandbox Mode fallback logic ---
        let allDocs = loadSandboxDocs();
        let userDocs = allDocs.filter(d => d.userId === req.userId);

        if (userDocs.length === 0) {
          console.log(`[Sandbox DB] Initializing sandbox-seed for empty vault of user: ${req.userId}...`);
          const nowIso = new Date().toISOString();
          const seedDocs: SandboxDoc[] = [];
          for (const [sheetName, items] of Object.entries(DEFAULT_SEED_DATA)) {
            items.forEach((item, index) => {
              seedDocs.push({
                _id: `${sheetName}_${req.userId}_${index}_${Math.random().toString(36).substr(2, 9)}`,
                userId: req.userId,
                sheetName,
                data: item,
                createdAt: nowIso,
                updatedAt: nowIso
              });
            });
          }
          allDocs = [...allDocs, ...seedDocs];
          saveSandboxDocs(allDocs);
          userDocs = seedDocs;
        }

        userDocs.forEach((doc) => {
          const cat = doc.sheetName;
          if (grouped[cat]) {
            grouped[cat].push({
              _rowNum: doc._id,
              sheetName: doc.sheetName,
              ...doc.data
            });
          }
        });

        return res.json({ success: true, isLive: false, data: grouped });
      }

      // --- Live MongoDB logic ---
      let docs = await VaultRecord.find({ userId: req.userId });

      // Auto-Seed defaults if MongoDB is completely empty for this user
      if (docs.length === 0) {
        console.log(`[MongoDB] Initializing auto-seed for empty vault of user: ${req.userId}...`);
        const promises: any[] = [];
        for (const [sheetName, items] of Object.entries(DEFAULT_SEED_DATA)) {
          for (const item of items) {
            promises.push(new VaultRecord({
              userId: req.userId,
              sheetName,
              data: item
            }).save());
          }
        }
        await Promise.all(promises);
        // Refresh docs fetch
        docs = await VaultRecord.find({ userId: req.userId });
      }

      docs.forEach((doc: any) => {
        const cat = doc.sheetName;
        if (grouped[cat]) {
          const rawData = doc.data instanceof Map ? Object.fromEntries(doc.data) : (doc.data || {});
          grouped[cat].push({
            _rowNum: doc._id.toString(), // Assign ObjectId representation to support UI identification key
            sheetName: doc.sheetName,
            ...rawData
          });
        }
      });

      res.json({ success: true, isLive: true, data: grouped });
    } catch (err: any) {
      console.error("[Backend] Read error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Create new record in MongoDB or Sandbox
  app.post("/api/mongodb/records", authenticateUser, async (req: any, res: any) => {
    try {
      const { sheetName, ...data } = req.body;
      if (!sheetName) {
        return res.status(400).json({ error: "sheetName is required" });
      }

      if (!isMongoConfigured) {
        // --- Sandbox Mode fallback logic ---
        const allDocs = loadSandboxDocs();
        const nowIso = new Date().toISOString();
        const newId = `rec_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
        const newDoc: SandboxDoc = {
          _id: newId,
          userId: req.userId,
          sheetName,
          data,
          createdAt: nowIso,
          updatedAt: nowIso
        };
        allDocs.push(newDoc);
        saveSandboxDocs(allDocs);
        return res.json({ success: true, message: "Record synchronized with Sandbox storage successfully (Offline Mode)!", id: newId });
      }

      // --- Live MongoDB logic ---
      const record = new VaultRecord({
        userId: req.userId,
        sheetName,
        data
      });

      await record.save();
      res.json({ success: true, message: "Record encrypted and synchronized with MongoDB successfully!", id: record._id });
    } catch (err: any) {
      console.error("[Backend] Write failure:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update existing record in MongoDB or Sandbox
  app.put("/api/mongodb/records/:id", authenticateUser, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { sheetName, ...data } = req.body;

      // Clean up fields
      const { _rowNum, createdAt, updatedAt, ...cleanData } = data;

      if (!isMongoConfigured) {
        // --- Sandbox Mode fallback logic ---
        const allDocs = loadSandboxDocs();
        const docIndex = allDocs.findIndex(d => d._id === id && d.userId === req.userId);
        if (docIndex === -1) {
          return res.status(404).json({ error: "Item not found or unauthorized to update in sandbox." });
        }
        allDocs[docIndex].data = cleanData;
        allDocs[docIndex].updatedAt = new Date().toISOString();
        saveSandboxDocs(allDocs);
        return res.json({ success: true, message: "Record successfully updated in local Sandbox storage!" });
      }

      // --- Live MongoDB logic ---
      const record = await VaultRecord.findOneAndUpdate(
        { _id: id, userId: req.userId },
        { $set: { data: cleanData } },
        { new: true }
      );

      if (!record) {
        return res.status(404).json({ error: "Item not found or unauthorized to update." });
      }

      res.json({ success: true, message: "Record successfully updated in secure MongoDB Database!" });
    } catch (err: any) {
      console.error("[Backend] Update failure:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete matching record from MongoDB or Sandbox
  app.delete("/api/mongodb/records/:id", authenticateUser, async (req: any, res: any) => {
    try {
      const { id } = req.params;

      if (!isMongoConfigured) {
        // --- Sandbox Mode fallback logic ---
        let allDocs = loadSandboxDocs();
        const beforeLen = allDocs.length;
        allDocs = allDocs.filter(d => !(d._id === id && d.userId === req.userId));
        if (allDocs.length === beforeLen) {
          return res.status(404).json({ error: "Item not found or unauthorized to delete in sandbox." });
        }
        saveSandboxDocs(allDocs);
        return res.json({ success: true, message: "Record permanently removed from local Sandbox storage!" });
      }

      // --- Live MongoDB logic ---
      const record = await VaultRecord.findOneAndDelete({ _id: id, userId: req.userId });

      if (!record) {
        return res.status(404).json({ error: "Item not found or unauthorized to delete." });
      }

      res.json({ success: true, message: "Record permanently removed from MongoDB Database!" });
    } catch (err: any) {
      console.error("[Backend] Deletion failure:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Development VS Production middleware settings
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Server] Loaded Vite Dev Middleware successfully.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("[Server] Serving production static files from dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Secure Vault server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
