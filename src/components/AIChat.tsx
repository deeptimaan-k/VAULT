import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, User, RotateCcw, ArrowRight, Zap } from "lucide-react";
import { auth } from "../lib/firebase";
import { CATEGORIES } from "../types";

interface Message {
  id: number;
  role: "user" | "bot";
  content: string;
  navigateTo?: string;
}

interface Props {
  data: Record<string, any[]>;
  onNavigate: (categoryId: string) => void;
}

const QUICK_PROMPTS = [
  "What's in my vault?",
  "Show my bank accounts",
  "Any expiring cards?",
  "List my passwords",
];

const CAT_LABELS: Record<string, string> = {
  personal:  "Personal Info",
  financial: "Bank & Finance",
  card:      "Cards",
  media:     "Media & Gmail",
  others:    "Others",
  documents: "Documents",
};

let _id = 0;
const uid = () => ++_id;

// ── Inline markdown: **bold** ──────────────────────────────────────────────
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

// ── Bot bubble ─────────────────────────────────────────────────────────────
function BotBubble({ content, navigateTo, onNavigate }: {
  content: string; navigateTo?: string; onNavigate: (id: string) => void;
}) {
  const lines = content.split("\n");
  const catLabel = navigateTo ? CAT_LABELS[navigateTo] : null;

  return (
    <div style={{ fontSize: 13, color: "rgba(203,213,225,0.9)", fontWeight: 500, lineHeight: 1.75 }}>
      {lines.map((line, i) => {
        const trimmed = line.trimStart();
        const indent  = line.length - trimmed.length;

        if (/^[•\-\*]\s/.test(trimmed)) {
          const text   = trimmed.replace(/^[•\-\*]\s+/, "");
          const nested = indent >= 2;
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
        <motion.button
          whileHover={{ scale: 1.04, x: 2, boxShadow: "0 6px 24px rgba(124,58,237,0.45)" }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onNavigate(navigateTo)}
          style={{
            marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7,
            padding: "8px 15px 8px 12px", borderRadius: 12, cursor: "pointer",
            background: "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(79,70,229,0.14))",
            border: "1px solid rgba(124,58,237,0.38)",
            boxShadow: "0 2px 12px rgba(124,58,237,0.18)",
            fontSize: 11, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.02em",
          }}
        >
          <ArrowRight style={{ width: 12, height: 12 }} />
          Go to {catLabel}
        </motion.button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AIChat({ data, onNavigate }: Props) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);
  const dataRef                 = useRef(data);
  dataRef.current               = data;

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 280); }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const history = () => messages.slice(-12).map(m => ({ role: m.role, content: m.content }));

  const send = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { id: uid(), role: "user", content: msg }]);
    setLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res   = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ message: msg, vaultData: dataRef.current, history: history() }),
      });
      const json = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);

      const raw: string = json.reply ?? "";
      const navMatch    = raw.match(/\[NAVIGATE:(\w+)\]/);
      const navigateTo  = navMatch ? navMatch[1] : undefined;
      const content     = raw.replace(/\[NAVIGATE:\w+\]/g, "").trim();

      setMessages(prev => [...prev, { id: uid(), role: "bot", content, navigateTo }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { id: uid(), role: "bot", content: `⚠️ ${err?.message ?? "Connection error"}` }]);
    } finally {
      setLoading(false);
    }
  }, [loading]); // eslint-disable-line

  const handleNavigate = (catId: string) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    if (cat) { onNavigate(catId); setOpen(false); }
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* ── Floating button ──────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(v => !v)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 150,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%)",
          border: "2px solid rgba(167,139,250,0.4)",
          boxShadow: "0 8px 32px rgba(124,58,237,0.55), 0 0 0 0 rgba(124,58,237,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}
      >
        {!open && (
          <>
            <motion.span
              animate={{ scale: [1, 1.8], opacity: [0.45, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
              style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.5)" }}
            />
            <motion.span
              animate={{ scale: [1, 2.4], opacity: [0.2, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, delay: 0.4, ease: "easeOut" }}
              style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.3)" }}
            />
          </>
        )}
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X style={{ width: 22, height: 22, color: "#fff" }} />
              </motion.div>
            : <motion.div key="s" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Sparkles style={{ width: 22, height: 22, color: "#fff" }} />
              </motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* ── Chat panel ───────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 440, damping: 36 }}
            style={{
              position: "fixed", bottom: 98, right: 24, zIndex: 149,
              width: "min(400px, calc(100vw - 48px))",
              height: "min(560px, calc(100vh - 140px))",
              borderRadius: 24,
              background: "linear-gradient(160deg, rgba(10,8,30,0.99) 0%, rgba(7,6,22,0.99) 100%)",
              backdropFilter: "blur(48px) saturate(180%)",
              border: "1px solid rgba(124,58,237,0.22)",
              boxShadow: "0 32px 96px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.035), 0 0 80px rgba(124,58,237,0.08)",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            {/* gradient top bar */}
            <div style={{ height: 2.5, flexShrink: 0, background: "linear-gradient(90deg, #7c3aed, #818cf8, #a78bfa, #818cf8, #7c3aed)", backgroundSize: "200% 100%" }} />

            {/* ── Header ── */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "13px 16px 13px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.055)", flexShrink: 0,
              background: "rgba(124,58,237,0.04)",
            }}>
              {/* logo */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 14,
                  background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.55)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Sparkles style={{ width: 18, height: 18, color: "#fff" }} />
                </div>
                {/* tiny online dot on logo */}
                <div style={{
                  position: "absolute", bottom: -1, right: -1,
                  width: 11, height: 11, borderRadius: "50%",
                  background: "#34d399", border: "2px solid rgba(10,8,30,1)",
                  boxShadow: "0 0 6px #34d399",
                }} />
              </div>

              {/* name + tagline */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "-0.2px", lineHeight: 1 }}>
                    Radiant AI
                  </p>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "2px 7px", borderRadius: 99,
                    background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
                  }}>
                    <Zap style={{ width: 8, height: 8, color: "#a78bfa" }} />
                    <span style={{ fontSize: 8.5, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.06em" }}>BETA</span>
                  </div>
                </div>
                <p style={{ margin: 0, marginTop: 3, fontSize: 10, color: "rgba(148,163,184,0.45)", fontWeight: 600 }}>
                  Powered by Gemini · Private & secure
                </p>
              </div>

              {/* actions */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                {messages.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.12, rotate: -20 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setMessages([])} title="Clear chat"
                    style={{
                      width: 30, height: 30, borderRadius: 9,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      cursor: "pointer", color: "rgba(148,163,184,0.5)",
                    }}
                  >
                    <RotateCcw style={{ width: 12, height: 12 }} />
                  </motion.button>
                )}
              </div>
            </div>

            {/* ── Messages ── */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "18px 16px 10px",
              display: "flex", flexDirection: "column", gap: 16,
              scrollbarWidth: "none",
            }}>

              {/* empty state */}
              {isEmpty && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ textAlign: "center", padding: "12px 8px" }}
                >
                  <motion.div
                    animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    style={{
                      width: 64, height: 64, borderRadius: 22, margin: "0 auto 18px",
                      background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(79,70,229,0.08))",
                      border: "1px solid rgba(124,58,237,0.22)",
                      boxShadow: "0 12px 40px rgba(124,58,237,0.14), 0 0 0 8px rgba(124,58,237,0.04)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Sparkles style={{ width: 26, height: 26, color: "#a78bfa" }} />
                  </motion.div>

                  <p style={{ margin: 0, marginBottom: 5, fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "-0.2px" }}>
                    Hi! I'm Radiant AI
                  </p>
                  <p style={{ margin: 0, marginBottom: 22, fontSize: 12, color: "rgba(148,163,184,0.45)", lineHeight: 1.65 }}>
                    Ask me anything about your vault.<br />I know all your records.
                  </p>

                  {/* quick prompts */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    {QUICK_PROMPTS.map((q, i) => (
                      <motion.button
                        key={q}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 + i * 0.06 }}
                        whileHover={{ scale: 1.05, borderColor: "rgba(124,58,237,0.5)", background: "rgba(124,58,237,0.14)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => send(q)}
                        style={{
                          padding: "7px 14px", borderRadius: 99,
                          fontSize: 11, fontWeight: 700, cursor: "pointer",
                          color: "#c4b5fd", background: "rgba(124,58,237,0.07)",
                          border: "1px solid rgba(124,58,237,0.2)",
                          transition: "background 0.15s, border-color 0.15s",
                        }}
                      >
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* message bubbles */}
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 440, damping: 32 }}
                  style={{
                    display: "flex", gap: 9, alignItems: "flex-start",
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  }}
                >
                  {/* avatar */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 10, flexShrink: 0, marginTop: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                      : "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))",
                    border: msg.role === "bot" ? "1px solid rgba(124,58,237,0.2)" : "none",
                    boxShadow: msg.role === "user" ? "0 3px 12px rgba(124,58,237,0.38)" : "0 2px 8px rgba(124,58,237,0.08)",
                  }}>
                    {msg.role === "user"
                      ? <User style={{ width: 13, height: 13, color: "#fff" }} />
                      : <Sparkles style={{ width: 13, height: 13, color: "#a78bfa" }} />
                    }
                  </div>

                  {/* bubble */}
                  <div style={{
                    maxWidth: "83%",
                    padding: msg.role === "user" ? "10px 15px" : "12px 15px",
                    borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 60%, #4f46e5 100%)"
                      : "rgba(255,255,255,0.045)",
                    border: msg.role === "bot" ? "1px solid rgba(255,255,255,0.075)" : "none",
                    boxShadow: msg.role === "user"
                      ? "0 6px 24px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.12)"
                      : "0 2px 12px rgba(0,0,0,0.2)",
                  }}>
                    {msg.role === "user"
                      ? <span style={{ fontSize: 13, color: "#fff", fontWeight: 500, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{msg.content}</span>
                      : <BotBubble content={msg.content} navigateTo={msg.navigateTo} onNavigate={handleNavigate} />
                    }
                  </div>
                </motion.div>
              ))}

              {/* typing indicator */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    style={{ display: "flex", gap: 9, alignItems: "flex-start" }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 10, flexShrink: 0, marginTop: 1,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }}>
                      <Sparkles style={{ width: 13, height: 13, color: "#a78bfa" }} />
                    </div>
                    <div style={{
                      padding: "14px 18px", borderRadius: "4px 18px 18px 18px",
                      background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.075)",
                      display: "flex", gap: 5, alignItems: "center",
                    }}>
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -6, 0], opacity: [0.35, 1, 0.35] }}
                          transition={{ repeat: Infinity, duration: 1, delay: i * 0.2, ease: "easeInOut" }}
                          style={{ width: 6, height: 6, borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #818cf8)" }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>

            {/* ── Input ── */}
            <div style={{
              padding: "12px 14px 16px",
              borderTop: "1px solid rgba(255,255,255,0.055)",
              background: "rgba(124,58,237,0.02)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  placeholder="Ask about your vault…"
                  disabled={loading}
                  style={{
                    flex: 1, padding: "11px 16px", borderRadius: 14,
                    fontSize: 13, fontWeight: 500, color: "#fff", fontFamily: "inherit",
                    background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.1)",
                    outline: "none", opacity: loading ? 0.55 : 1,
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.5)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.055)"; }}
                />
                <motion.button
                  whileHover={input.trim() && !loading ? { scale: 1.08 } : {}}
                  whileTap={input.trim() && !loading ? { scale: 0.9 } : {}}
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: input.trim() && !loading
                      ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                      : "rgba(255,255,255,0.04)",
                    border: input.trim() && !loading
                      ? "1px solid rgba(124,58,237,0.5)"
                      : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: input.trim() && !loading ? "0 4px 20px rgba(124,58,237,0.45)" : "none",
                    cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                    transition: "all 0.18s",
                  }}
                >
                  <Send style={{ width: 16, height: 16, color: input.trim() && !loading ? "#fff" : "rgba(100,116,139,0.35)" }} />
                </motion.button>
              </div>

              {/* branding footer */}
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
