import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertCircle, Upload, FileText, Trash2, Camera, RefreshCw, CheckCircle2 } from "lucide-react";
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

const categoryColors: Record<string, { gradient: string; accent: string; ring: string }> = {
  personal:  { gradient: "from-blue-500 to-indigo-600",    accent: "#6366f1", ring: "focus:ring-indigo-500/30 focus:border-indigo-500" },
  financial: { gradient: "from-emerald-400 to-teal-600",   accent: "#10b981", ring: "focus:ring-emerald-500/30 focus:border-emerald-500" },
  card:      { gradient: "from-cyan-400 to-blue-500",      accent: "#06b6d4", ring: "focus:ring-cyan-500/30 focus:border-cyan-500" },
  media:     { gradient: "from-amber-400 to-orange-600",   accent: "#f59e0b", ring: "focus:ring-amber-500/30 focus:border-amber-500" },
  others:    { gradient: "from-rose-400 to-pink-600",      accent: "#f43f5e", ring: "focus:ring-rose-500/30 focus:border-rose-500" },
  documents: { gradient: "from-purple-500 to-fuchsia-600", accent: "#a855f7", ring: "focus:ring-purple-500/30 focus:border-purple-500" },
};

export default function CardFormModal({
  isOpen, onClose, category, initialData, onSave, isSaving
}: CardFormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [fileMetaMap, setFileMetaMap] = useState<Record<string, { name: string; size: number }>>({});
  const [isFileProcessing, setIsFileProcessing] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [activeCameraField, setActiveCameraField] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const colors = categoryColors[category.id] || categoryColors.others;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ["B","KB","MB"][i];
  };

  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 750;
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
  };

  const processSelectedFile = async (fieldKey: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) { setErrors(p => ({ ...p, [fieldKey]: "File exceeds 2MB limit." })); return; }
    setIsFileProcessing(true);
    setErrors(p => ({ ...p, [fieldKey]: "" }));
    try {
      const reader = new FileReader();
      const loaded = await new Promise<string>((res, rej) => {
        reader.onload = e => res(e.target?.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const final = file.type.startsWith("image/") ? await compressImage(loaded) : loaded;
      setFormData(p => ({ ...p, [fieldKey]: final }));
      setFileMetaMap(p => ({ ...p, [fieldKey]: { name: file.name, size: Math.floor((final.length * 3) / 4) } }));
    } catch { setErrors(p => ({ ...p, [fieldKey]: "Failed to read file." })); }
    finally { setIsFileProcessing(false); }
  };

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

  const stopCamera = () => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null); setIsCameraActive(false); setActiveCameraField(null); setCameraError("");
  };

  const capturePhoto = async (fieldKey: string) => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
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

  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraStream, isCameraActive]);

  useEffect(() => {
    if (!isOpen) { if (cameraStream) cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null); setIsCameraActive(false); }
  }, [isOpen]);

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
    const f = category.fields.find(f => f.key === key);
    const isEmail = f?.type === "email" || key.toLowerCase().includes("email") || (category.id === "media" && key === "Userid");
    if (isEmail && value.trim() && !value.includes("@")) {
      setFormData(p => ({ ...p, [key]: `${value.trim()}@gmail.com` }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const processed = { ...formData };
    const newErrors: Record<string, string> = {};

    category.fields.forEach(f => {
      const val = processed[f.key];
      const isEmail = f.type === "email" || f.key.toLowerCase().includes("email") || (category.id === "media" && f.key === "Userid");
      if (isEmail && String(val || "").trim() && !String(val).includes("@"))
        processed[f.key] = `${String(val).trim()}@gmail.com`;
    });
    setFormData(processed);

    category.fields.forEach(f => {
      const val = processed[f.key];
      const has = val !== undefined && String(val).trim() !== "";
      if (f.required && !has) { newErrors[f.key] = `${f.label} is required`; return; }
      if (has) {
        if (["Name","AccountHolderName","CardHolderName","EpicNumber","PanNumber"].includes(f.key) && /[a-z]/.test(String(val)))
          newErrors[f.key] = `${f.label} must be uppercase.`;
        if (f.key === "CVV" && !/^\d{3}$/.test(String(val).trim())) newErrors[f.key] = "CVV must be exactly 3 digits.";
        if (f.key === "PIN" && !/^\d+$/.test(String(val).trim())) newErrors[f.key] = "PIN must be digits only.";
        if (f.key === "Expiry" && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(val).trim())) newErrors[f.key] = 'Format: MM/YY';
        if (f.key === "AdharNumber" && !/^\d{12}$/.test(String(val).replace(/[\s-]/g,""))) newErrors[f.key] = "Must be exactly 12 digits.";
        if (f.key === "PanNumber" && !/^[A-Z]{5}\d{4}[A-Z]$/.test(String(val).trim())) newErrors[f.key] = "Format: ABCDE1234F";
        if (f.key === "AccountNumber") {
          const c = String(val).trim().replace(/[\s-]/g,"");
          if (!/^\d+$/.test(c)) newErrors[f.key] = "Numbers only.";
          else if (c.length <= 10) newErrors[f.key] = "Must be > 10 digits.";
        }
        if (f.key === "IFSC") {
          const c = String(val).trim();
          if (!/^[A-Z]{4}\d[A-Z0-9]{6}$/i.test(c)) newErrors[f.key] = "Format: SBIN0001234";
          else if (!/^[A-Z]{4}\d[A-Z0-9]{6}$/.test(c)) newErrors[f.key] = "Must be uppercase.";
        }
        if (f.key.toLowerCase().includes("mobilenumber")) {
          let m = String(val).trim().replace(/[\s\-\(\)\+]/g,"");
          if (m.startsWith("91") && m.length > 10) m = m.slice(2);
          if (!/^[6-9]\d{9}$/.test(m)) newErrors[f.key] = "10-digit Indian mobile number.";
        }
      }
    });

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setGeneralError("");
    const result = await onSave(processed);
    if (typeof result === "object") {
      if (result.success) onClose();
      else setGeneralError(result.error || "Save failed.");
    } else {
      if (result) onClose();
      else setGeneralError("Save failed. Check your setup.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: "rgba(3,3,20,0.85)", backdropFilter: "blur(16px)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.97 }}
            transition={spring}
            className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: "rgba(8,8,28,0.98)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: `0 -8px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), 0 0 80px ${colors.accent}15`,
              maxHeight: "92vh"
            }}
          >
            {/* Gradient top border */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${colors.gradient}`} />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div>
                <h3 className="text-base font-black text-white">
                  {initialData ? "Edit Record" : `New ${category.title}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synced to Firestore → <span className="font-mono text-slate-400">{category.sheetName}</span>
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.15 }}
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:bg-white/6 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
                {/* General error */}
                <AnimatePresence>
                  {generalError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ display: "flex", alignItems: "flex-start", gap: 12, borderRadius: 14, background: "rgba(244,63,94,0.09)", padding: "14px 16px", fontSize: 12, color: "#fca5a5", border: "1px solid rgba(244,63,94,0.2)" }}
                    >
                      <AlertCircle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1, color: "#f87171" }} />
                      <span>{generalError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fields */}
                {category.fields.map((field, idx) => {
                  const hasErr = !!errors[field.key];
                  const inputBase = `w-full border outline-none transition-all duration-200 focus:ring-2 placeholder-slate-500 ${colors.ring}`;
                  const inputStyle = {
                    background: "rgba(255,255,255,0.07)",
                    borderColor: hasErr ? "#f43f5e" : "rgba(255,255,255,0.12)",
                    borderRadius: 14,
                    padding: "12px 16px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#fff",
                  };

                  return (
                    <motion.div
                      key={field.key}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.025, ...spring }}
                      style={{ display: "flex", flexDirection: "column", gap: 8 }}
                    >
                      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "rgba(148,163,184,0.7)", display: "block" }}>
                        {field.label}
                        {field.required && <span style={{ color: "#f43f5e", marginLeft: 4 }}>*</span>}
                      </label>

                      {field.type === "select" ? (
                        <select
                          value={formData[field.key] || ""}
                          onChange={e => handleInputChange(field.key, e.target.value)}
                          className={inputBase}
                          style={{ ...inputStyle, background: "rgba(255,255,255,0.09)", cursor: "pointer" }}
                        >
                          {field.options?.map(opt => <option key={opt} value={opt} style={{ background: "#0f0f2a" }}>{opt}</option>)}
                        </select>

                      ) : field.type === "file" ? (
                        <div className="space-y-3">
                          <input id={`input-${field.key}`} type="file" accept="image/*,application/pdf" className="hidden"
                            onChange={async e => { const f = e.target.files?.[0]; if (f) await processSelectedFile(field.key, f); }} />

                          {isCameraActive && activeCameraField === field.key ? (
                            <div className="rounded-2xl border border-indigo-500/40 overflow-hidden bg-black">
                              <div className="relative aspect-[4/3] flex items-center justify-center">
                                {cameraError
                                  ? <div className="p-6 text-center">
                                      <AlertCircle className="h-6 w-6 text-rose-400 mx-auto mb-2" />
                                      <p className="text-xs text-rose-300 font-bold">{cameraError}</p>
                                    </div>
                                  : <>
                                      <video ref={videoRef} playsInline className="w-full h-full object-cover" />
                                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-mono text-indigo-400">
                                        {facingMode === "environment" ? "REAR" : "FRONT"}
                                      </div>
                                    </>
                                }
                              </div>
                              <div className="flex items-center justify-between p-3 gap-2 border-t border-white/5 bg-black/60">
                                <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={stopCamera}
                                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 border border-white/8 bg-white/4 hover:bg-white/8 transition">
                                  Cancel
                                </motion.button>
                                {!cameraError && <>
                                  <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => capturePhoto(field.key)}
                                    className="px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-lg shadow-indigo-500/30">
                                    <Camera className="h-3.5 w-3.5" /> Capture
                                  </motion.button>
                                  <motion.button type="button" whileTap={{ scale: 0.95 }}
                                    onClick={() => { const next = facingMode === "environment" ? "user" : "environment"; setFacingMode(next); startCamera(field.key, next); }}
                                    className="p-2.5 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 text-slate-300 transition">
                                    <RefreshCw className="h-4 w-4" />
                                  </motion.button>
                                </>}
                              </div>
                            </div>

                          ) : formData[field.key] ? (
                            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/8 bg-white/3">
                              <div className="h-12 w-12 rounded-xl overflow-hidden bg-white/5 border border-white/5 shrink-0 flex items-center justify-center">
                                {formData[field.key].startsWith("data:image/")
                                  ? <img src={formData[field.key]} alt="preview" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                                  : <FileText className="h-6 w-6 text-indigo-400" />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">
                                  {fileMetaMap[field.key]?.name || "Attached File"}
                                </p>
                                <p className="text-[10px] text-indigo-400 font-bold mt-0.5">
                                  {fileMetaMap[field.key]?.size ? formatBytes(fileMetaMap[field.key].size) : "Saved"} · Firestore
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <motion.button type="button" whileTap={{ scale: 0.95 }}
                                  onClick={() => startCamera(field.key, "environment")}
                                  className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition">
                                  <Camera className="h-3.5 w-3.5" />
                                </motion.button>
                                <label htmlFor={`input-${field.key}`}
                                  className="cursor-pointer px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-xs font-bold text-slate-400 hover:bg-white/8 hover:text-white transition flex items-center gap-1">
                                  <Upload className="h-3 w-3" /> Replace
                                </label>
                                <motion.button type="button" whileTap={{ scale: 0.95 }}
                                  onClick={() => { setFormData(p => ({ ...p, [field.key]: "" })); setFileMetaMap(p => { const n = { ...p }; delete n[field.key]; return n; }); }}
                                  className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </motion.button>
                              </div>
                            </div>

                          ) : (
                            <div
                              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.background = `${colors.accent}08`; }}
                              onDragLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.background = ""; }}
                              onDrop={async e => { e.preventDefault(); e.currentTarget.style.borderColor = ""; e.currentTarget.style.background = ""; const f = e.dataTransfer.files?.[0]; if (f) await processSelectedFile(field.key, f); }}
                              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${hasErr ? "border-rose-500/50" : "border-white/8"}`}
                              style={{ background: "rgba(255,255,255,0.02)" }}
                            >
                              <div className="flex justify-center mb-3">
                                {isFileProcessing
                                  ? <div className="h-10 w-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                                  : <div className="p-2.5 rounded-xl bg-white/5 border border-white/8 text-slate-500">
                                      <Upload className="h-5 w-5" />
                                    </div>
                                }
                              </div>
                              <p className="text-sm font-bold text-slate-300 mb-1">
                                {isFileProcessing ? "Processing..." : "Drop file or choose below"}
                              </p>
                              <p className="text-[10px] text-slate-600 mb-4">PDF, JPG, PNG — max 2MB</p>
                              <div className="flex justify-center gap-2">
                                <motion.button type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                  onClick={() => document.getElementById(`input-${field.key}`)?.click()}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-xs font-bold text-slate-300 hover:bg-white/8 hover:text-white transition cursor-pointer">
                                  <Upload className="h-3.5 w-3.5" /> Upload File
                                </motion.button>
                                <motion.button type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                  onClick={() => startCamera(field.key, "environment")}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-xs font-bold text-indigo-300 hover:bg-indigo-500/25 transition cursor-pointer">
                                  <Camera className="h-3.5 w-3.5" /> Camera
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </div>

                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formData[field.key] || ""}
                          onChange={e => handleInputChange(field.key, e.target.value)}
                          onBlur={e => handleBlur(field.key, e.target.value)}
                          className={inputBase}
                          style={inputStyle}
                        />
                      )}

                      {/* Field error */}
                      <AnimatePresence>
                        {hasErr && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] text-rose-400 font-bold flex items-center gap-1 pl-1"
                          >
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            {errors[field.key]}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer actions */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                padding: "14px 24px", borderTop: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.02)", flexShrink: 0,
              }}>
                <motion.button
                  type="button" onClick={onClose} disabled={isSaving}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{
                    padding: "11px 22px", borderRadius: 12, cursor: "pointer",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: 12, fontWeight: 700, color: "rgba(148,163,184,0.8)",
                    opacity: isSaving ? 0.4 : 1,
                  }}
                >
                  Cancel
                </motion.button>

                <motion.button
                  type="submit" disabled={isSaving}
                  whileHover={{ scale: 1.03, boxShadow: `0 8px 28px ${colors.accent}55, inset 0 1px 0 rgba(255,255,255,0.25)` }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "11px 28px", borderRadius: 12, cursor: "pointer",
                    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accent}cc 100%)`,
                    border: `1px solid ${colors.accent}55`,
                    boxShadow: `0 4px 20px ${colors.accent}40, inset 0 1px 0 rgba(255,255,255,0.16)`,
                    fontSize: 12, fontWeight: 900, color: "#fff",
                    letterSpacing: "0.06em", textTransform: "uppercase" as const,
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  {isSaving ? (
                    <>
                      <div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save style={{ width: 13, height: 13 }} />
                      Save Record
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
