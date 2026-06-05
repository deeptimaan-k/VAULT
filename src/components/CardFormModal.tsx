import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Save, AlertCircle, Upload, FileText, Trash2,
  Camera, RefreshCw, User, Briefcase, CreditCard, Mail, Lock, Database,
} from "lucide-react";
import { CategorySchema, formatExpiryToMMYY, formatCardNumber } from "../types";

interface CardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategorySchema;
  initialData?: Record<string, any> | null;
  onSave: (data: Record<string, any>) => Promise<boolean | { success: boolean; error?: string }>;
  isSaving: boolean;
}

const spring = { type: "spring" as const, stiffness: 320, damping: 28 };

const CAT_THEME: Record<string, { accent: string; rgb: string; gradient: string; Icon: React.ComponentType<any> }> = {
  personal:  { accent: "#6366f1", rgb: "99,102,241",  gradient: "linear-gradient(135deg,#6366f1,#4f46e5)", Icon: User },
  financial: { accent: "#10b981", rgb: "16,185,129",  gradient: "linear-gradient(135deg,#10b981,#059669)", Icon: Briefcase },
  card:      { accent: "#06b6d4", rgb: "6,182,212",   gradient: "linear-gradient(135deg,#06b6d4,#0284c7)", Icon: CreditCard },
  media:     { accent: "#f59e0b", rgb: "245,158,11",  gradient: "linear-gradient(135deg,#f59e0b,#d97706)", Icon: Mail },
  others:    { accent: "#f43f5e", rgb: "244,63,94",   gradient: "linear-gradient(135deg,#f43f5e,#e11d48)", Icon: Lock },
  documents: { accent: "#a855f7", rgb: "168,85,247",  gradient: "linear-gradient(135deg,#a855f7,#9333ea)", Icon: FileText },
};

const formatBytes = (b: number) => {
  if (!b) return "0 B";
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return parseFloat((b / Math.pow(1024, i)).toFixed(1)) + ["B","KB","MB"][i];
};

export default function CardFormModal({ isOpen, onClose, category, initialData, onSave, isSaving }: CardFormModalProps) {
  const [formData, setFormData]           = useState<Record<string, any>>({});
  const [errors, setErrors]               = useState<Record<string, string>>({});
  const [generalError, setGeneralError]   = useState("");
  const [fileMetaMap, setFileMetaMap]     = useState<Record<string, { name: string; size: number }>>({});
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive]     = useState(false);
  const [cameraStream, setCameraStream]   = useState<MediaStream | null>(null);
  const [activeCameraField, setActiveCameraField] = useState<string | null>(null);
  const [facingMode, setFacingMode]       = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError]     = useState("");
  const [focusedField, setFocusedField]   = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const theme = CAT_THEME[category.id] || CAT_THEME.others;
  const { accent, rgb, gradient, Icon: CatIcon } = theme;

  // ── image helpers ────────────────────────────────────────────────────────
  const compressImage = (dataUrl: string): Promise<string> =>
    new Promise(resolve => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const MAX = 750, canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height ? width > MAX : height > MAX) {
          if (width > height) { height *= MAX / width; width = MAX; }
          else { width *= MAX / height; height = MAX; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL("image/jpeg", 0.7)); }
        else resolve(dataUrl);
      };
      img.onerror = () => resolve(dataUrl);
    });

  const processSelectedFile = async (fieldKey: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) { setErrors(p => ({ ...p, [fieldKey]: "File exceeds 2MB limit." })); return; }
    setIsFileProcessing(true);
    setErrors(p => ({ ...p, [fieldKey]: "" }));
    try {
      const reader = new FileReader();
      const loaded = await new Promise<string>((res, rej) => { reader.onload = e => res(e.target?.result as string); reader.onerror = rej; reader.readAsDataURL(file); });
      const final = file.type.startsWith("image/") ? await compressImage(loaded) : loaded;
      setFormData(p => ({ ...p, [fieldKey]: final }));
      setFileMetaMap(p => ({ ...p, [fieldKey]: { name: file.name, size: Math.floor((final.length * 3) / 4) } }));
    } catch { setErrors(p => ({ ...p, [fieldKey]: "Failed to read file." })); }
    finally { setIsFileProcessing(false); }
  };

  // ── camera ───────────────────────────────────────────────────────────────
  const startCamera = async (fieldKey: string, mode: "user" | "environment" = facingMode) => {
    setCameraError(""); setIsCameraActive(true); setActiveCameraField(fieldKey);
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      setCameraStream(stream);
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
    } catch (err: any) {
      const msg = err.name === "NotAllowedError" ? "Camera permission denied." : err.name === "NotFoundError" ? "No camera found." : `Camera error: ${err.message}`;
      setCameraError(msg);
    }
  };

  const stopCamera = () => { cameraStream?.getTracks().forEach(t => t.stop()); setCameraStream(null); setIsCameraActive(false); setActiveCameraField(null); setCameraError(""); };

  const capturePhoto = async (fieldKey: string) => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current, canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setIsFileProcessing(true);
        const compressed = await compressImage(canvas.toDataURL("image/jpeg", 0.85));
        setFormData(p => ({ ...p, [fieldKey]: compressed }));
        setFileMetaMap(p => ({ ...p, [fieldKey]: { name: `Photo_${Date.now()}.jpg`, size: Math.floor((compressed.length * 3) / 4) } }));
      }
      stopCamera();
    } catch { setErrors(p => ({ ...p, [fieldKey]: "Failed to capture photo." })); }
    finally { setIsFileProcessing(false); }
  };

  useEffect(() => { if (isCameraActive && cameraStream && videoRef.current) { videoRef.current.srcObject = cameraStream; videoRef.current.play().catch(() => {}); } }, [cameraStream, isCameraActive]);
  useEffect(() => { if (!isOpen && cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null); setIsCameraActive(false); } }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      const processed = { ...initialData };
      category.fields.forEach(f => {
        if (["Name","AccountHolderName","CardHolderName","PanNumber","EpicNumber","HolderName"].includes(f.key) && processed[f.key])
          processed[f.key] = String(processed[f.key]).toUpperCase();
        if (f.key === "Expiry" && processed[f.key]) processed[f.key] = formatExpiryToMMYY(processed[f.key]);
        if (f.key === "CardNumber" && processed[f.key]) processed[f.key] = formatCardNumber(processed[f.key]);
      });
      setFormData(processed);
    } else {
      const init: Record<string, any> = {};
      category.fields.forEach(f => { init[f.key] = f.type === "select" && f.options ? f.options[0] : ""; });
      setFormData(init);
    }
    setErrors({}); setGeneralError("");
  }, [initialData, category, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (key: string, value: string) => {
    let v = value;
    if (["Name","AccountHolderName","CardHolderName","PanNumber","EpicNumber","HolderName"].includes(key)) v = v.toUpperCase();
    if (key === "CardNumber") v = formatCardNumber(v);
    if (key === "CVV") v = v.replace(/\D/g,"").slice(0,3);
    if (key === "PIN") v = v.replace(/\D/g,"");
    if (key === "Expiry") { const d = v.replace(/\D/g,""); v = d.length > 2 ? d.slice(0,2)+"/"+d.slice(2,4) : d; }
    setFormData(p => ({ ...p, [key]: v }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: "" }));
  };

  const handleBlur = (key: string, value: string) => {
    setFocusedField(null);
    const f = category.fields.find(f => f.key === key);
    const isEmail = f?.type === "email" || key.toLowerCase().includes("email") || (category.id === "media" && key === "Userid");
    if (isEmail && value.trim() && !value.includes("@")) setFormData(p => ({ ...p, [key]: `${value.trim()}@gmail.com` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const processed = { ...formData };
    const newErrors: Record<string, string> = {};

    category.fields.forEach(f => {
      const val = processed[f.key];
      const isEmail = f.type === "email" || f.key.toLowerCase().includes("email") || (category.id === "media" && f.key === "Userid");
      if (isEmail && String(val || "").trim() && !String(val).includes("@")) processed[f.key] = `${String(val).trim()}@gmail.com`;
    });
    setFormData(processed);

    category.fields.forEach(f => {
      const val = processed[f.key];
      const has = val !== undefined && String(val).trim() !== "";
      if (f.required && !has) { newErrors[f.key] = `${f.label} is required`; return; }
      if (has) {
        if (["Name","AccountHolderName","CardHolderName","EpicNumber","PanNumber"].includes(f.key) && /[a-z]/.test(String(val))) newErrors[f.key] = `${f.label} must be uppercase.`;
        if (f.key === "CVV" && !/^\d{3}$/.test(String(val).trim())) newErrors[f.key] = "CVV must be exactly 3 digits.";
        if (f.key === "PIN" && !/^\d+$/.test(String(val).trim())) newErrors[f.key] = "PIN must be digits only.";
        if (f.key === "Expiry" && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(val).trim())) newErrors[f.key] = "Format: MM/YY";
        if (f.key === "AdharNumber" && !/^\d{12}$/.test(String(val).replace(/[\s-]/g,""))) newErrors[f.key] = "Must be exactly 12 digits.";
        if (f.key === "PanNumber" && !/^[A-Z]{5}\d{4}[A-Z]$/.test(String(val).trim())) newErrors[f.key] = "Format: ABCDE1234F";
        if (f.key === "AccountNumber") { const c = String(val).trim().replace(/[\s-]/g,""); if (!/^\d+$/.test(c)) newErrors[f.key] = "Numbers only."; else if (c.length <= 10) newErrors[f.key] = "Must be > 10 digits."; }
        if (f.key === "IFSC") { const c = String(val).trim(); if (!/^[A-Z]{4}\d[A-Z0-9]{6}$/i.test(c)) newErrors[f.key] = "Format: SBIN0001234"; else if (!/^[A-Z]{4}\d[A-Z0-9]{6}$/.test(c)) newErrors[f.key] = "Must be uppercase."; }
        if (f.key.toLowerCase().includes("mobilenumber")) { let m = String(val).trim().replace(/[\s\-\(\)\+]/g,""); if (m.startsWith("91") && m.length > 10) m = m.slice(2); if (!/^[6-9]\d{9}$/.test(m)) newErrors[f.key] = "10-digit Indian mobile number."; }
      }
    });

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setGeneralError("");
    const result = await onSave(processed);
    if (typeof result === "object") { if (result.success) onClose(); else setGeneralError(result.error || "Save failed."); }
    else { if (result) onClose(); else setGeneralError("Save failed. Check your setup."); }
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>

          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,12,0.88)", backdropFilter: "blur(20px)" }}
          />

          {/* Modal sheet */}
          <motion.div
            initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
            transition={spring}
            style={{
              position: "relative", zIndex: 1,
              width: "100%", maxWidth: 520,
              borderRadius: "28px 28px 0 0",
              overflow: "hidden",
              display: "flex", flexDirection: "column",
              maxHeight: "92vh",
              background: "linear-gradient(160deg, rgba(8,6,28,0.99) 0%, rgba(4,4,18,0.99) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "none",
              boxShadow: `0 -20px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03), 0 -4px 80px rgba(${rgb},0.16)`,
            }}
          >
            {/* Top accent line */}
            <div style={{ height: 2.5, flexShrink: 0, background: `linear-gradient(90deg, transparent, ${accent}, ${accent}cc, ${accent}, transparent)` }} />

            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 2px", flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)" }} />
            </div>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 22px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
              <div style={{ width: 46, height: 46, borderRadius: 15, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, rgba(${rgb},0.22), rgba(${rgb},0.08))`, border: `1px solid rgba(${rgb},0.28)`, boxShadow: `0 4px 20px rgba(${rgb},0.18)` }}>
                <CatIcon style={{ width: 20, height: 20, color: accent }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
                  {initialData ? "Edit Record" : `New ${category.title}`}
                </h3>
                <p style={{ margin: 0, marginTop: 4, fontSize: 10, fontWeight: 700, color: "rgba(100,116,139,0.6)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em" }}>
                  Firestore → {category.sheetName}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", color: "rgba(148,163,184,0.5)", flexShrink: 0, transition: "background 0.15s" }}
              >
                <X style={{ width: 15, height: 15 }} />
              </motion.button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 18 }}>

                {/* General error */}
                <AnimatePresence>
                  {generalError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      style={{ display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 13, background: "rgba(244,63,94,0.08)", padding: "13px 15px", fontSize: 12, color: "#fca5a5", border: "1px solid rgba(244,63,94,0.22)" }}>
                      <AlertCircle style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1, color: "#f87171" }} />
                      <span style={{ fontWeight: 600 }}>{generalError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fields */}
                {category.fields.map((field, idx) => {
                  const hasErr   = !!errors[field.key];
                  const isFocused = focusedField === field.key;

                  const baseInput: React.CSSProperties = {
                    width: "100%", boxSizing: "border-box",
                    background: isFocused ? `rgba(${rgb},0.07)` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${hasErr ? "#f43f5e" : isFocused ? accent : "rgba(255,255,255,0.09)"}`,
                    borderRadius: 13,
                    padding: "13px 16px",
                    fontSize: 13.5, fontWeight: 500, color: "#fff",
                    outline: "none",
                    boxShadow: isFocused ? `0 0 0 3px rgba(${rgb},0.18), 0 0 24px rgba(${rgb},0.08)` : hasErr ? "0 0 0 3px rgba(244,63,94,0.12)" : "none",
                    transition: "all 0.18s ease",
                  };

                  return (
                    <motion.div key={field.key}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.022, ...spring }}
                      style={{ display: "flex", flexDirection: "column", gap: 0 }}
                    >
                      {/* Label */}
                      <label style={{ display: "block", marginBottom: 8, fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: isFocused ? accent : hasErr ? "#f87171" : "rgba(100,116,139,0.65)", transition: "color 0.18s" }}>
                        {field.label}
                        {field.required && <span style={{ color: "#f43f5e", marginLeft: 3 }}>*</span>}
                      </label>

                      {/* Select */}
                      {field.type === "select" ? (
                        <div style={{ position: "relative" }}>
                          <select
                            value={formData[field.key] || ""}
                            onChange={e => handleInputChange(field.key, e.target.value)}
                            onFocus={() => setFocusedField(field.key)}
                            onBlur={() => setFocusedField(null)}
                            style={{ ...baseInput, appearance: "none", WebkitAppearance: "none", paddingRight: 44, cursor: "pointer" }}
                          >
                            {field.options?.map(opt => <option key={opt} value={opt} style={{ background: "#080618", color: "#fff" }}>{opt}</option>)}
                          </select>
                          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: isFocused ? accent : "rgba(148,163,184,0.4)", transition: "color 0.18s" }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>

                      ) : field.type === "file" ? (
                        /* ── File upload ──────────────────────────── */
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <input id={`input-${field.key}`} type="file" accept="image/*,application/pdf" style={{ display: "none" }}
                            onChange={async e => { const f = e.target.files?.[0]; if (f) await processSelectedFile(field.key, f); }} />

                          {isCameraActive && activeCameraField === field.key ? (
                            <div style={{ borderRadius: 18, border: `1px solid rgba(${rgb},0.35)`, overflow: "hidden", background: "#000" }}>
                              <div style={{ position: "relative", aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {cameraError
                                  ? <div style={{ padding: 24, textAlign: "center" }}>
                                      <AlertCircle style={{ width: 24, height: 24, color: "#f87171", margin: "0 auto 10px" }} />
                                      <p style={{ margin: 0, fontSize: 11, color: "#fca5a5", fontWeight: 700 }}>{cameraError}</p>
                                    </div>
                                  : <>
                                      <video ref={videoRef} playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                      <div style={{ position: "absolute", top: 8, right: 8, padding: "3px 8px", borderRadius: 6, background: "rgba(0,0,0,0.7)", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: accent }}>
                                        {facingMode === "environment" ? "REAR" : "FRONT"}
                                      </div>
                                    </>
                                }
                              </div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", gap: 8, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.5)" }}>
                                <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={stopCamera}
                                  style={{ padding: "8px 16px", borderRadius: 11, fontSize: 11, fontWeight: 700, color: "rgba(148,163,184,0.8)", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", cursor: "pointer" }}>
                                  Cancel
                                </motion.button>
                                {!cameraError && <>
                                  <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => capturePhoto(field.key)}
                                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 99, background: gradient, border: `1px solid rgba(${rgb},0.4)`, color: "#fff", fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", cursor: "pointer", boxShadow: `0 4px 16px rgba(${rgb},0.35)` }}>
                                    <Camera style={{ width: 13, height: 13 }} /> Capture
                                  </motion.button>
                                  <motion.button type="button" whileTap={{ scale: 0.95 }}
                                    onClick={() => { const next = facingMode === "environment" ? "user" : "environment"; setFacingMode(next); startCamera(field.key, next); }}
                                    style={{ width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(148,163,184,0.7)", cursor: "pointer" }}>
                                    <RefreshCw style={{ width: 15, height: 15 }} />
                                  </motion.button>
                                </>}
                              </div>
                            </div>

                          ) : formData[field.key] ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, border: `1px solid rgba(${rgb},0.2)`, background: `rgba(${rgb},0.05)` }}>
                              <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {formData[field.key].startsWith("data:image/")
                                  ? <img src={formData[field.key]} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  : <FileText style={{ width: 22, height: 22, color: accent }} />
                                }
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {fileMetaMap[field.key]?.name || "Attached File"}
                                </p>
                                <p style={{ margin: 0, marginTop: 3, fontSize: 10, fontWeight: 700, color: accent }}>
                                  {fileMetaMap[field.key]?.size ? formatBytes(fileMetaMap[field.key].size) : "Saved"} · Firestore
                                </p>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => startCamera(field.key, "environment")}
                                  style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)`, color: accent, cursor: "pointer" }}>
                                  <Camera style={{ width: 13, height: 13 }} />
                                </motion.button>
                                <label htmlFor={`input-${field.key}`}
                                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", fontSize: 11, fontWeight: 700, color: "rgba(148,163,184,0.7)", cursor: "pointer" }}>
                                  <Upload style={{ width: 11, height: 11 }} /> Replace
                                </label>
                                <motion.button type="button" whileTap={{ scale: 0.9 }}
                                  onClick={() => { setFormData(p => ({ ...p, [field.key]: "" })); setFileMetaMap(p => { const n = { ...p }; delete n[field.key]; return n; }); }}
                                  style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#f87171", cursor: "pointer" }}>
                                  <Trash2 style={{ width: 13, height: 13 }} />
                                </motion.button>
                              </div>
                            </div>

                          ) : (
                            <div
                              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = `rgba(${rgb},0.06)`; }}
                              onDragLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.background = ""; }}
                              onDrop={async e => { e.preventDefault(); e.currentTarget.style.borderColor = ""; e.currentTarget.style.background = ""; const f = e.dataTransfer.files?.[0]; if (f) await processSelectedFile(field.key, f); }}
                              style={{ border: `2px dashed ${hasErr ? "rgba(244,63,94,0.5)" : "rgba(255,255,255,0.09)"}`, borderRadius: 16, padding: "28px 20px", textAlign: "center", background: "rgba(255,255,255,0.018)", transition: "all 0.2s" }}
                            >
                              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                                {isFileProcessing
                                  ? <div style={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid rgba(${rgb},0.25)`, borderTopColor: accent, animation: "spin 0.8s linear infinite" }} />
                                  : <div style={{ width: 44, height: 44, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                      <Upload style={{ width: 18, height: 18, color: "rgba(100,116,139,0.6)" }} />
                                    </div>
                                }
                              </div>
                              <p style={{ margin: 0, marginBottom: 4, fontSize: 13, fontWeight: 700, color: "rgba(203,213,225,0.8)" }}>
                                {isFileProcessing ? "Processing…" : "Drop file here or choose below"}
                              </p>
                              <p style={{ margin: 0, marginBottom: 16, fontSize: 10, color: "rgba(100,116,139,0.5)" }}>PDF, JPG, PNG — max 2 MB</p>
                              <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                                <motion.button type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                  onClick={() => document.getElementById(`input-${field.key}`)?.click()}
                                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", fontSize: 11, fontWeight: 700, color: "rgba(148,163,184,0.8)", cursor: "pointer" }}>
                                  <Upload style={{ width: 12, height: 12 }} /> Upload File
                                </motion.button>
                                <motion.button type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                  onClick={() => startCamera(field.key, "environment")}
                                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 11, background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.22)`, fontSize: 11, fontWeight: 700, color: accent, cursor: "pointer" }}>
                                  <Camera style={{ width: 12, height: 12 }} /> Camera
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </div>

                      ) : (
                        /* ── Text / number / email inputs ─────────── */
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formData[field.key] || ""}
                          onChange={e => handleInputChange(field.key, e.target.value)}
                          onFocus={() => setFocusedField(field.key)}
                          onBlur={e => handleBlur(field.key, e.target.value)}
                          style={baseInput}
                        />
                      )}

                      {/* Field error */}
                      <AnimatePresence>
                        {hasErr && (
                          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ display: "flex", alignItems: "center", gap: 5, margin: "6px 0 0 2px", fontSize: 10, fontWeight: 700, color: "#f87171" }}>
                            <AlertCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
                            {errors[field.key]}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 22px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.22)", flexShrink: 0 }}>
                <motion.button type="button" onClick={onClose} disabled={isSaving}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ padding: "12px 24px", borderRadius: 13, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", fontSize: 12, fontWeight: 700, color: "rgba(148,163,184,0.75)", opacity: isSaving ? 0.4 : 1, transition: "all 0.15s" }}>
                  Cancel
                </motion.button>

                <motion.button type="submit" disabled={isSaving}
                  whileHover={{ scale: 1.03, boxShadow: `0 10px 36px rgba(${rgb},0.55), inset 0 1px 0 rgba(255,255,255,0.25)` }}
                  whileTap={{ scale: 0.97 }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 30px", borderRadius: 13, cursor: isSaving ? "not-allowed" : "pointer", background: gradient, border: `1px solid rgba(${rgb},0.5)`, boxShadow: `0 4px 24px rgba(${rgb},0.4), inset 0 1px 0 rgba(255,255,255,0.18)`, fontSize: 12, fontWeight: 900, color: "#fff", letterSpacing: "0.07em", textTransform: "uppercase", opacity: isSaving ? 0.65 : 1, transition: "opacity 0.15s" }}>
                  {isSaving
                    ? <><div style={{ width: 13, height: 13, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} /> Saving…</>
                    : <><Save style={{ width: 13, height: 13 }} /> Save Record</>
                  }
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
