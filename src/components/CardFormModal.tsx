import React, { useState, useEffect, useRef } from "react";
import { X, Save, AlertCircle, Upload, FileText, Trash2, Camera, RefreshCw } from "lucide-react";
import { CategorySchema, formatExpiryToMMYY, formatCardNumber } from "../types";

interface CardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategorySchema;
  initialData?: Record<string, any> | null;
  onSave: (data: Record<string, any>) => Promise<boolean | { success: boolean; error?: string }>;
  isSaving: boolean;
}

export default function CardFormModal({
  isOpen,
  onClose,
  category,
  initialData,
  onSave,
  isSaving
}: CardFormModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [fileMetaMap, setFileMetaMap] = useState<Record<string, {name: string, size: number}>>({});
  const [isFileProcessing, setIsFileProcessing] = useState<boolean>(false);

  // Camera integration state helper
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [activeCameraField, setActiveCameraField] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 750;
        const MAX_HEIGHT = 750;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.7);
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => {
        resolve(dataUrl);
      };
    });
  };

  const processSelectedFile = async (fieldKey: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [fieldKey]: "The file exceeds the 2MB size limit." }));
      return;
    }
    
    setIsFileProcessing(true);
    setErrors(prev => ({ ...prev, [fieldKey]: "" }));
    
    try {
      const reader = new FileReader();
      
      const fileLoaded = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      let finalDataUrl = fileLoaded;
      
      if (file.type.startsWith("image/")) {
        finalDataUrl = await compressImage(fileLoaded);
      }
      
      setFormData(prev => ({ ...prev, [fieldKey]: finalDataUrl }));
      setFileMetaMap(prev => ({
        ...prev,
        [fieldKey]: {
          name: file.name,
          size: Math.floor((finalDataUrl.length * 3) / 4)
        }
      }));
    } catch (err) {
      console.error("Error reading file:", err);
      setErrors(prev => ({ ...prev, [fieldKey]: "Failed to parse or compress this document." }));
    } finally {
      setIsFileProcessing(false);
    }
  };

  // --- CAMERA CAPTURE UTILITIES ---
  const startCamera = async (fieldKey: string, mode: "user" | "environment" = facingMode) => {
    setCameraError("");
    setIsCameraActive(true);
    setActiveCameraField(fieldKey);
    
    // Stop any existing stream
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => {
          console.error("Video play error:", err);
        });
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      let errorMsg = "Could not access camera.";
      if (err.name === "NotAllowedError") {
        errorMsg = "Camera permission denied. Please allow camera access in your browser or click 'Open App in a New Tab' in the top-right.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "No camera found on this device.";
      } else {
        errorMsg = `Camera error: ${err.message || 'Check browser permissions.'}`;
      }
      setCameraError(errorMsg);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setIsCameraActive(false);
    setActiveCameraField(null);
    setCameraError("");
  };

  const toggleFacingMode = (fieldKey: string) => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(fieldKey, nextMode);
  };

  const capturePhoto = async (fieldKey: string) => {
    if (!videoRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      
      // Match physical size of video to avoid resolution issues
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        
        setIsFileProcessing(true);
        const compressed = await compressImage(dataUrl);
        
        setFormData(prev => ({ ...prev, [fieldKey]: compressed }));
        setFileMetaMap(prev => ({
          ...prev,
          [fieldKey]: {
            name: `CameraPhoto_${new Date().toISOString().slice(0, 10)}_${Math.floor(Math.random() * 1000)}.jpg`,
            size: Math.floor((compressed.length * 3) / 4)
          }
        }));
      }
      stopCamera();
    } catch (err) {
      console.error("Error capturing photo:", err);
      setErrors(prev => ({ ...prev, [fieldKey]: "Failed to capture photo from camera stream." }));
    } finally {
      setIsFileProcessing(false);
    }
  };

  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => console.error("Play error in effect:", err));
    }
  }, [cameraStream, isCameraActive]);

  useEffect(() => {
    if (!isOpen) {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      setCameraStream(null);
      setIsCameraActive(false);
      setActiveCameraField(null);
      setCameraError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      const processed: Record<string, any> = { ...initialData };
      category.fields.forEach(f => {
        if ((f.key === "Name" || f.key === "AccountHolderName" || f.key === "CardHolderName" || f.key === "PanNumber" || f.key === "EpicNumber") && processed[f.key]) {
          processed[f.key] = String(processed[f.key]).toUpperCase();
        }
        if (f.key === "Expiry" && processed[f.key]) {
          processed[f.key] = formatExpiryToMMYY(processed[f.key]);
        }
        if (f.key === "CardNumber" && processed[f.key]) {
          processed[f.key] = formatCardNumber(processed[f.key]);
        }
      });
      setFormData(processed);
    } else {
      // Initialize with empty strings for all fields
      const initial: Record<string, any> = {};
      category.fields.forEach(f => {
        initial[f.key] = f.type === "select" && f.options ? f.options[0] : "";
      });
      setFormData(initial);
    }
    setErrors({});
    setGeneralError("");
  }, [initialData, category, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (key: string, value: string) => {
    let finalValue = value;
    if (key === "Name" || key === "AccountHolderName" || key === "CardHolderName" || key === "PanNumber" || key === "EpicNumber") {
      finalValue = value.toUpperCase();
    }
    if (key === "CardNumber") {
      finalValue = formatCardNumber(value);
    }
    if (key === "CVV") {
      const digitsOnly = value.replace(/\D/g, "");
      finalValue = digitsOnly.slice(0, 3);
    }
    if (key === "PIN") {
      finalValue = value.replace(/\D/g, "");
    }
    if (key === "Expiry") {
      const digits = value.replace(/\D/g, "");
      if (digits.length > 2) {
        finalValue = digits.slice(0, 2) + "/" + digits.slice(2, 4);
      } else {
        finalValue = digits;
      }
    }
    setFormData(prev => ({ ...prev, [key]: finalValue }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  };

  const handleBlur = (key: string, value: string) => {
    const isEmailField = 
      category.fields.find(f => f.key === key)?.type === "email" ||
      key.toLowerCase().includes("email") ||
      (category.id === "media" && key === "Userid");

    if (isEmailField && value.trim() !== "") {
      const trimmed = value.trim();
      if (!trimmed.includes("@")) {
        const finalValue = `${trimmed}@gmail.com`;
        setFormData(prev => ({ ...prev, [key]: finalValue }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Auto-complete email inputs with @gmail.com if they don't contain @
    const processedData = { ...formData };
    category.fields.forEach(f => {
      const val = processedData[f.key];
      const isEmailField = 
        f.type === "email" || 
        f.key.toLowerCase().includes("email") || 
        (category.id === "media" && f.key === "Userid");

      if (isEmailField && val !== undefined && String(val).trim() !== "") {
        const trimmed = String(val).trim();
        if (!trimmed.includes("@")) {
          processedData[f.key] = `${trimmed}@gmail.com`;
        }
      }
    });

    setFormData(processedData);

    category.fields.forEach(f => {
      const val = processedData[f.key];
      const hasValue = val !== undefined && String(val).trim() !== "";

      if (f.required && !hasValue) {
        newErrors[f.key] = `${f.label} is required`;
        return;
      }

      if (hasValue) {
        // Name, AccountHolderName, CardHolderName, EpicNumber, PanNumber: must be in uppercase
        if (f.key === "Name" || f.key === "AccountHolderName" || f.key === "CardHolderName" || f.key === "EpicNumber" || f.key === "PanNumber") {
          const rawVal = String(val);
          if (/[a-z]/.test(rawVal)) {
            newErrors[f.key] = `${f.label} must be in uppercase letters only.`;
          }
        }

        // CVV Number: must be exactly three digits
        if (f.key === "CVV") {
          const cleanCVV = String(val).trim();
          if (!/^\d{3}$/.test(cleanCVV)) {
            newErrors[f.key] = "CVV must be exactly three digits.";
          }
        }

        // PIN Number: must consist of digits only
        if (f.key === "PIN") {
          const cleanPIN = String(val).trim();
          if (!/^\d+$/.test(cleanPIN)) {
            newErrors[f.key] = "PIN must consist of digits only.";
          }
        }

        // Expiry Date: must be MM/YY format
        if (f.key === "Expiry") {
          const cleanExpiry = String(val).trim();
          if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cleanExpiry)) {
            newErrors[f.key] = 'Expiry should be in format of "MM/YY".';
          }
        }

        // Aadhaar Number: Exactly 12 digits
        if (f.key === "AdharNumber") {
          const cleanAdhar = String(val).replace(/[\s-]/g, "");
          if (!/^\d{12}$/.test(cleanAdhar)) {
            newErrors[f.key] = "Aadhaar number must consist of exactly 12 digits.";
          }
        }

        // PAN Number: 5 uppercase letters, 4 digits, 1 uppercase letter
        if (f.key === "PanNumber") {
          const cleanPan = String(val).trim();
          if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(cleanPan)) {
            newErrors[f.key] = "PAN must have first 5 uppercase alphabets, next 4 characters as numbers, and last character as an uppercase alphabet (e.g., ABCDE1234F).";
          }
        }

        // Account Number: numbers only, > 10 digits
        if (f.key === "AccountNumber") {
          const cleanAccount = String(val).trim().replace(/[\s-]/g, "");
          if (!/^\d+$/.test(cleanAccount)) {
            newErrors[f.key] = "Account number must consist of numbers only.";
          } else if (cleanAccount.length <= 10) {
            newErrors[f.key] = "Account number must be greater than 10 digits.";
          }
        }

        // IFSC code: first 4 uppercase letters, 5th character a digit, last 6 alphanumeric
        if (f.key === "IFSC") {
          const cleanIFSC = String(val).trim();
          if (!/^[A-Z]{4}\d[A-Z0-9]{6}$/i.test(cleanIFSC)) {
            newErrors[f.key] = "IFSC code must have first 4 uppercase characters, fifth character as a digit, and last 6 as numbers, alphabets, or both (e.g., SBIN0001234).";
          } else if (!/^[A-Z]{4}\d[A-Z0-9]{6}$/.test(cleanIFSC)) {
            newErrors[f.key] = "IFSC alphabets must be in uppercase.";
          }
        }

        // Mobile Numbers: 10-digit Indian number starting with 6, 7, 8, or 9
        if (f.key.toLowerCase().includes("mobilenumber")) {
          const rawMobile = String(val).trim();
          let targetMobile = rawMobile.replace(/[\s\-\(\)\+]/g, "");
          if (targetMobile.startsWith("91") && targetMobile.length > 10) {
            targetMobile = targetMobile.slice(2);
          }
          if (!/^[6-9]\d{9}$/.test(targetMobile)) {
            newErrors[f.key] = "Mobile number should be a 10-digit Indian number starting with 6, 7, 8, or 9.";
          }
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setGeneralError("");
    const result = await onSave(processedData);
    if (typeof result === "object") {
      if (result.success) {
        onClose();
      } else {
        setGeneralError(result.error || "An error occurred while saving the record. Please check your setup.");
      }
    } else {
      if (result) {
        onClose();
      } else {
        setGeneralError("An error occurred while saving the record. Please check your setup.");
      }
    }
  };

  const getCategoryThemeColors = (id: string) => {
    switch (id) {
      case "personal": return "indigo-500 hover:shadow-indigo-500/25";
      case "financial": return "emerald-500 hover:shadow-emerald-500/25";
      case "card": return "cyan-500 hover:shadow-cyan-500/25";
      case "media": return "amber-500 hover:shadow-amber-500/25";
      default: return "rose-500 hover:shadow-rose-500/25";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="form-modal-backdrop">
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div 
          className="relative transform overflow-hidden rounded-3xl bg-slate-950 border border-white/10 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
          id="form-modal-container"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
            <div>
              <h3 className="text-lg font-black text-white">
                {initialData ? "Edit Record" : `Add New ${category.title}`}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Saved directly to Google Sheets category "{category.sheetName}"
              </p>
            </div>
            <button
              id="btn-close-modal"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-slate-950 px-6 py-6 max-h-[60vh] overflow-y-auto space-y-5">
              {generalError && (
                <div className="flex items-start gap-3 rounded-2xl bg-rose-500/10 p-4 text-xs text-rose-300 border border-rose-500/20 shadow-lg animate-pulse">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                  <span>{generalError}</span>
                </div>
              )}

              {category.fields.map(field => {
                const hasError = !!errors[field.key];
                return (
                  <div key={field.key} className="space-y-2">
                    <label className="text-xs font-black text-slate-350 tracking-wider block">
                      {field.label} {field.required && <span className="text-rose-400">*</span>}
                    </label>

                    {field.type === "select" ? (
                      <select
                        id={`input-${field.key}`}
                        value={formData[field.key] || ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm bg-slate-900 border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                          hasError 
                            ? "border-rose-500 ring-rose-500/20" 
                            : "focus:border-indigo-400"
                        }`}
                      >
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === "file" ? (
                      <div className="space-y-3">
                        <input
                          id={`input-${field.key}`}
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            await processSelectedFile(field.key, file);
                          }}
                        />
                        
                        {isCameraActive && activeCameraField === field.key ? (
                          <div className="relative overflow-hidden rounded-2xl border border-indigo-500 bg-slate-950 p-4 flex flex-col items-center gap-3">
                            {/* Video Viewport Container */}
                            <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                              {cameraError ? (
                                <div className="p-4 text-center text-xs text-rose-400 font-bold flex flex-col items-center gap-2">
                                  <AlertCircle className="h-6 w-6" />
                                  <p>{cameraError}</p>
                                  <button
                                    type="button"
                                    onClick={() => startCamera(field.key, facingMode)}
                                    className="mt-2 px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/15 transition text-[11px]"
                                  >
                                    Retry Camera Access
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <video
                                    ref={videoRef}
                                    playsInline
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-2 right-2 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] font-mono text-indigo-400 border border-white/5 uppercase">
                                    Live Stream ({facingMode === "environment" ? "Rear / Doc" : "Front"})
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Camera Action Buttons */}
                            <div className="flex items-center justify-between w-full px-2 gap-2">
                              <button
                                type="button"
                                onClick={stopCamera}
                                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/5 text-xs text-slate-300 font-bold transition flex items-center gap-1.5"
                              >
                                Cancel
                              </button>
                              
                              {!cameraError && (
                                <button
                                  type="button"
                                  onClick={() => capturePhoto(field.key)}
                                  className="px-5 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/20 active:scale-95 transition flex items-center gap-1.5 uppercase tracking-wide"
                                >
                                  <Camera className="h-4 w-4" /> Capture Photo
                                </button>
                              )}

                              {!cameraError && (
                                <button
                                  type="button"
                                  onClick={() => toggleFacingMode(field.key)}
                                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-855 border border-white/5 text-slate-300 hover:text-white transition flex items-center justify-center"
                                  title="Flip Camera"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ) : formData[field.key] ? (
                          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col md:flex-row items-center gap-4 transition hover:border-white/20">
                            <div className="h-16 w-16 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                              {formData[field.key].startsWith("data:image/") || formData[field.key].startsWith("data:image/svg") ? (
                                <img 
                                  src={formData[field.key]} 
                                  alt="Attachment Preview" 
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <FileText className="h-8 w-8 text-indigo-400" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0 text-center md:text-left">
                              <p className="text-sm font-bold text-slate-100 truncate">
                                {fileMetaMap[field.key]?.name || `${formData.Title || "Attached Document"}.${formData[field.key].includes("pdf") ? "pdf" : "jpg"}`}
                              </p>
                              <p className="text-xs text-indigo-400 font-bold mt-1">
                                {fileMetaMap[field.key]?.size 
                                  ? formatBytes(fileMetaMap[field.key].size) 
                                  : formatBytes(Math.floor((formData[field.key].length * 3) / 4))} (Spreadsheet Saved)
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => startCamera(field.key, "environment")}
                                className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition"
                                title="Re-take Photo with Camera"
                              >
                                <Camera className="h-4 w-4" />
                              </button>
                              <label 
                                htmlFor={`input-${field.key}`}
                                className="cursor-pointer px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-350 transition flex items-center gap-1"
                              >
                                <Upload className="h-3 w-3" /> Replace
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, [field.key]: "" }));
                                  setFileMetaMap(prev => {
                                    const next = { ...prev };
                                    delete next[field.key];
                                    return next;
                                  });
                                }}
                                className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add("border-indigo-500", "bg-indigo-500/5");
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-500/5");
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-500/5");
                              const file = e.dataTransfer.files?.[0];
                              if (file) {
                                await processSelectedFile(field.key, file);
                              }
                            }}
                            className={`group border-2 border-dashed border-white/10 bg-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition duration-200 ${
                              hasError ? "border-rose-500 ring-2 ring-rose-500/20" : ""
                            }`}
                          >
                            <div className="p-3 bg-white/5 rounded-full border border-white/5 text-slate-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 group-hover:text-indigo-400 transition duration-300 mb-3">
                              {isFileProcessing ? (
                                <svg className="animate-spin h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                <Upload className="h-6 w-6" />
                              )}
                            </div>
                            <span className="text-sm font-bold text-slate-200">
                              {isFileProcessing ? "Processing..." : "Select Document Photo or PDF"}
                            </span>
                            <span className="text-xs text-slate-450 mt-1 leading-normal max-w-xs block">
                              Drag and drop files here, or choose one of the options below:
                            </span>

                            <div className="flex flex-col sm:flex-row items-center gap-2 mt-4 w-full max-w-xs">
                              <button
                                type="button"
                                onClick={() => document.getElementById(`input-${field.key}`)?.click()}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-slate-350 hover:bg-slate-800 hover:text-white hover:border-white/20 transition cursor-pointer"
                              >
                                <Upload className="h-3.5 w-3.5" /> Upload File
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => startCamera(field.key, "environment")}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/35 text-xs font-bold text-indigo-300 hover:bg-indigo-500/35 hover:text-indigo-200 transition cursor-pointer"
                              >
                                <Camera className="h-3.5 w-3.5" /> Capture Photo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        id={`input-${field.key}`}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.key] || ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        onBlur={(e) => handleBlur(field.key, e.target.value)}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm bg-white/5 border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                          hasError 
                            ? "border-rose-500 ring-2 ring-rose-500/20" 
                            : "focus:border-indigo-505"
                        }`}
                      />
                    )}

                    {hasError && (
                      <p className="text-xs text-rose-400 font-bold ml-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {errors[field.key]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="bg-white/5 px-6 py-5 flex items-center justify-end gap-3.5 border-t border-white/10">
              <button
                id="btn-cancel"
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id="btn-submit"
                type="submit"
                disabled={isSaving}
                className={`group relative overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] border border-white/10 flex items-center justify-center gap-2 px-6 py-3 text-white font-black text-xs tracking-wider`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600`} />
                <span className="relative flex items-center gap-1.5">
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      SAVING...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      SAVE RECORD
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
