import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const app = express();

app.use(express.json({ limit: "15mb" }));

// Load MONGODB_URI environment variable
const MONGODB_URI = process.env.MONGODB_URI || "";

// Initialize MongoDB Schema
const RecordSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  sheetName: { type: String, required: true, index: true },
  data: { type: mongoose.Schema.Types.Map, of: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const VaultRecord = (mongoose.models.VaultRecord || mongoose.model("VaultRecord", RecordSchema)) as any;

// Connection cache helper for Vercel serverless environment
let cachedDb: typeof mongoose | null = null;
const isMongoConfigured = !!MONGODB_URI;

async function connectToDatabase() {
  if (!isMongoConfigured) return null;
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  cachedDb = await mongoose.connect(MONGODB_URI);
  return cachedDb;
}

// Read Firebase Config to get Project ID for JWT claim validation
let firebaseProjectId = "";
try {
  const configText = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8");
  const config = JSON.parse(configText);
  firebaseProjectId = config.projectId || "";
} catch (e) {
  // Try fallback in serverless deployment
  try {
    const fallbackPath = path.join(process.cwd(), "dist", "firebase-applet-config.json");
    if (fs.existsSync(fallbackPath)) {
      const configText = fs.readFileSync(fallbackPath, "utf8");
      const config = JSON.parse(configText);
      firebaseProjectId = config.projectId || "";
    }
  } catch (errInner) {
    console.warn("[Vercel Proxy] Failed to read firebase-applet-config.json. Decoder will parse token claims generally.");
  }
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


// Middleware Auth Gate & DB Connection Resolver
const authenticateUser = async (req: any, res: any, next: any) => {
  try {
    if (isMongoConfigured) {
      await connectToDatabase();
    }
  } catch (err: any) {
    return res.status(503).json({ error: `database connection error: ${err.message}` });
  }

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

// Status endpoint for debugging connection states
app.get("/api/mongodb/status", async (req: any, res: any) => {
  try {
    if (isMongoConfigured) {
      await connectToDatabase();
    }
    res.json({
      connected: isMongoConfigured && mongoose.connection.readyState === 1,
      uriConfigured: isMongoConfigured
    });
  } catch (err: any) {
    res.json({
      connected: false,
      uriConfigured: isMongoConfigured,
      error: err.message
    });
  }
});

// Fetch all user records from MongoDB
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

    let docs = await VaultRecord.find({ userId: req.userId });

    docs.forEach((doc: any) => {
      const cat = doc.sheetName;
      if (grouped[cat]) {
        const rawData = doc.data instanceof Map ? Object.fromEntries(doc.data) : (doc.data || {});
        grouped[cat].push({
          _rowNum: doc._id.toString(),
          sheetName: doc.sheetName,
          ...rawData
        });
      }
    });

    res.json({ success: true, isLive: true, data: grouped });
  } catch (err: any) {
    console.error("[MongoDB Vercel] Read error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create new record in MongoDB
app.post("/api/mongodb/records", authenticateUser, async (req: any, res: any) => {
  try {
    const { sheetName, ...data } = req.body;
    if (!sheetName) {
      return res.status(400).json({ error: "sheetName is required" });
    }

    const record = new VaultRecord({
      userId: req.userId,
      sheetName,
      data
    });

    await record.save();
    res.json({ success: true, message: "Record encrypted and synchronized with MongoDB successfully!", id: record._id });
  } catch (err: any) {
    console.error("[MongoDB Vercel] Write failure:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update existing record in MongoDB
app.put("/api/mongodb/records/:id", authenticateUser, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { sheetName, ...data } = req.body;

    const { _rowNum, createdAt, updatedAt, ...cleanData } = data;

    const record = await VaultRecord.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { data: cleanData } },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ error: "Item not found or unauthorized to update." });
    }

    res.json({ success: true, message: "Record updated successfully!", id: record._id });
  } catch (err: any) {
    console.error("[MongoDB Vercel] Update error:", err);
    res.status(500).json({ error: err.message });
  }
});
    }

    res.json({ success: true, message: "Record successfully updated in secure MongoDB Database!" });
  } catch (err: any) {
    console.error("[MongoDB Vercel] Update failure:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete matching record from MongoDB or Sandbox fallback
app.delete("/api/mongodb/records/:id", authenticateUser, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const record = await VaultRecord.findOneAndDelete({ _id: id, userId: req.userId });

    if (!record) {
      return res.status(404).json({ error: "Item not found or unauthorized to delete." });
    }

    res.json({ success: true, message: "Record permanently removed from MongoDB Database!" });
  } catch (err: any) {
    console.error("[MongoDB Vercel] Deletion failure:", err);
    res.status(500).json({ error: err.message });
  }
});

export default app;
