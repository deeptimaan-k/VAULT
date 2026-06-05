import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShieldCheck, LogOut,
  User, Briefcase, CreditCard, Mail, Lock, FileText,
  Database, Activity, Zap, Award,
} from "lucide-react";
import { CATEGORIES } from "../types";

const IconMap: Record<string, React.ComponentType<any>> = {
  User, Briefcase, CreditCard, Mail, Lock, FileText,
};
const catColors: Record<string, string> = {
  personal: "#818cf8", financial: "#34d399", card: "#22d3ee",
  media: "#fbbf24", others: "#fb7185", documents: "#c084fc",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
  data: Record<string, any[]>;
  user: { displayName?: string | null; email?: string | null; photoURL?: string | null };
}

export default function ProfilePanel({ open, onClose, onSignOut, data, user }: Props) {
  const totalRecords = CATEGORIES.reduce((s, c) => s + (data[c.sheetName]?.length ?? 0), 0);
  const initials = (user.displayName ?? user.email ?? "M").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const stats = [
    { label: "Total Records", value: String(totalRecords), icon: Database, color: "#a78bfa", rgb: "167,139,250" },
    { label: "Categories",    value: String(CATEGORIES.length), icon: Activity, color: "#22d3ee", rgb: "34,211,238" },
    { label: "Vault Health",  value: "100%", icon: Zap,         color: "#34d399", rgb: "52,211,153" },
    { label: "Encryption",    value: "AES-256", icon: Award,    color: "#fb923c", rgb: "251,146,60" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,8,0.72)", backdropFilter: "blur(14px)" }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            style={{
              position: "relative", height: "100%", width: 480,
              display: "flex", flexDirection: "column",
              background: "rgba(5,5,22,0.99)",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "-32px 0 80px rgba(0,0,0,0.7), 0 0 60px rgba(124,58,237,0.06)",
              overflowY: "auto", overflowX: "hidden",
            }}
          >
            {/* Top accent */}
            <div style={{ height: 2, flexShrink: 0, background: "linear-gradient(90deg,#7c3aed,#4f46e5,#06b6d4)" }} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff" }}>My Profile</h2>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                style={{ padding: 8, borderRadius: 10, color: "rgba(100,116,139,0.7)", cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center" }}>
                <X style={{ width: 18, height: 18 }} />
              </motion.button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, padding: "24px 24px", display: "flex", flexDirection: "column", gap: 20, boxSizing: "border-box" }}>

              {/* ── Avatar card ───────────────────────────────────── */}
              <div style={{
                position: "relative", borderRadius: 24, overflow: "hidden", padding: "32px 24px 24px",
                background: "linear-gradient(135deg,rgba(124,58,237,0.18) 0%,rgba(79,70,229,0.12) 50%,rgba(6,182,212,0.08) 100%)",
                border: "1px solid rgba(124,58,237,0.22)",
                textAlign: "center",
              }}>
                {/* Background orbs */}
                <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.25) 0%,transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -40, left: -40, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle,rgba(6,182,212,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />

                {/* Grid pattern */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(139,92,246,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.05) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

                <div style={{ position: "relative" }}>
                  {/* Avatar */}
                  <div style={{ position: "relative", display: "inline-block", marginBottom: 16 }}>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" referrerPolicy="no-referrer"
                        style={{ width: 88, height: 88, borderRadius: 22, objectFit: "cover", border: "2px solid rgba(124,58,237,0.4)", boxShadow: "0 8px 32px rgba(124,58,237,0.35)" }} />
                    ) : (
                      <div style={{ width: 88, height: 88, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#fff", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 8px 32px rgba(124,58,237,0.35)" }}>
                        {initials}
                      </div>
                    )}
                    {/* Online dot */}
                    <div style={{ position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: 7, background: "#030314", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
                    </div>
                  </div>

                  <h3 style={{ margin: 0, marginBottom: 6, fontSize: 20, fontWeight: 900, color: "#fff" }}>{user.displayName ?? "Vault Owner"}</h3>
                  <p style={{ margin: 0, marginBottom: 12, fontSize: 12, color: "rgba(148,163,184,0.65)", fontFamily: "monospace" }}>{user.email}</p>

                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 999, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)" }}>
                    <ShieldCheck style={{ width: 12, height: 12, color: "#a78bfa" }} />
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a78bfa" }}>Verified — Google Auth</span>
                  </div>
                </div>
              </div>

              {/* ── Stats grid ────────────────────────────────────── */}
              <div>
                <p style={{ margin: 0, marginBottom: 12, fontSize: 9, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(100,116,139,0.5)" }}>Vault Statistics</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {stats.map(s => (
                    <div key={s.label} style={{
                      padding: "14px 16px", borderRadius: 16,
                      background: `rgba(${s.rgb},0.08)`,
                      border: `1px solid rgba(${s.rgb},0.2)`,
                      position: "relative", overflow: "hidden",
                    }}>
                      <div style={{ position: "absolute", top: -16, right: -16, width: 64, height: 64, borderRadius: "50%", background: `rgba(${s.rgb},0.2)`, filter: "blur(16px)", pointerEvents: "none" }} />
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: s.color }}>{s.label}</span>
                        <s.icon style={{ width: 13, height: 13, color: s.color }} />
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Category breakdown ────────────────────────────── */}
              <div>
                <p style={{ margin: 0, marginBottom: 12, fontSize: 9, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(100,116,139,0.5)" }}>Category Breakdown</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {CATEGORIES.map((cat, i) => {
                    const count = data[cat.sheetName]?.length ?? 0;
                    const Icon = IconMap[cat.icon] || Database;
                    const color = catColors[cat.id] ?? "#7c3aed";
                    const pct = totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0;
                    return (
                      <div key={cat.id} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 14px", borderRadius: 14,
                        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)",
                        boxSizing: "border-box",
                      }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}18`, border: `1px solid ${color}30` }}>
                          <Icon style={{ width: 15, height: 15, color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.title}</span>
                            <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 900, color, flexShrink: 0, marginLeft: 8 }}>{count}</span>
                          </div>
                          <div style={{ height: 3, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, delay: i * 0.06, ease: "easeOut" }}
                              style={{ height: "100%", borderRadius: 999, background: `linear-gradient(90deg,${color}60,${color})` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Security status ───────────────────────────────── */}
              <div style={{ padding: "16px 18px", borderRadius: 18, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <ShieldCheck style={{ width: 15, height: 15, color: "#34d399" }} />
                  <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "#34d399" }}>Security Status</span>
                </div>
                {[
                  "Google OAuth 2.0 Authentication",
                  "Firestore security rules active",
                  "Per-user data isolation",
                  "HTTPS encrypted transport",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px #34d399", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "rgba(203,213,225,0.7)", fontWeight: 600 }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Bottom spacer */}
              <div style={{ height: 8 }} />
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px 28px", flexShrink: 0 }}>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(244,63,94,0.35)" }}
                whileTap={{ scale: 0.97 }}
                onClick={onSignOut}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 10, padding: "14px", borderRadius: 16, cursor: "pointer",
                  background: "linear-gradient(135deg,#e11d48,#be123c)",
                  boxShadow: "0 4px 20px rgba(244,63,94,0.22)",
                  fontSize: 13, fontWeight: 900, color: "#fff", border: "none",
                  boxSizing: "border-box",
                }}
              >
                <LogOut style={{ width: 15, height: 15 }} />
                Sign Out of Vault
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
