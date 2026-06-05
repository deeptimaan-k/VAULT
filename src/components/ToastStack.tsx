import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface Toast {
  id: number;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
}

interface Props {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

const cfg = {
  success: {
    icon: CheckCircle2,
    accent: "#34d399",
    accentRgb: "52,211,153",
    iconBg: "rgba(52,211,153,0.15)",
    border: "rgba(52,211,153,0.35)",
    glow: "rgba(52,211,153,0.18)",
  },
  error: {
    icon: AlertCircle,
    accent: "#f87171",
    accentRgb: "248,113,113",
    iconBg: "rgba(248,113,113,0.15)",
    border: "rgba(248,113,113,0.35)",
    glow: "rgba(248,113,113,0.18)",
  },
  info: {
    icon: Info,
    accent: "#a78bfa",
    accentRgb: "167,139,250",
    iconBg: "rgba(167,139,250,0.15)",
    border: "rgba(167,139,250,0.35)",
    glow: "rgba(167,139,250,0.18)",
  },
};

const AUTO_DISMISS_MS = 4000;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const c = cfg[toast.type];
  const Icon = c.icon;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.88, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        background: "rgba(8,8,28,0.92)",
        backdropFilter: "blur(24px) saturate(160%)",
        border: `1px solid ${c.border}`,
        boxShadow: `0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04), 0 0 28px ${c.glow}`,
        display: "flex",
        alignItems: "stretch",
        minWidth: 300,
        maxWidth: 360,
        cursor: "default",
      }}
    >
      {/* Left accent bar */}
      <div style={{
        width: 3, flexShrink: 0,
        background: `linear-gradient(180deg, ${c.accent}, ${c.accent}88)`,
        borderRadius: "16px 0 0 16px",
      }} />

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "13px 14px" }}>
        {/* Icon */}
        <div style={{
          width: 36, height: 36, flexShrink: 0, borderRadius: 10,
          background: c.iconBg,
          border: `1px solid rgba(${c.accentRgb},0.3)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon style={{ width: 17, height: 17, color: c.accent }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>{toast.title}</p>
          {toast.message && (
            <p style={{ margin: 0, marginTop: 3, fontSize: 11, color: "rgba(148,163,184,0.75)", fontWeight: 500, lineHeight: 1.4 }}>
              {toast.message}
            </p>
          )}
        </div>

        {/* Dismiss */}
        <motion.button
          whileHover={{ scale: 1.15, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDismiss(toast.id)}
          style={{
            flexShrink: 0, width: 24, height: 24, borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            cursor: "pointer", color: "rgba(148,163,184,0.6)",
          }}
        >
          <X style={{ width: 11, height: 11 }} />
        </motion.button>
      </div>

      {/* Auto-dismiss progress bar */}
      <motion.div
        style={{
          position: "absolute", bottom: 0, left: 3, right: 0, height: 2,
          background: `linear-gradient(90deg, ${c.accent}, ${c.accent}55)`,
          transformOrigin: "left",
        }}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: AUTO_DISMISS_MS / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}

export default function ToastStack({ toasts, onDismiss }: Props) {
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 300,
      display: "flex", flexDirection: "column", gap: 10,
      pointerEvents: "none",
    }}>
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem toast={t} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
