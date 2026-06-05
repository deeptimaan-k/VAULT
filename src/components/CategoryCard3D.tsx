import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { CategorySchema } from "../types";

const palette: Record<string, {
  mesh: string; glow: string; glowRgb: string; accent: string;
  accentSoft: string; badgeBg: string; badgeTxt: string;
  borderIdle: string; borderHover: string;
}> = {
  personal: {
    mesh: "radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.38) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(124,58,237,0.28) 0%, transparent 55%), linear-gradient(145deg,#0f0b2a,#1a1042)",
    glow: "rgba(99,102,241,0.6)", glowRgb: "99,102,241", accent: "#818cf8", accentSoft: "rgba(99,102,241,0.18)",
    badgeBg: "rgba(99,102,241,0.13)", badgeTxt: "#a5b4fc",
    borderIdle: "rgba(99,102,241,0.18)", borderHover: "rgba(129,140,248,0.6)",
  },
  financial: {
    mesh: "radial-gradient(ellipse at 20% 20%, rgba(16,185,129,0.38) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(5,150,105,0.28) 0%, transparent 55%), linear-gradient(145deg,#071a10,#0a2818)",
    glow: "rgba(16,185,129,0.6)", glowRgb: "16,185,129", accent: "#34d399", accentSoft: "rgba(16,185,129,0.18)",
    badgeBg: "rgba(16,185,129,0.13)", badgeTxt: "#6ee7b7",
    borderIdle: "rgba(16,185,129,0.18)", borderHover: "rgba(52,211,153,0.6)",
  },
  card: {
    mesh: "radial-gradient(ellipse at 20% 20%, rgba(6,182,212,0.38) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(14,116,144,0.28) 0%, transparent 55%), linear-gradient(145deg,#071520,#091e30)",
    glow: "rgba(6,182,212,0.6)", glowRgb: "6,182,212", accent: "#22d3ee", accentSoft: "rgba(6,182,212,0.18)",
    badgeBg: "rgba(6,182,212,0.13)", badgeTxt: "#67e8f9",
    borderIdle: "rgba(6,182,212,0.18)", borderHover: "rgba(34,211,238,0.6)",
  },
  media: {
    mesh: "radial-gradient(ellipse at 20% 20%, rgba(245,158,11,0.38) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(180,83,9,0.28) 0%, transparent 55%), linear-gradient(145deg,#1c1003,#201508)",
    glow: "rgba(245,158,11,0.6)", glowRgb: "245,158,11", accent: "#fbbf24", accentSoft: "rgba(245,158,11,0.18)",
    badgeBg: "rgba(245,158,11,0.13)", badgeTxt: "#fcd34d",
    borderIdle: "rgba(245,158,11,0.18)", borderHover: "rgba(251,191,36,0.6)",
  },
  others: {
    mesh: "radial-gradient(ellipse at 20% 20%, rgba(244,63,94,0.38) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(190,18,60,0.28) 0%, transparent 55%), linear-gradient(145deg,#1c0511,#200818)",
    glow: "rgba(244,63,94,0.6)", glowRgb: "244,63,94", accent: "#fb7185", accentSoft: "rgba(244,63,94,0.18)",
    badgeBg: "rgba(244,63,94,0.13)", badgeTxt: "#fda4af",
    borderIdle: "rgba(244,63,94,0.18)", borderHover: "rgba(251,113,133,0.6)",
  },
  documents: {
    mesh: "radial-gradient(ellipse at 20% 20%, rgba(168,85,247,0.38) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(126,34,206,0.28) 0%, transparent 55%), linear-gradient(145deg,#150830,#1a0838)",
    glow: "rgba(168,85,247,0.6)", glowRgb: "168,85,247", accent: "#c084fc", accentSoft: "rgba(168,85,247,0.18)",
    badgeBg: "rgba(168,85,247,0.13)", badgeTxt: "#d8b4fe",
    borderIdle: "rgba(168,85,247,0.18)", borderHover: "rgba(192,132,252,0.6)",
  },
};

const springCfg = { stiffness: 240, damping: 26, mass: 0.5 };

interface Props {
  category: CategorySchema;
  recordCount: number;
  IconComponent: React.ComponentType<any>;
  onClick: () => void;
  index: number;
}

export default function CategoryCard3D({ category, recordCount, IconComponent, onClick, index }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const p = palette[category.id] ?? palette.others;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), springCfg);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), springCfg);
  const glowX   = useSpring(useTransform(mouseX, [-0.5, 0.5], [20, 80]), springCfg);
  const glowY   = useSpring(useTransform(mouseY, [-0.5, 0.5], [20, 80]), springCfg);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width - 0.5);
    mouseY.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handleLeave = () => { mouseX.set(0); mouseY.set(0); setHovered(false); };

  return (
    <motion.div
      style={{ perspective: 1000 }}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24, delay: index * 0.07 }}
      onClick={onClick}
      className="cursor-pointer select-none"
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleLeave}
        whileTap={{ scale: 0.97 }}
        animate={{
          scale: hovered ? 1.025 : 1,
          border: `1px solid ${hovered ? p.borderHover : p.borderIdle}`,
          boxShadow: hovered
            ? `0 32px 64px rgba(0,0,0,0.65), 0 0 60px ${p.glow}, 0 0 20px ${p.glow}`
            : `0 6px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        style={{
          rotateX, rotateY,
          transformStyle: "preserve-3d",
          background: p.mesh,
          borderRadius: 20,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Cursor glow */}
        <motion.div
          style={{
            position: "absolute", width: 200, height: 200, borderRadius: "50%",
            background: `radial-gradient(circle, ${p.glow} 0%, transparent 70%)`,
            left: glowX.get() + "%", top: glowY.get() + "%",
            transform: "translate(-50%,-50%)",
            opacity: hovered ? 0.5 : 0,
            pointerEvents: "none",
            filter: "blur(16px)",
            transition: "opacity 0.3s",
          }}
        />

        {/* Glass sheen */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%)",
          opacity: hovered ? 1 : 0.5, transition: "opacity 0.3s",
        }} />

        {/* Top accent bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${p.accent}, transparent)`,
          opacity: hovered ? 1 : 0.35, transition: "opacity 0.3s",
        }} />

        {/* ── Card content ─────────────────────────── */}
        <div style={{ padding: "20px 22px 18px", position: "relative", zIndex: 1 }}>

          {/* Row 1: icon + count badge */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>

            {/* Icon */}
            <motion.div
              animate={{ scale: hovered ? 1.08 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              style={{
                width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: p.accentSoft,
                border: `1px solid rgba(${p.glowRgb},0.3)`,
                boxShadow: hovered ? `0 0 24px ${p.glow}` : "none",
                transition: "box-shadow 0.3s",
              }}
            >
              <IconComponent style={{ width: 22, height: 22, color: p.accent, filter: `drop-shadow(0 0 8px ${p.accent})` }} />
            </motion.div>

            {/* Count badge */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "flex-end",
              padding: "6px 10px", borderRadius: 12,
              background: p.badgeBg, border: `1px solid rgba(${p.glowRgb},0.2)`,
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 900, lineHeight: 1, color: p.badgeTxt }}>{recordCount}</span>
              <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: p.accent, opacity: 0.65, marginTop: 2 }}>records</span>
            </div>
          </div>

          {/* Row 2: title */}
          <motion.h3
            animate={{ x: hovered ? 3 : 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{
              margin: 0, marginBottom: 7,
              fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.2,
              textShadow: hovered ? `0 0 24px rgba(${p.glowRgb},0.6)` : "none",
              transition: "text-shadow 0.3s",
            }}
          >
            {category.title}
          </motion.h3>

          {/* Row 3: description */}
          <p style={{
            margin: 0, marginBottom: 16,
            fontSize: 11, lineHeight: 1.55,
            color: "rgba(203,213,225,0.5)",
          }}>
            {category.description}
          </p>

          {/* Row 4: footer */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingTop: 12, borderTop: `1px solid rgba(${p.glowRgb},0.12)`,
          }}>
            <code style={{ fontSize: 9, letterSpacing: "0.12em", color: `rgba(${p.glowRgb},0.38)` }}>
              {category.sheetName}
            </code>
            <motion.span
              animate={{ x: hovered ? 5 : 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 900, color: p.accent }}
            >
              Open <ChevronRight style={{ width: 13, height: 13 }} />
            </motion.span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
