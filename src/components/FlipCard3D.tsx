import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Copy, Check, RotateCcw } from "lucide-react";
import { formatCardNumber, formatExpiryToMMYY } from "../types";

interface Props {
  cardNumber?: string;
  cardHolder?: string;
  expiry?: string;
  cvv?: string;
  pin?: string;
  cardType?: string;
  issuedBank?: string;
  debitCredit?: string;
}

// ── Network logo renderers ──────────────────────────────────────────────────

function VisaLogo() {
  return (
    <svg viewBox="0 0 80 26" style={{ width: 56, height: 18 }}>
      <text x="0" y="22" fontFamily="Arial" fontWeight="900" fontSize="26" fill="white" fontStyle="italic" letterSpacing="-1">VISA</text>
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg viewBox="0 0 50 32" style={{ width: 44, height: 28 }}>
      <circle cx="16" cy="16" r="16" fill="#EB001B" />
      <circle cx="34" cy="16" r="16" fill="#F79E1B" />
      <path d="M25 4.8a16 16 0 0 1 0 22.4A16 16 0 0 1 25 4.8z" fill="#FF5F00" />
    </svg>
  );
}

function RupayLogo() {
  return (
    <svg viewBox="0 0 80 30" style={{ width: 52, height: 20 }}>
      <text x="0" y="22" fontFamily="Arial" fontWeight="900" fontSize="22" fill="white" letterSpacing="0">RuPay</text>
    </svg>
  );
}

function AmexLogo() {
  return (
    <svg viewBox="0 0 80 30" style={{ width: 52, height: 20 }}>
      <text x="0" y="22" fontFamily="Arial" fontWeight="900" fontSize="18" fill="#00b9e8" letterSpacing="0.5">AMEX</text>
    </svg>
  );
}

function NetworkLogo({ type }: { type?: string }) {
  switch (type) {
    case "Visa": return <VisaLogo />;
    case "Mastercard": return <MastercardLogo />;
    case "Rupay": return <RupayLogo />;
    case "Amex": return <AmexLogo />;
    default: return <span style={{ fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,0.8)", fontStyle: "italic", letterSpacing: "0.05em" }}>{type || "CARD"}</span>;
  }
}

// ── Card themes ─────────────────────────────────────────────────────────────

const themes: Record<string, { front: string; pattern: string; chip: string; strip: string }> = {
  Visa: {
    front: "linear-gradient(135deg,#1a237e 0%,#1565c0 35%,#0d47a1 65%,#1a237e 100%)",
    pattern: "rgba(255,255,255,0.04)",
    chip: "linear-gradient(135deg,#d4af37,#ffd700,#b8860b)",
    strip: "linear-gradient(135deg,#1a237e,#283593)",
  },
  Mastercard: {
    front: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
    pattern: "rgba(235,0,27,0.08)",
    chip: "linear-gradient(135deg,#d4af37,#ffd700,#b8860b)",
    strip: "linear-gradient(135deg,#1a1a2e,#16213e)",
  },
  Amex: {
    front: "linear-gradient(135deg,#004d40 0%,#00695c 50%,#004d40 100%)",
    pattern: "rgba(0,185,232,0.07)",
    chip: "linear-gradient(135deg,#b2dfdb,#80cbc4,#4db6ac)",
    strip: "linear-gradient(135deg,#004d40,#00695c)",
  },
  Rupay: {
    front: "linear-gradient(135deg,#bf360c 0%,#e64a19 45%,#bf360c 100%)",
    pattern: "rgba(255,255,255,0.05)",
    chip: "linear-gradient(135deg,#d4af37,#ffd700,#b8860b)",
    strip: "linear-gradient(135deg,#bf360c,#e64a19)",
  },
  default: {
    front: "linear-gradient(135deg,#1e293b 0%,#334155 50%,#1e293b 100%)",
    pattern: "rgba(255,255,255,0.04)",
    chip: "linear-gradient(135deg,#d4af37,#ffd700,#b8860b)",
    strip: "linear-gradient(135deg,#1e293b,#334155)",
  },
};

// ── EMV Chip ─────────────────────────────────────────────────────────────────

function Chip({ gradient }: { gradient: string }) {
  return (
    <div style={{
      width: 44, height: 34, borderRadius: 6, position: "relative", overflow: "hidden",
      background: gradient,
      boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
      border: "1px solid rgba(255,255,255,0.2)",
    }}>
      {/* Chip contacts grid */}
      <div style={{ position: "absolute", inset: 3, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridTemplateRows: "repeat(2,1fr)", gap: 2 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ borderRadius: 1.5, background: "rgba(0,0,0,0.25)", border: "0.5px solid rgba(255,255,255,0.1)" }} />
        ))}
      </div>
      {/* Center line */}
      <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(0,0,0,0.2)" }} />
    </div>
  );
}

// ── Contactless symbol ────────────────────────────────────────────────────────

function Contactless() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, opacity: 0.7 }}>
      {[8, 13, 18].map((r, i) => (
        <path key={i} d={`M12 ${12 - r/2} Q${12 + r} ${12 - r/2} ${12 + r} 12 Q${12 + r} ${12 + r/2} 12 ${12 + r/2}`}
          fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.4 + i * 0.3} />
      ))}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FlipCard3D({
  cardNumber, cardHolder, expiry, cvv, pin, cardType, issuedBank, debitCredit,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const [cvvVisible, setCvvVisible] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const theme = themes[cardType ?? "default"] ?? themes.default;

  const cp = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const formatted = formatCardNumber(cardNumber ?? "");

  return (
    <div style={{ userSelect: "none" }}>

      {/* ── Perspective wrapper ── */}
      <div style={{ perspective: "1400px", marginBottom: 16, borderRadius: 20, boxShadow: "0 28px 56px rgba(0,0,0,0.7)" }}>
        {/* Plain div — framer-motion matrix transforms break backface-visibility */}
        {/* IMPORTANT: NO filter/opacity/will-change on this div — they create a new stacking
            context and flatten preserve-3d, breaking backface-visibility */}
        <div
          onClick={() => setFlipped(f => !f)}
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.75s cubic-bezier(0.4,0,0.2,1)",
            position: "relative",
            aspectRatio: "1.586",
            cursor: "pointer",
            borderRadius: 20,
          }}
        >

          {/* ── FRONT ────────────────────────────────────────────── */}
          <div style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            borderRadius: 20, overflow: "hidden",
            background: theme.front,
            boxShadow: "0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.18)",
          }}>
            {/* Background pattern */}
            <div style={{
              position: "absolute", inset: 0, opacity: 0.6,
              backgroundImage: `radial-gradient(circle at 70% 30%, rgba(255,255,255,0.12) 0%, transparent 50%), radial-gradient(circle at 20% 80%, ${theme.pattern} 0%, transparent 50%)`,
            }} />
            {/* Holographic shimmer */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)",
            }} />
            {/* Subtle noise overlay */}
            <div style={{
              position: "absolute", inset: 0, opacity: 0.025,
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "128px 128px",
            }} />

            {/* Card content */}
            <div style={{ position: "relative", height: "100%", padding: "6% 7%", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>

              {/* Row 1: Bank name + Network logo */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "clamp(8px,1.1vw,11px)", fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>
                    {issuedBank || "Bank"}
                  </p>
                  {debitCredit && (
                    <p style={{ margin: 0, marginTop: 1, fontSize: "clamp(6px,0.85vw,9px)", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                      {debitCredit}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Contactless />
                  <NetworkLogo type={cardType} />
                </div>
              </div>

              {/* Row 2: Chip */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Chip gradient={theme.chip} />
              </div>

              {/* Row 3: Card number */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{
                  margin: 0,
                  fontFamily: "'OCR A Std', 'Courier New', monospace",
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                  color: "rgba(255,255,255,0.95)",
                  textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}>
                  {formatted || "•••• •••• •••• ••••"}
                </p>
                {cardNumber && (
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={e => { e.stopPropagation(); cp(formatted, "cn"); }}
                    style={{ padding: 5, borderRadius: 7, background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    {copied === "cn"
                      ? <Check style={{ width: 12, height: 12, color: "#34d399" }} />
                      : <Copy style={{ width: 12, height: 12, color: "rgba(255,255,255,0.5)" }} />}
                  </motion.button>
                )}
              </div>

              {/* Row 4: Cardholder + Expiry */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
                {/* Cardholder — flex:1 so it takes remaining space; minWidth:0 enables truncation */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, marginBottom: 3, fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>Cardholder</p>
                  <p style={{ margin: 0, fontFamily: "monospace", fontSize: 13, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.95)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cardHolder || "—"}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, marginBottom: 3, fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>Expires</p>
                  <p style={{ margin: 0, fontFamily: "monospace", fontSize: 15, fontWeight: 900, color: "rgba(255,255,255,0.95)" }}>
                    {formatExpiryToMMYY(expiry) || "MM/YY"}
                  </p>
                </div>
              </div>
            </div>

            {/* Flip hint */}
            <div style={{
              position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
              fontSize: 8, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap",
            }}>
              tap to flip
            </div>
          </div>

          {/* ── BACK ─────────────────────────────────────────────── */}
          <div style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: 20, overflow: "hidden",
            background: theme.front,
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          }}>
            {/* Same shimmer */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.06) 50%,transparent 60%)", pointerEvents: "none" }} />

            {/* Magnetic stripe */}
            <div style={{
              position: "absolute", top: "14%", left: 0, right: 0, height: "18%",
              background: "linear-gradient(180deg,#111 0%,#1a1a1a 50%,#111 100%)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }} />

            {/* Content area */}
            <div style={{ position: "relative", height: "100%", padding: "6% 6%", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>

              {/* Spacer for mag stripe */}
              <div style={{ flex: "0 0 38%" }} />

              {/* Signature strip + CVV */}
              <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
                {/* Signature area */}
                <div style={{
                  flex: 1,
                  background: "repeating-linear-gradient(90deg,#e0d5c5 0px,#e0d5c5 4px,#f5f0e8 4px,#f5f0e8 12px)",
                  borderRadius: "4px 0 0 4px", overflow: "hidden", position: "relative",
                  padding: "6px 10px", boxSizing: "border-box",
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
                }}>
                  <p style={{ margin: 0, fontSize: 7, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(0,0,0,0.4)" }}>Authorized Signature — Not Valid Unless Signed</p>
                  <div style={{ marginTop: 4, height: 14, borderBottom: "1px solid rgba(0,0,0,0.2)" }} />
                </div>

                {/* CVV box */}
                <div style={{
                  flexShrink: 0, width: 64,
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: "0 4px 4px 0",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "6px 8px", gap: 3, boxSizing: "border-box",
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
                }}>
                  <p style={{ margin: 0, fontSize: 6, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(0,0,0,0.45)" }}>CVV</p>
                  <p style={{ margin: 0, fontFamily: "monospace", fontSize: 14, fontWeight: 900, color: "#1a1a2e", letterSpacing: "0.1em" }}>
                    {cvvVisible ? (cvv || "—") : "•••"}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={e => { e.stopPropagation(); setCvvVisible(v => !v); }}
                    style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 4, cursor: "pointer", padding: 3, display: "flex", alignItems: "center" }}
                  >
                    {cvvVisible
                      ? <EyeOff style={{ width: 10, height: 10, color: "rgba(0,0,0,0.45)" }} />
                      : <Eye style={{ width: 10, height: 10, color: "rgba(0,0,0,0.45)" }} />}
                  </motion.button>
                </div>
              </div>

              {/* Info row */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "clamp(7px,0.9vw,9px)", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                    This card is property of {issuedBank || "the issuing bank"}.<br />
                    If found, please return to nearest branch.
                  </p>
                </div>
                <NetworkLogo type={cardType} />
              </div>
            </div>

            {/* Flip back hint */}
            <div style={{
              position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
              fontSize: 8, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.22)", whiteSpace: "nowrap",
            }}>
              tap to flip back
            </div>
          </div>
        </div>
      </div>

      {/* ── Flip toggle button ─────────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={() => setFlipped(f => !f)}
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "9px 14px", borderRadius: 12, marginBottom: 12,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          cursor: "pointer", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: "rgba(148,163,184,0.8)",
          letterSpacing: "0.06em",
        }}
      >
        <RotateCcw style={{ width: 13, height: 13 }} />
        {flipped ? "Show Front" : "Show Back (CVV)"}
      </motion.button>

      {/* ── ATM PIN ───────────────────────────────────────────────── */}
      {pin && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", borderRadius: 12,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
            }}>
              <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, stroke: "#818cf8", fill: "none", strokeWidth: 2 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(100,116,139,0.7)" }}>ATM PIN</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 900, color: "#e2e8f0", letterSpacing: "0.2em" }}>
              {pinVisible ? pin : "••••"}
            </span>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setPinVisible(v => !v)}
              style={{ padding: 5, borderRadius: 7, background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
              {pinVisible ? <EyeOff style={{ width: 12, height: 12, color: "rgba(100,116,139,0.7)" }} /> : <Eye style={{ width: 12, height: 12, color: "rgba(100,116,139,0.7)" }} />}
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => cp(pin, "pin")}
              style={{ padding: 5, borderRadius: 7, background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
              {copied === "pin" ? <Check style={{ width: 12, height: 12, color: "#34d399" }} /> : <Copy style={{ width: 12, height: 12, color: "rgba(100,116,139,0.7)" }} />}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
