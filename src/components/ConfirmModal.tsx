import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, ShieldAlert, X } from "lucide-react";

export interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "warn" | "info";
  onConfirm: () => void;
}

interface Props {
  state: ConfirmState;
  onCancel: () => void;
}

const configs = {
  danger: {
    icon: ShieldAlert,
    accent: "#f43f5e",
    accentRgb: "244,63,94",
    iconBg: "rgba(244,63,94,0.12)",
    iconBorder: "rgba(244,63,94,0.28)",
    iconColor: "#f87171",
    btnGradient: "linear-gradient(135deg, #e11d48, #be123c)",
    btnBorder: "rgba(244,63,94,0.45)",
    topBar: "linear-gradient(90deg, #f43f5e, #e11d48)",
    glow: "rgba(244,63,94,0.18)",
  },
  warn: {
    icon: AlertTriangle,
    accent: "#f59e0b",
    accentRgb: "245,158,11",
    iconBg: "rgba(245,158,11,0.12)",
    iconBorder: "rgba(245,158,11,0.28)",
    iconColor: "#fbbf24",
    btnGradient: "linear-gradient(135deg, #d97706, #b45309)",
    btnBorder: "rgba(245,158,11,0.45)",
    topBar: "linear-gradient(90deg, #f59e0b, #d97706)",
    glow: "rgba(245,158,11,0.18)",
  },
  info: {
    icon: Info,
    accent: "#7c3aed",
    accentRgb: "124,58,237",
    iconBg: "rgba(124,58,237,0.12)",
    iconBorder: "rgba(124,58,237,0.28)",
    iconColor: "#a78bfa",
    btnGradient: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    btnBorder: "rgba(124,58,237,0.45)",
    topBar: "linear-gradient(90deg, #7c3aed, #4f46e5)",
    glow: "rgba(124,58,237,0.18)",
  },
};

export default function ConfirmModal({ state, onCancel }: Props) {
  const variant = state.variant ?? "danger";
  const cfg = configs[variant];
  const Icon = cfg.icon;

  return (
    <AnimatePresence>
      {state.open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,8,0.85)", backdropFilter: "blur(20px)" }}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.84, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.84, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            style={{
              position: "relative", zIndex: 10,
              width: "100%", maxWidth: 440,
              borderRadius: 28, overflow: "hidden",
              background: "rgba(8,8,28,0.99)",
              border: `1px solid rgba(${cfg.accentRgb},0.2)`,
              boxShadow: `0 40px 100px rgba(0,0,0,0.75), 0 0 60px ${cfg.glow}, 0 0 0 1px rgba(255,255,255,0.04)`,
            }}
          >
            {/* Top accent bar */}
            <div style={{ height: 2, background: cfg.topBar }} />

            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
              onClick={onCancel}
              style={{
                position: "absolute", top: 16, right: 16,
                width: 28, height: 28, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer", color: "rgba(100,116,139,0.7)",
              }}
            >
              <X style={{ width: 13, height: 13 }} />
            </motion.button>

            {/* Content */}
            <div style={{ padding: "36px 36px 32px", textAlign: "center" }}>
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.06 }}
                style={{
                  width: 60, height: 60, borderRadius: 18,
                  background: cfg.iconBg,
                  border: `1px solid ${cfg.iconBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                  boxShadow: `0 8px 24px ${cfg.glow}`,
                }}
              >
                <Icon style={{ width: 28, height: 28, color: cfg.iconColor }} />
              </motion.div>

              <h3 style={{ margin: 0, marginBottom: 10, fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>
                {state.title}
              </h3>
              <p style={{ margin: 0, marginBottom: 28, fontSize: 13, color: "rgba(148,163,184,0.7)", lineHeight: 1.65, fontWeight: 500 }}>
                {state.message}
              </p>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={onCancel}
                  style={{
                    flex: 1, padding: "13px 16px", borderRadius: 14, cursor: "pointer",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: 13, fontWeight: 700, color: "rgba(148,163,184,0.85)",
                  }}
                >
                  Cancel
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: `0 8px 28px rgba(${cfg.accentRgb},0.4)` }}
                  whileTap={{ scale: 0.97 }}
                  onClick={state.onConfirm}
                  style={{
                    flex: 1, padding: "13px 16px", borderRadius: 14, cursor: "pointer",
                    background: cfg.btnGradient,
                    border: `1px solid ${cfg.btnBorder}`,
                    boxShadow: `0 4px 20px rgba(${cfg.accentRgb},0.28), inset 0 1px 0 rgba(255,255,255,0.14)`,
                    fontSize: 13, fontWeight: 900, color: "#fff",
                  }}
                >
                  {state.confirmLabel ?? "Confirm"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
