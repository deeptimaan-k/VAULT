import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, User, RotateCcw, ArrowRight, Zap, Paperclip, CheckCircle2, FileText } from "lucide-react";
import { auth } from "../lib/firebase";
import { CATEGORIES } from "../types";
import { useIsMobile } from "../hooks/useIsMobile";

// ─── Types ─────────────────────────────────────────────────────────────────

interface AttachFile {
  name: string;
  mimeType: string;
  base64: string;
  preview?: string;
  label: "Front" | "Back";
}

interface Message {
  id: number;
  role: "user" | "bot";
  content: string;
  navigateTo?: string;
  attachPreviews?: { preview?: string; mimeType: string; label: string }[];
  saveData?: { category: string; data: Record<string, any> };
}

interface Props {
  data: Record<string, any[]>;
  onNavigate: (categoryId: string) => void;
  onRecordAdded?: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "What's in my vault?",
  "Show my bank accounts",
  "Any expiring cards?",
  "List my passwords",
];

const CAT_LABELS: Record<string, string> = {
  personal: "Personal Info", financial: "Bank & Finance", card: "Cards",
  media: "Media & Gmail", others: "Others", documents: "Documents",
};

const SAVE_CAT_LABELS: Record<string, string> = {
  PersonalData: "Personal Info", FinancialData: "Bank & Finance", Card: "Cards",
  "Media/Gmail": "Media & Gmail", Others: "Others", Documents: "Documents",
};

let _id = 0;
const uid = () => ++_id;

// ─── Helpers ────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseSaveTag(raw: string): { category: string; data: Record<string, any> } | undefined {
  const idx = raw.lastIndexOf("[SAVE:");
  if (idx === -1) return undefined;
  const after    = raw.slice(idx + 6);
  const colonIdx = after.indexOf(":");
  if (colonIdx === -1) return undefined;
  const category = after.slice(0, colonIdx);
  const rest     = after.slice(colonIdx + 1);
  let depth = 0, end = -1;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "{") depth++;
    else if (rest[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return undefined;
  try { return { category, data: JSON.parse(rest.slice(0, end + 1)) }; }
  catch { return undefined; }
}

// ─── InlineMd ───────────────────────────────────────────────────────────────

function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} style={{ color: "#e2e8f0", fontWeight: 800 }}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

// ─── SaveCard ────────────────────────────────────────────────────────────────

function SaveCard({ saveData, onSave }: {
  saveData: { category: string; data: Record<string, any> };
  onSave: (cat: string, data: Record<string, any>) => Promise<void>;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const catLabel = SAVE_CAT_LABELS[saveData.category] || saveData.category;
  const entries  = Object.entries(saveData.data).filter(([, v]) => v);

  if (state === "saved") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ marginTop: 14, padding: "12px 15px", borderRadius: 14, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", display: "flex", alignItems: "center", gap: 9 }}>
        <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399", flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#34d399" }}>Saved to {catLabel}!</span>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      style={{ marginTop: 14, borderRadius: 14, overflow: "hidden", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}>

      {/* header */}
      <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid rgba(124,58,237,0.13)", display: "flex", alignItems: "center", gap: 7 }}>
        <FileText style={{ width: 13, height: 13, color: "#a78bfa", flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.02em" }}>Save to {catLabel}</span>
      </div>

      {/* field preview */}
      <div style={{ padding: "8px 14px 4px" }}>
        {entries.slice(0, 5).map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 8, marginBottom: 5, fontSize: 11 }}>
            <span style={{ color: "rgba(148,163,184,0.45)", fontWeight: 600, minWidth: 90, flexShrink: 0 }}>{k}:</span>
            <span style={{ color: "rgba(226,232,240,0.8)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(v)}</span>
          </div>
        ))}
        {entries.length > 5 && (
          <p style={{ margin: "0 0 4px", fontSize: 10, color: "rgba(148,163,184,0.3)" }}>+{entries.length - 5} more fields</p>
        )}
      </div>

      {/* save button */}
      <div style={{ padding: "6px 14px 12px" }}>
        {state === "error" && <p style={{ margin: "0 0 6px", fontSize: 10, color: "#f87171" }}>⚠ {errMsg}</p>}
        <motion.button
          whileHover={state !== "saving" ? { scale: 1.03, boxShadow: "0 4px 16px rgba(124,58,237,0.4)" } : {}}
          whileTap={state !== "saving" ? { scale: 0.97 } : {}}
          disabled={state === "saving"}
          onClick={async () => {
            setState("saving");
            try { await onSave(saveData.category, saveData.data); setState("saved"); }
            catch (e: any) { setErrMsg(e.message || "Save failed"); setState("error"); }
          }}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 11, cursor: state === "saving" ? "wait" : "pointer",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "1px solid rgba(124,58,237,0.5)",
            boxShadow: "0 3px 14px rgba(124,58,237,0.3)", fontSize: 12, fontWeight: 800, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7, opacity: state === "saving" ? 0.7 : 1,
          }}
        >
          {state === "saving" ? (
            <>
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
              Saving…
            </>
          ) : (
            <><CheckCircle2 style={{ width: 13, height: 13 }} /> Save to Vault</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── BotBubble ───────────────────────────────────────────────────────────────

function BotBubble({ content, navigateTo, onNavigate, saveData, onSave }: {
  content: string; navigateTo?: string; onNavigate: (id: string) => void;
  saveData?: { category: string; data: Record<string, any> };
  onSave: (cat: string, data: Record<string, any>) => Promise<void>;
}) {
  const catLabel = navigateTo ? CAT_LABELS[navigateTo] : null;
  return (
    <div style={{ fontSize: 13, color: "rgba(203,213,225,0.9)", fontWeight: 500, lineHeight: 1.75 }}>
      {content.split("\n").map((line, i) => {
        const trimmed = line.trimStart();
        const nested  = line.length - trimmed.length >= 2;
        if (/^[•\-\*]\s/.test(trimmed)) {
          const text = trimmed.replace(/^[•\-\*]\s+/, "");
          return (
            <div key={i} style={{ display: "flex", gap: 8, marginLeft: nested ? 16 : 0, marginTop: nested ? 2 : 6 }}>
              <span style={{ color: nested ? "rgba(167,139,250,0.5)" : "#a78bfa", flexShrink: 0, fontSize: nested ? 9 : 11, marginTop: nested ? 4 : 3 }}>
                {nested ? "◦" : "•"}
              </span>
              <span><InlineMd text={text} /></span>
            </div>
          );
        }
        if (!trimmed) return <div key={i} style={{ height: 5 }} />;
        return <div key={i} style={{ marginTop: i === 0 ? 0 : 2 }}><InlineMd text={line} /></div>;
      })}

      {navigateTo && catLabel && (
        <motion.button whileHover={{ scale: 1.04, x: 2, boxShadow: "0 6px 24px rgba(124,58,237,0.45)" }} whileTap={{ scale: 0.96 }} onClick={() => onNavigate(navigateTo)}
          style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 15px 8px 12px", borderRadius: 12, cursor: "pointer", background: "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(79,70,229,0.14))", border: "1px solid rgba(124,58,237,0.38)", fontSize: 11, fontWeight: 800, color: "#a78bfa" }}>
          <ArrowRight style={{ width: 12, height: 12 }} />
          Go to {catLabel}
        </motion.button>
      )}

      {saveData && <SaveCard saveData={saveData} onSave={onSave} />}
    </div>
  );
}

// ─── AttachThumb ─────────────────────────────────────────────────────────────

function AttachThumb({ file, onRemove }: { file: AttachFile; onRemove: () => void }) {
  const isImage = file.mimeType.startsWith("image/");
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
      style={{ position: "relative", flexShrink: 0 }}>
      <div style={{ width: 70, height: 70, borderRadius: 12, overflow: "hidden", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isImage && file.preview
          ? <img src={file.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <FileText style={{ width: 26, height: 26, color: "#a78bfa" }} />
        }
      </div>
      {/* front/back label */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center", fontSize: 8, fontWeight: 900, color: "#fff", background: "rgba(124,58,237,0.88)", padding: "2px 0", borderRadius: "0 0 11px 11px", letterSpacing: "0.07em" }}>
        {file.label}
      </div>
      {/* remove button */}
      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={onRemove}
        style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "rgba(244,63,94,0.9)", border: "1.5px solid rgba(10,8,30,1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <X style={{ width: 9, height: 9, color: "#fff" }} />
      </motion.button>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIChat({ data, onNavigate, onRecordAdded }: Props) {
  const isMobile                      = useIsMobile();
  const [open, setOpen]               = useState(false);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [attachments, setAttachments] = useState<AttachFile[]>([]);
  const bottomRef                     = useRef<HTMLDivElement>(null);
  const inputRef                      = useRef<HTMLInputElement>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const dataRef                       = useRef(data);
  dataRef.current                     = data;

  useEffect(() => {
    return () => attachments.forEach(a => { if (a.preview) URL.revokeObjectURL(a.preview); });
  }, []); // eslint-disable-line

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 280); }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const history = () => messages.slice(-12).map(m => ({ role: m.role, content: m.content }));

  // ── File select ────────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 2 - attachments.length);
    const labels: ("Front" | "Back")[] = ["Front", "Back"];
    const processed: AttachFile[] = [];

    for (const file of selected) {
      if (file.size > 4 * 1024 * 1024) { alert(`${file.name} is too large. Max 4MB.`); continue; }
      const base64  = await fileToBase64(file);
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      const label   = labels[attachments.length + processed.length] as "Front" | "Back";
      processed.push({ name: file.name, mimeType: file.type, base64, preview, label });
    }
    setAttachments(prev => [...prev, ...processed].slice(0, 2));
    e.target.value = "";
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => {
      const copy = [...prev];
      if (copy[idx].preview) URL.revokeObjectURL(copy[idx].preview!);
      copy.splice(idx, 1);
      return copy.map((f, i) => ({ ...f, label: (["Front", "Back"] as const)[i] }));
    });
  };

  // ── Save to vault ──────────────────────────────────────────────────────────
  const saveToVault = useCallback(async (category: string, recordData: Record<string, any>) => {
    const token = await auth.currentUser?.getIdToken();
    const res   = await fetch("/api/mongodb/records", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
      body: JSON.stringify({ sheetName: category, ...recordData }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || "Failed to save");
    }
    onRecordAdded?.();
  }, [onRecordAdded]);

  // ── Send message ───────────────────────────────────────────────────────────
  const send = useCallback(async (text: string) => {
    const msg      = text.trim();
    const hasFiles = attachments.length > 0;
    if (!msg && !hasFiles) return;
    if (loading) return;

    setInput("");
    const sentAttach = [...attachments];
    setAttachments([]);

    setMessages(prev => [...prev, {
      id: uid(), role: "user", content: msg,
      attachPreviews: sentAttach.map(a => ({ preview: a.preview, mimeType: a.mimeType, label: a.label })),
    }]);
    setLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res   = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({
          message: msg || (hasFiles ? "Extract all information from this document." : ""),
          vaultData: dataRef.current,
          history: history(),
          files: sentAttach.map(a => ({ base64: a.base64, mimeType: a.mimeType, name: a.name })),
        }),
      });
      const json = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);

      const raw        = (json.reply ?? "") as string;
      const navMatch   = raw.match(/\[NAVIGATE:(\w+)\]/);
      const navigateTo = navMatch?.[1];
      const saveData   = parseSaveTag(raw);

      let content = saveData ? raw.slice(0, raw.lastIndexOf("[SAVE:")).trim() : raw;
      content     = content.replace(/\[NAVIGATE:\w+\]/g, "").trim();

      setMessages(prev => [...prev, { id: uid(), role: "bot", content, navigateTo, saveData }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { id: uid(), role: "bot", content: `⚠️ ${err?.message ?? "Connection error"}` }]);
    } finally {
      setLoading(false);
    }
  }, [loading, attachments]); // eslint-disable-line

  const handleNavigate = (catId: string) => {
    if (CATEGORIES.find(c => c.id === catId)) { onNavigate(catId); setOpen(false); }
  };

  const canSend = (!loading) && (input.trim().length > 0 || attachments.length > 0);

  return (
    <>
      {/* ── Floating button ────────────────────────────────────── */}
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setOpen(v => !v)}
        style={{ position: "fixed", bottom: isMobile ? 16 : 24, right: isMobile ? 16 : 24, zIndex: 150, width: isMobile ? 50 : 56, height: isMobile ? 50 : 56, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%)", border: "2px solid rgba(167,139,250,0.4)", boxShadow: "0 8px 32px rgba(124,58,237,0.55)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        {!open && (
          <>
            <motion.span animate={{ scale: [1, 1.8], opacity: [0.45, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }} style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.5)" }} />
            <motion.span animate={{ scale: [1, 2.4], opacity: [0.2, 0] }} transition={{ repeat: Infinity, duration: 2.2, delay: 0.4, ease: "easeOut" }} style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.3)" }} />
          </>
        )}
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X style={{ width: 22, height: 22, color: "#fff" }} /></motion.div>
            : <motion.div key="s" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Sparkles style={{ width: 22, height: 22, color: "#fff" }} /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* ── Mobile backdrop ────────────────────────────────────── */}
      <AnimatePresence>
        {open && isMobile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 148, background: "rgba(0,0,8,0.7)", backdropFilter: "blur(6px)" }}
          />
        )}
      </AnimatePresence>

      {/* ── Chat panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, y: 28, scale: 0.9 }}
            animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, y: 28, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 440, damping: 36 }}
            style={{
              position: "fixed", zIndex: 149,
              ...(isMobile ? {
                bottom: 0, left: 0, right: 0,
                width: "100%",
                height: "88vh",
                borderRadius: "24px 24px 0 0",
              } : {
                bottom: 90, right: 24,
                width: "min(400px, calc(100vw - 48px))",
                height: "min(580px, calc(100vh - 140px))",
                borderRadius: 24,
              }),
              background: "linear-gradient(160deg, rgba(10,8,30,0.99), rgba(7,6,22,0.99))",
              backdropFilter: "blur(48px) saturate(180%)",
              border: "1px solid rgba(124,58,237,0.22)",
              boxShadow: isMobile
                ? "0 -16px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.035)"
                : "0 32px 96px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.035), 0 0 80px rgba(124,58,237,0.08)",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            {/* gradient bar */}
            <div style={{ height: 2.5, flexShrink: 0, background: "linear-gradient(90deg, #7c3aed, #818cf8, #a78bfa, #818cf8, #7c3aed)" }} />

            {/* drag handle — mobile only */}
            {isMobile && (
              <div onClick={() => setOpen(false)} style={{ flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center", padding: "10px 0 4px", cursor: "pointer" }}>
                <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.18)" }} />
              </div>
            )}

            {/* header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.055)", flexShrink: 0, background: "rgba(124,58,237,0.04)" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 14, background: "linear-gradient(135deg, #7c3aed, #6d28d9, #4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles style={{ width: 18, height: 18, color: "#fff" }} />
                </div>
                <div style={{ position: "absolute", bottom: -1, right: -1, width: 11, height: 11, borderRadius: "50%", background: "#34d399", border: "2px solid rgba(10,8,30,1)", boxShadow: "0 0 6px #34d399" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "-0.2px", lineHeight: 1 }}>Radiant AI</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 99, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
                    <Zap style={{ width: 8, height: 8, color: "#a78bfa" }} />
                    <span style={{ fontSize: 8.5, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.06em" }}>BETA</span>
                  </div>
                </div>
                <p style={{ margin: 0, marginTop: 3, fontSize: 10, color: "rgba(148,163,184,0.45)", fontWeight: 600 }}>Powered by Gemini · Private & secure</p>
              </div>
              {messages.length > 0 && (
                <motion.button whileHover={{ scale: 1.12, rotate: -20 }} whileTap={{ scale: 0.9 }} onClick={() => setMessages([])} title="Clear chat"
                  style={{ width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: "rgba(148,163,184,0.5)", flexShrink: 0 }}>
                  <RotateCcw style={{ width: 12, height: 12 }} />
                </motion.button>
              )}
            </div>

            {/* messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px 10px", display: "flex", flexDirection: "column", gap: 16, scrollbarWidth: "none" }}>

              {/* empty state */}
              {messages.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ textAlign: "center", padding: "8px" }}>
                  <motion.div animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    style={{ width: 64, height: 64, borderRadius: 22, margin: "0 auto 18px", background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(79,70,229,0.08))", border: "1px solid rgba(124,58,237,0.22)", boxShadow: "0 12px 40px rgba(124,58,237,0.14), 0 0 0 8px rgba(124,58,237,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Sparkles style={{ width: 26, height: 26, color: "#a78bfa" }} />
                  </motion.div>
                  <p style={{ margin: 0, marginBottom: 5, fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "-0.2px" }}>Hi! I'm Radiant AI</p>
                  <p style={{ margin: 0, marginBottom: 20, fontSize: 12, color: "rgba(148,163,184,0.45)", lineHeight: 1.65 }}>
                    Ask me anything about your vault<br />or <span style={{ color: "#a78bfa", fontWeight: 700 }}>📎 upload a document</span> to scan it.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    {QUICK_PROMPTS.map((q, i) => (
                      <motion.button key={q} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.06 }}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => send(q)}
                        style={{ padding: "7px 14px", borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#c4b5fd", background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.2)" }}>
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* message bubbles */}
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 440, damping: 32 }}
                  style={{ display: "flex", gap: 9, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>

                  {/* avatar */}
                  <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", background: msg.role === "user" ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))", border: msg.role === "bot" ? "1px solid rgba(124,58,237,0.2)" : "none", boxShadow: msg.role === "user" ? "0 3px 12px rgba(124,58,237,0.38)" : "0 2px 8px rgba(124,58,237,0.08)" }}>
                    {msg.role === "user" ? <User style={{ width: 13, height: 13, color: "#fff" }} /> : <Sparkles style={{ width: 13, height: 13, color: "#a78bfa" }} />}
                  </div>

                  {/* content column */}
                  <div style={{ maxWidth: "83%", display: "flex", flexDirection: "column", gap: 6, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>

                    {/* document thumbnails */}
                    {msg.attachPreviews && msg.attachPreviews.length > 0 && (
                      <div style={{ display: "flex", gap: 6 }}>
                        {msg.attachPreviews.map((a, i) => (
                          <div key={i} style={{ position: "relative" }}>
                            <div style={{ width: 86, height: 86, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(124,58,237,0.4)", background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {a.preview
                                ? <img src={a.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <FileText style={{ width: 28, height: 28, color: "#a78bfa" }} />}
                            </div>
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center", fontSize: 8, fontWeight: 900, color: "#fff", background: "rgba(124,58,237,0.88)", padding: "2px 0", borderRadius: "0 0 11px 11px", letterSpacing: "0.06em" }}>
                              {a.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* text bubble */}
                    {(msg.content || msg.role === "bot") && (
                      <div style={{ padding: msg.role === "user" ? "10px 15px" : "12px 15px", borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px", background: msg.role === "user" ? "linear-gradient(135deg, #7c3aed, #6d28d9 60%, #4f46e5)" : "rgba(255,255,255,0.045)", border: msg.role === "bot" ? "1px solid rgba(255,255,255,0.075)" : "none", boxShadow: msg.role === "user" ? "0 6px 24px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.12)" : "0 2px 12px rgba(0,0,0,0.2)" }}>
                        {msg.role === "user"
                          ? <span style={{ fontSize: 13, color: "#fff", fontWeight: 500, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{msg.content}</span>
                          : <BotBubble content={msg.content} navigateTo={msg.navigateTo} onNavigate={handleNavigate} saveData={msg.saveData} onSave={saveToVault} />
                        }
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* typing indicator */}
              <AnimatePresence>
                {loading && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))", border: "1px solid rgba(124,58,237,0.2)" }}>
                      <Sparkles style={{ width: 13, height: 13, color: "#a78bfa" }} />
                    </div>
                    <div style={{ padding: "14px 18px", borderRadius: "4px 18px 18px 18px", background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.075)", display: "flex", gap: 5, alignItems: "center" }}>
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} animate={{ y: [0, -6, 0], opacity: [0.35, 1, 0.35] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2, ease: "easeInOut" }}
                          style={{ width: 6, height: 6, borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #818cf8)" }} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* attachment preview strip */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{ padding: "10px 16px 0", borderTop: "1px solid rgba(255,255,255,0.055)", flexShrink: 0, overflow: "hidden" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {attachments.map((a, i) => (
                      <AttachThumb key={i} file={a} onRemove={() => removeAttachment(i)} />
                    ))}
                    {attachments.length < 2 && (
                      <div style={{ fontSize: 10, color: "rgba(148,163,184,0.35)", lineHeight: 1.55 }}>
                        Add back<br />for better<br />results
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* input area */}
            <div style={{ padding: "12px 14px 16px", borderTop: attachments.length > 0 ? "none" : "1px solid rgba(255,255,255,0.055)", background: "rgba(124,58,237,0.02)", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* hidden file input */}
                <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple style={{ display: "none" }} onChange={handleFileSelect} />

                {/* attach button */}
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= 2 || loading}
                  title={attachments.length >= 2 ? "Max 2 files (Front + Back)" : "Attach document"}
                  style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: attachments.length > 0 ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)", border: attachments.length > 0 ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.08)", cursor: attachments.length >= 2 || loading ? "not-allowed" : "pointer", opacity: attachments.length >= 2 ? 0.4 : 1, position: "relative" }}
                >
                  <Paperclip style={{ width: 15, height: 15, color: attachments.length > 0 ? "#a78bfa" : "rgba(100,116,139,0.5)" }} />
                  {attachments.length > 0 && (
                    <div style={{ position: "absolute", top: -5, right: -5, width: 15, height: 15, borderRadius: "50%", background: "#7c3aed", border: "1.5px solid rgba(10,8,30,1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: "#fff" }}>
                      {attachments.length}
                    </div>
                  )}
                </motion.button>

                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  placeholder={attachments.length > 0 ? "Add note (optional)…" : "Ask about your vault…"}
                  disabled={loading}
                  style={{ flex: 1, padding: "11px 16px", borderRadius: 14, fontSize: 13, fontWeight: 500, color: "#fff", fontFamily: "inherit", background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.1)", outline: "none", opacity: loading ? 0.55 : 1 }}
                  onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.5)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.055)"; }}
                />

                <motion.button whileHover={canSend ? { scale: 1.08 } : {}} whileTap={canSend ? { scale: 0.9 } : {}}
                  onClick={() => send(input)} disabled={!canSend}
                  style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: canSend ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.04)", border: canSend ? "1px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.08)", boxShadow: canSend ? "0 4px 20px rgba(124,58,237,0.45)" : "none", cursor: canSend ? "pointer" : "not-allowed", transition: "all 0.18s" }}>
                  <Send style={{ width: 16, height: 16, color: canSend ? "#fff" : "rgba(100,116,139,0.35)" }} />
                </motion.button>
              </div>

              <p style={{ margin: "9px 0 0", textAlign: "center", fontSize: 9.5, color: "rgba(100,116,139,0.4)", fontWeight: 600, letterSpacing: "0.04em" }}>
                Radiant AI · Your data never leaves your device
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
