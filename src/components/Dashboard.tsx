import React from "react";
import { motion } from "framer-motion";
import {
  Database, ShieldCheck, Zap, Activity,
  User, Briefcase, CreditCard, Mail, Lock, FileText,
} from "lucide-react";
import { CATEGORIES, CategorySchema } from "../types";
import CategoryCard3D from "./CategoryCard3D";

const IconMap: Record<string, React.ComponentType<any>> = {
  User, Briefcase, CreditCard, Mail, Lock, FileText,
};

interface Props {
  data: Record<string, any[]>;
  isLive: boolean;
  onSelectCategory: (cat: CategorySchema) => void;
  userName: string;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 260, damping: 26, delay },
});

export default function Dashboard({ data, isLive, onSelectCategory, userName }: Props) {
  const total     = CATEGORIES.reduce((s, c) => s + (data[c.sheetName]?.length ?? 0), 0);
  const filled    = CATEGORIES.filter(c => (data[c.sheetName]?.length ?? 0) > 0).length;
  const hour      = new Date().getHours();
  const greet     = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first     = (userName || "there").split(" ")[0];

  const stats = [
    { icon: Database,    val: String(total),          sub: "Total Records",     col: "#a78bfa", rgb: "167,139,250" },
    { icon: Activity,    val: `${filled} / ${CATEGORIES.length}`, sub: "Active Vaults", col: "#34d399", rgb: "52,211,153" },
    { icon: ShieldCheck, val: isLive ? "Live" : "Local", sub: "Sync Status",   col: "#38bdf8", rgb: "56,189,248"  },
    { icon: Zap,         val: "AES-256",               sub: "Encryption",       col: "#fb923c", rgb: "251,146,60"  },
  ];

  return (
    <div style={{ padding: "40px 40px 60px", boxSizing: "border-box" }}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)}
        style={{
          position: "relative",
          borderRadius: 28,
          overflow: "hidden",
          marginBottom: 28,
          background: "linear-gradient(135deg, #0d0726 0%, #0c1648 45%, #060f2a 100%)",
          border: "1px solid rgba(139,92,246,0.25)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 28,
          backgroundImage: "linear-gradient(rgba(139,92,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.07) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }} />
        {/* Orb left */}
        <div style={{ position: "absolute", top: "-80px", left: "-80px", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 65%)", pointerEvents: "none" }} />
        {/* Orb right */}
        <div style={{ position: "absolute", bottom: "-60px", right: "-60px", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 65%)", pointerEvents: "none" }} />
        {/* Scan line */}
        <div style={{ position: "absolute", height: 1, left: 0, right: 0, background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.9),rgba(56,189,248,0.7),transparent)", animation: "scan 5s linear infinite", pointerEvents: "none" }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, padding: "44px 48px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Status line */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: isLive ? "#34d399" : "#fbbf24", boxShadow: `0 0 8px ${isLive ? "#34d399" : "#fbbf24"}` }} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(167,139,250,0.8)" }}>
                {greet} — {isLive ? "Vault Live & Synced" : "Offline Mode"}
              </span>
            </div>

            {/* Name */}
            <h1 style={{ margin: 0, marginBottom: 16, fontWeight: 900, lineHeight: 1, letterSpacing: "-2px", fontSize: "clamp(44px,5vw,72px)", color: "#fff", textShadow: "0 0 60px rgba(139,92,246,0.4)" }}>
              {first}
              <span style={{ display: "inline-block", marginLeft: 16, background: "linear-gradient(90deg,#a78bfa 0%,#67e8f9 50%,#a78bfa 100%)", backgroundSize: "200% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 3s linear infinite" }}>👋</span>
            </h1>

            {/* Description */}
            <p style={{ margin: 0, marginBottom: 24, fontSize: 15, color: "rgba(203,213,225,0.6)", lineHeight: 1.6, maxWidth: 460 }}>
              {total} records secured across {filled} vault{filled !== 1 ? "s" : ""}. Encrypted end-to-end and synced with Firestore.
            </p>

            {/* Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { t: "Google OAuth 2.0", c: "#a78bfa", r: "167,139,250" },
                { t: "Firestore Sync",   c: "#67e8f9", r: "103,232,249" },
                { t: "AES-256",          c: "#6ee7b7", r: "110,231,183" },
              ].map(b => (
                <span key={b.t} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 999, fontSize: 10, fontWeight: 800,
                  background: `rgba(${b.r},0.09)`, border: `1px solid rgba(${b.r},0.25)`, color: b.c,
                  letterSpacing: "0.06em",
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: b.c, display: "inline-block" }} />
                  {b.t}
                </span>
              ))}
            </div>
          </div>

          {/* Shield */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              style={{ position: "relative" }}
            >
              <div style={{
                width: 112, height: 112, borderRadius: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0891b2 100%)",
                boxShadow: "0 20px 60px rgba(124,58,237,0.55), 0 0 80px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}>
                <ShieldCheck style={{ width: 56, height: 56, color: "#fff", strokeWidth: 1.5 }} />
              </div>
              {[0, 1].map(i => (
                <motion.div key={i}
                  animate={{ scale: [1, 1.6, 1.6], opacity: [0.5, 0, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, delay: i * 1, ease: "easeOut" }}
                  style={{ position: "absolute", inset: 0, borderRadius: 28, border: "2px solid rgba(124,58,237,0.7)" }}
                />
              ))}
            </motion.div>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(167,139,250,0.6)" }}>Secured</span>
          </div>
        </div>
      </motion.div>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }}>
        {stats.map((s, i) => (
          <motion.div key={s.sub} {...fadeUp(0.05 + i * 0.06)}
            style={{
              borderRadius: 20,
              padding: "20px 22px",
              background: `radial-gradient(ellipse at top left, rgba(${s.rgb},0.18) 0%, rgba(${s.rgb},0.04) 100%), rgba(8,8,24,0.7)`,
              border: `1px solid rgba(${s.rgb},0.2)`,
              boxShadow: `0 4px 24px rgba(${s.rgb},0.08), inset 0 1px 0 rgba(255,255,255,0.05)`,
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `rgba(${s.rgb},0.18)`, filter: "blur(20px)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${s.rgb},0.16)`, border: `1px solid rgba(${s.rgb},0.28)` }}>
                  <s.icon style={{ width: 16, height: 16, color: s.col }} />
                </div>
              </div>
              <p style={{ margin: 0, marginBottom: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.val}</p>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(148,163,184,0.6)", letterSpacing: "0.03em" }}>{s.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── VAULT CATEGORIES ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <motion.div {...fadeUp(0.28)} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(100,116,139,0.6)", marginBottom: 4 }}>Personal Archive</p>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff" }}>Vault Categories</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 900, color: "#fff" }}>{CATEGORIES.length}</span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(100,116,139,0.6)" }}>vaults</span>
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {CATEGORIES.map((cat, i) => (
            <CategoryCard3D
              key={cat.id}
              category={cat}
              recordCount={data[cat.sheetName]?.length ?? 0}
              IconComponent={IconMap[cat.icon] || Database}
              onClick={() => onSelectCategory(cat)}
              index={i}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
