import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, Eye, EyeOff, Edit2, Trash2, X,
  FileText, Calendar,
  Download, Share2,
} from "lucide-react";
import { CategorySchema } from "../types";
import FlipCard3D from "./FlipCard3D";

interface RecordItemCardProps {
  key?: any;
  category: CategorySchema;
  record: Record<string, any>;
  onEdit: (record: Record<string, any>) => void;
  onDelete: (rowNum: number) => any;
}

// ── Design tokens per category ──────────────────────────────────────────────

const tokens: Record<string, {
  mesh: string; accent: string; accentRgb: string;
  headerBg: string; badgeBg: string; badgeTxt: string;
}> = {
  personal: {
    mesh: "linear-gradient(135deg,#1e1654 0%,#2d1f8c 50%,#1a1042 100%)",
    accent: "#818cf8", accentRgb: "99,102,241",
    headerBg: "rgba(99,102,241,0.12)", badgeBg: "rgba(99,102,241,0.15)", badgeTxt: "#a5b4fc",
  },
  financial: {
    mesh: "linear-gradient(135deg,#071a10 0%,#0d3320 50%,#071a10 100%)",
    accent: "#34d399", accentRgb: "16,185,129",
    headerBg: "rgba(16,185,129,0.1)", badgeBg: "rgba(16,185,129,0.13)", badgeTxt: "#6ee7b7",
  },
  card: {
    mesh: "linear-gradient(135deg,#071520 0%,#0e2a3f 50%,#071520 100%)",
    accent: "#22d3ee", accentRgb: "6,182,212",
    headerBg: "rgba(6,182,212,0.1)", badgeBg: "rgba(6,182,212,0.13)", badgeTxt: "#67e8f9",
  },
  media: {
    mesh: "linear-gradient(135deg,#1c1003 0%,#2d1f00 50%,#1c1003 100%)",
    accent: "#fbbf24", accentRgb: "245,158,11",
    headerBg: "rgba(245,158,11,0.1)", badgeBg: "rgba(245,158,11,0.13)", badgeTxt: "#fcd34d",
  },
  others: {
    mesh: "linear-gradient(135deg,#1c0511 0%,#2d0a1a 50%,#1c0511 100%)",
    accent: "#fb7185", accentRgb: "244,63,94",
    headerBg: "rgba(244,63,94,0.1)", badgeBg: "rgba(244,63,94,0.13)", badgeTxt: "#fda4af",
  },
  documents: {
    mesh: "linear-gradient(135deg,#150830 0%,#210d45 50%,#150830 100%)",
    accent: "#c084fc", accentRgb: "168,85,247",
    headerBg: "rgba(168,85,247,0.1)", badgeBg: "rgba(168,85,247,0.13)", badgeTxt: "#d8b4fe",
  },
};

// ── Sub-components ──────────────────────────────────────────────────────────

function CopyBtn({ value, id, copied, onCopy }: { value: string; id: string; copied: string | null; onCopy: (v: string, k: string) => void }) {
  const ok = copied === id;
  return (
    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
      onClick={e => { e.stopPropagation(); onCopy(value, id); }}
      style={{ padding: 4, borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
      <AnimatePresence mode="wait" initial={false}>
        {ok
          ? <motion.div key="y" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check style={{ width: 11, height: 11, color: "#34d399" }} /></motion.div>
          : <motion.div key="n" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Copy style={{ width: 11, height: 11, color: "rgba(100,116,139,0.7)" }} /></motion.div>
        }
      </AnimatePresence>
    </motion.button>
  );
}

function SecretField({ label, value, id, reveal, onToggle, onCopy, copied }: {
  label: string; value: string; id: string;
  reveal: Record<string, boolean>;
  onToggle: (k: string) => void;
  onCopy: (v: string, k: string) => void;
  copied: string | null;
}) {
  const vis = reveal[id];
  return (
    <Row label={label}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 900, color: "#fff" }}>
          {vis ? value : "••••••••"}
        </span>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => onToggle(id)}
          style={{ padding: 4, borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
          {vis
            ? <EyeOff style={{ width: 11, height: 11, color: "rgba(100,116,139,0.7)" }} />
            : <Eye style={{ width: 11, height: 11, color: "rgba(100,116,139,0.7)" }} />}
        </motion.button>
        <CopyBtn value={value} id={`${id}_cp`} copied={copied} onCopy={onCopy} />
      </div>
    </Row>
  );
}

function Row({ label, children, mono = false, value, copyId, copied, onCopy }: {
  label: string; children?: React.ReactNode; mono?: boolean;
  value?: string; copyId?: string; copied?: string | null; onCopy?: (v: string, k: string) => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.045)",
    }}>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(100,116,139,0.6)", flexShrink: 0, marginRight: 12 }}>{label}</span>
      {children ?? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ fontFamily: mono ? "monospace" : undefined, fontSize: 12, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }} title={value}>
            {value}
          </span>
          {copyId && onCopy && value && <CopyBtn value={value} id={copyId} copied={copied ?? null} onCopy={onCopy} />}
        </div>
      )}
    </div>
  );
}

function CardShell({ category, children, onEdit, onDelete }: {
  category: CategorySchema; children: React.ReactNode;
  onEdit: () => void; onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const t = tokens[category.id] ?? tokens.others;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.008 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      style={{
        position: "relative", borderRadius: 18, overflow: "hidden",
        background: "rgba(8,8,28,0.85)",
        border: `1px solid ${hovered ? `rgba(${t.accentRgb},0.45)` : "rgba(255,255,255,0.07)"}`,
        backdropFilter: "blur(32px)",
        boxShadow: hovered
          ? `0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(${t.accentRgb},0.18)`
          : "0 4px 24px rgba(0,0,0,0.4)",
        transition: "border-color 0.25s, box-shadow 0.25s",
        height: "100%",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)`,
        opacity: hovered ? 1 : 0.4, transition: "opacity 0.25s",
      }} />

      {/* Hover glow orb */}
      {hovered && (
        <div style={{
          position: "absolute", top: -40, right: -40, width: 160, height: 160,
          borderRadius: "50%", pointerEvents: "none",
          background: `radial-gradient(circle, rgba(${t.accentRgb},0.22) 0%, transparent 70%)`,
          filter: "blur(24px)",
        }} />
      )}

      {/* Card body — flex:1 pushes footer to bottom */}
      <div style={{ flex: 1, padding: "18px 20px 14px", position: "relative", zIndex: 1 }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", justifyContent: "flex-end", gap: 8,
        padding: "10px 20px 14px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        position: "relative", zIndex: 1, flexShrink: 0,
      }}>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onEdit}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 18px", borderRadius: 10, cursor: "pointer",
            fontSize: 12, fontWeight: 800, color: "#c7d2fe",
            background: `rgba(${t.accentRgb},0.12)`,
            border: `1px solid rgba(${t.accentRgb},0.28)`,
          }}>
          <Edit2 style={{ width: 12, height: 12 }} /> Edit
        </motion.button>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onDelete}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 18px", borderRadius: 10, cursor: "pointer",
            fontSize: 12, fontWeight: 800, color: "#fda4af",
            background: "rgba(244,63,94,0.1)",
            border: "1px solid rgba(244,63,94,0.28)",
          }}>
          <Trash2 style={{ width: 12, height: 12 }} /> Delete
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Aadhaar Card Preview ────────────────────────────────────────────────────

function AadhaarQR() {
  // Realistic QR code grid — 21×21 modules with finder patterns + data
  const row = (s: string) => s.split("").map(Number);
  const modules = [
    row("111111101001011111111"),
    row("100000101100010000001"),
    row("101110101011010111101"),
    row("101110100110010111101"),
    row("101110101001010111101"),
    row("100000100100010000001"),
    row("111111101010111111111"),
    row("000000001010100000000"),
    row("011011110101101110110"),
    row("100110001100011001001"),
    row("111001110011111001110"),
    row("001100001101000100001"),
    row("010101110010101011010"),
    row("000000001011000011011"),
    row("111111101100111101010"),
    row("100000101011100010001"),
    row("101110101001011010110"),
    row("101110100110110001011"),
    row("101110101100001110100"),
    row("100000101010100011001"),
    row("111111101011111100110"),
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(21,1fr)`, gap: 0.5, width: 64, height: 64 }}>
      {modules.flat().map((v, i) => (
        <div key={i} style={{ background: v ? "#1a237e" : "transparent" }} />
      ))}
    </div>
  );
}

function AadhaarCardView({ record }: { record: Record<string, any> }) {
  const rawNum = (record.DocNumber || "").replace(/[\s-]/g, "");
  const formatted = rawNum.length === 12
    ? `${rawNum.slice(0,4)} ${rawNum.slice(4,8)} ${rawNum.slice(8,12)}`
    : rawNum || "XXXX XXXX XXXX";

  // Only show actual raster images, not SVG or empty
  const isRealPhoto = (s: string) => s && (s.startsWith("data:image/jpeg") || s.startsWith("data:image/png") || s.startsWith("data:image/jpg") || s.startsWith("data:image/webp"));
  const photoSrc = isRealPhoto(record.FileAttachment) ? record.FileAttachment : null;

  const name = record.HolderName || "";
  const dob = record.HolderDOB || "";
  const gender = record.Gender || "";

  // Ashoka wheel spoke lines
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const a = (i * 15 * Math.PI) / 180;
    return { x1: 16 + 6 * Math.cos(a), y1: 16 + 6 * Math.sin(a), x2: 16 + 13 * Math.cos(a), y2: 16 + 13 * Math.sin(a) };
  });

  return (
    <div style={{
      width: "100%", maxWidth: 520,
      borderRadius: 16, overflow: "hidden",
      boxShadow: "0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.1)",
      fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
      userSelect: "none",
    }}>

      {/* ── HEADER: Navy blue band ── */}
      <div style={{
        background: "linear-gradient(180deg, #283593 0%, #1a237e 100%)",
        padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* UIDAI emblem */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", width: 36, height: 36 }}>
            <svg viewBox="0 0 32 32" width="36" height="36">
              <circle cx="16" cy="16" r="14" fill="none" stroke="#FFD700" strokeWidth="1.2"/>
              <circle cx="16" cy="16" r="5" fill="none" stroke="#FFD700" strokeWidth="1"/>
              <circle cx="16" cy="16" r="2" fill="#FFD700"/>
              {spokes.map((s, i) => <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#FFD700" strokeWidth="0.7" />)}
            </svg>
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 12, fontWeight: 900, letterSpacing: "0.14em", lineHeight: 1 }}>UIDAI</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 8, marginTop: 2 }}>Unique Identification Authority</div>
          </div>
        </div>

        {/* Centre: आधार wordmark */}
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#FF9933", fontSize: 28, fontWeight: 900, lineHeight: 1, letterSpacing: "0.02em" }}>आधार</div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 9, letterSpacing: "0.4em", fontWeight: 700, marginTop: 3 }}>AADHAAR</div>
        </div>

        {/* Right: भारत सरकार */}
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: 700, lineHeight: 1.7 }}>भारत सरकार</div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 8 }}>Government of India</div>
        </div>
      </div>

      {/* ── BODY: White section ── */}
      <div style={{
        background: "#fff",
        padding: "18px 20px 14px",
        display: "flex", gap: 18, alignItems: "stretch",
        minHeight: 140,
      }}>
        {/* Photo */}
        <div style={{
          width: 90, flexShrink: 0,
          border: "2px solid #1a237e",
          borderRadius: 6, overflow: "hidden",
          background: "#e8eaf6",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {photoSrc ? (
            <img src={photoSrc} referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <svg viewBox="0 0 60 75" width="60" height="75" fill="none">
              <rect width="60" height="75" fill="#e8eaf6"/>
              <circle cx="30" cy="26" r="14" fill="#9fa8da"/>
              <ellipse cx="30" cy="62" rx="22" ry="16" fill="#9fa8da"/>
            </svg>
          )}
        </div>

        {/* Personal info */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          {name ? (
            <div style={{ fontSize: 18, fontWeight: 900, color: "#1a237e", letterSpacing: "-0.3px", lineHeight: 1.2 }}>{name}</div>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: "#fff3e0", border: "1px dashed #FF9933" }}>
              <span style={{ fontSize: 11, color: "#e65100", fontWeight: 700 }}>✏ Edit record to add name</span>
            </div>
          )}
          {dob && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#333" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", minWidth: 32 }}>DOB</span>
              <span style={{ fontWeight: 600 }}>{dob}</span>
            </div>
          )}
          {gender && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#333" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", minWidth: 32 }}>SEX</span>
              <span style={{ fontWeight: 600 }}>{gender === "MALE" ? "MALE / पुरुष" : gender === "FEMALE" ? "FEMALE / महिला" : gender}</span>
            </div>
          )}
          <div style={{ marginTop: 4, fontSize: 9, color: "#FF9933", fontWeight: 700, fontStyle: "italic" }}>
            मेरा आधार, मेरी पहचान
          </div>
        </div>

        {/* QR Code */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
          <div style={{ padding: 4, background: "#fff", border: "1px solid #ddd", borderRadius: 4 }}>
            <AadhaarQR />
          </div>
          <div style={{ fontSize: 7, color: "#999", textAlign: "center", letterSpacing: "0.06em" }}>SCAN QR CODE</div>
        </div>
      </div>

      {/* ── NUMBER BAND ── */}
      <div style={{
        background: "linear-gradient(180deg, #f8f9fa 0%, #f0f0f0 100%)",
        borderTop: "4px solid #FF9933",
        padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 8.5, fontWeight: 700, color: "#999", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 }}>
            UID / आधार संख्या
          </div>
          <div style={{
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: 26, fontWeight: 900, color: "#1a237e",
            letterSpacing: "0.22em", lineHeight: 1,
          }}>
            {formatted}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 7.5, color: "#888", fontWeight: 600, lineHeight: 1.7 }}>
            Unique Identification<br />Authority of India
          </div>
          <div style={{ fontSize: 8, color: "#FF9933", fontWeight: 800, marginTop: 4 }}>www.uidai.gov.in</div>
          <div style={{ fontSize: 7.5, color: "#666", fontWeight: 600 }}>Helpline: 1947</div>
        </div>
      </div>

      {/* ── Indian tricolor strip ── */}
      <div style={{ height: 6, display: "flex" }}>
        <div style={{ flex: 1, background: "#FF9933" }} />
        <div style={{ flex: 1, background: "#fff", borderTop: "1px solid #e0e0e0", borderBottom: "1px solid #e0e0e0" }} />
        <div style={{ flex: 1, background: "#138808" }} />
      </div>
    </div>
  );
}

// ── Category card contents ───────────────────────────────────────────────────

export default function RecordItemCard({ category, record, onEdit, onDelete }: RecordItemCardProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const rowNum = record._rowNum || 0;
  const t = tokens[category.id] ?? tokens.others;

  const cp = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };
  const tog = (k: string) => setReveal(prev => ({ ...prev, [k]: !prev[k] }));

  // ── Header for person/account/service cards ──────────────────────────────
  function PersonHeader({ initials, name, sub, badge }: { initials: string; name: string; sub?: string; badge?: string }) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", marginBottom: 14, marginLeft: -20, marginRight: -20, marginTop: -18,
        background: t.headerBg,
        borderBottom: `1px solid rgba(${t.accentRgb},0.15)`,
      }}>
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: 13, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `linear-gradient(135deg, rgba(${t.accentRgb},0.6), rgba(${t.accentRgb},0.3))`,
          border: `1px solid rgba(${t.accentRgb},0.4)`,
          boxShadow: `0 4px 16px rgba(${t.accentRgb},0.3)`,
          fontSize: 14, fontWeight: 900, color: "#fff",
        }}>
          {initials}
        </div>

        {/* Name / sub */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
          {sub && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
              <Calendar style={{ width: 10, height: 10, color: "rgba(100,116,139,0.6)", flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "rgba(100,116,139,0.65)", fontWeight: 600 }}>{sub}</span>
            </div>
          )}
        </div>

        {/* Badge */}
        {badge && (
          <span style={{
            fontSize: 8, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase",
            padding: "4px 10px", borderRadius: 6,
            background: t.badgeBg, color: t.badgeTxt,
            border: `1px solid rgba(${t.accentRgb},0.25)`, flexShrink: 0,
          }}>{badge}</span>
        )}
      </div>
    );
  }

  // ── PERSONAL ──────────────────────────────────────────────────────────────
  if (category.id === "personal") {
    const initials = (record.Name || "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
    return (
      <CardShell category={category} onEdit={() => onEdit(record)} onDelete={() => onDelete(rowNum)}>
        <PersonHeader initials={initials} name={record.Name || "No Name"} sub={record.DOB} badge="Personal" />
        {record.AdharNumber && <Row label="Aadhaar" value={record.AdharNumber} mono copyId="adhar" copied={copied} onCopy={cp} />}
        {record.PanNumber    && <Row label="PAN" value={String(record.PanNumber).toUpperCase()} mono copyId="pan" copied={copied} onCopy={cp} />}
        {record.DrivingLicence && <Row label="DL" value={record.DrivingLicence} mono copyId="dl" copied={copied} onCopy={cp} />}
        {record.EpicNumber   && <Row label="EPIC" value={String(record.EpicNumber).toUpperCase()} mono copyId="epic" copied={copied} onCopy={cp} />}
        {record.MobileNumber && <Row label="Mobile" value={record.MobileNumber} mono copyId="mob" copied={copied} onCopy={cp} />}
        {record.AlternateMobileNumber && <Row label="Alternate" value={record.AlternateMobileNumber} mono copyId="altm" copied={copied} onCopy={cp} />}
        {record.EmailID      && <Row label="Email" value={record.EmailID} copyId="email" copied={copied} onCopy={cp} />}
      </CardShell>
    );
  }

  // ── FINANCIAL ─────────────────────────────────────────────────────────────
  if (category.id === "financial") {
    const initials = (record.AccountHolderName || "B").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
    return (
      <CardShell category={category} onEdit={() => onEdit(record)} onDelete={() => onDelete(rowNum)}>
        <PersonHeader initials={initials} name={record.AccountHolderName || "Account"} sub={record.BankName} badge={record.AccountType || "Savings"} />

        {record.AccountNumber && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", borderRadius: 12, marginBottom: 12,
            background: `rgba(${t.accentRgb},0.07)`, border: `1px solid rgba(${t.accentRgb},0.18)`,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 8, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: `rgba(${t.accentRgb},0.6)`, marginBottom: 4 }}>Account Number</p>
              <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "0.1em" }}>{record.AccountNumber}</span>
            </div>
            <CopyBtn value={record.AccountNumber} id="acc" copied={copied} onCopy={cp} />
          </div>
        )}

        {record.IFSC       && <Row label="IFSC" value={record.IFSC} mono copyId="ifsc" copied={copied} onCopy={cp} />}
        {record.UserID     && <Row label="Net ID" value={record.UserID} mono copyId="uid" copied={copied} onCopy={cp} />}
        {record.Password   && <SecretField label="Password" value={record.Password} id="pwd" reveal={reveal} onToggle={tog} onCopy={cp} copied={copied} />}
        {record.CustomerID && <Row label="Customer ID" value={record.CustomerID} mono copyId="cust" copied={copied} onCopy={cp} />}
        {record.ProfilePassword && <SecretField label="Profile PW" value={record.ProfilePassword} id="ppw" reveal={reveal} onToggle={tog} onCopy={cp} copied={copied} />}
        {record.LinkedMobileNumber && <Row label="Linked Mobile" value={record.LinkedMobileNumber} mono />}
        {record.LinkedEmail && <Row label="Linked Email" value={record.LinkedEmail} />}
        {record.SecurityAnswers && (
          <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", fontSize: 10, fontStyle: "italic", color: "rgba(148,163,184,0.55)", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 800, fontStyle: "normal", color: "rgba(148,163,184,0.7)" }}>Q&A: </span>{record.SecurityAnswers}
          </div>
        )}
      </CardShell>
    );
  }

  // ── CARD (Credit/Debit) ───────────────────────────────────────────────────
  if (category.id === "card") {
    return (
      <CardShell category={category} onEdit={() => onEdit(record)} onDelete={() => onDelete(rowNum)}>
        <FlipCard3D
          cardNumber={record.CardNumber}
          cardHolder={record.CardHolderName}
          expiry={record.Expiry}
          cvv={record.CVV}
          pin={record.PIN}
          cardType={record.CardType}
          issuedBank={record.IssuedBank}
          debitCredit={record["Debit/Credit"]}
        />
      </CardShell>
    );
  }

  // ── DOCUMENTS ─────────────────────────────────────────────────────────────
  if (category.id === "documents") {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [shareStatus, setShareStatus] = useState<string | null>(null);
    const isImg = record.FileAttachment?.startsWith("data:image/");
    const isPdf = record.FileAttachment?.startsWith("data:application/pdf");

    const dl = () => {
      if (!record.FileAttachment) return;
      const a = document.createElement("a");
      a.href = record.FileAttachment;
      const ext = record.FileAttachment.includes("pdf") ? "pdf" : record.FileAttachment.includes("png") ? "png" : "jpg";
      a.download = `${(record.Title || "doc").replace(/[^a-z0-9]/gi, "_")}.${ext}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };
    const share = async () => {
      const text = `My Vault Document\nTitle: ${record.Title || "Untitled"}\nType: ${record.DocType || "Document"}`;
      if (navigator.share) { try { await navigator.share({ title: record.Title || "Document", text }); setShareStatus("Shared!"); setTimeout(() => setShareStatus(null), 2000); return; } catch {} }
      try { await navigator.clipboard.writeText(text); setShareStatus("Copied!"); setTimeout(() => setShareStatus(null), 2000); } catch {}
    };

    return (
      <>
        <CardShell category={category} onEdit={() => onEdit(record)} onDelete={() => onDelete(rowNum)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, padding: "12px 14px", marginLeft: -20, marginRight: -20, marginTop: -18, background: t.headerBg, borderBottom: `1px solid rgba(${t.accentRgb},0.15)` }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${t.accentRgb},0.2)`, border: `1px solid rgba(${t.accentRgb},0.35)`, flexShrink: 0 }}>
              <FileText style={{ width: 18, height: 18, color: t.accent }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: t.accent, marginBottom: 3 }}>{record.DocType || "Document"}</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{record.Title || "Untitled"}</p>
            </div>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 6, background: t.badgeBg, color: t.badgeTxt, border: `1px solid rgba(${t.accentRgb},0.25)`, flexShrink: 0 }}>Sealed</span>
          </div>

          {record.DocNumber && <Row label="Doc Ref" value={record.DocNumber} mono copyId="docnum" copied={copied} onCopy={cp} />}

          {record.FileAttachment && (
            <div style={{ marginTop: 12 }}>
              {isImg && (
                <motion.div whileHover={{ scale: 1.02 }} onClick={() => setPreviewOpen(true)}
                  style={{ position: "relative", borderRadius: 12, overflow: "hidden", height: 120, cursor: "pointer", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <img src={record.FileAttachment} alt={record.Title} referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(3,3,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => (e.currentTarget.style.opacity = "0")}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 10, background: t.accent, color: "#fff", fontSize: 11, fontWeight: 800 }}>
                      <Eye style={{ width: 13, height: 13 }} /> Preview
                    </span>
                  </div>
                </motion.div>
              )}
              {isPdf && (
                <div onClick={() => setPreviewOpen(true)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, background: `rgba(${t.accentRgb},0.07)`, border: `1px solid rgba(${t.accentRgb},0.15)`, cursor: "pointer" }}>
                  <div style={{ padding: 8, borderRadius: 10, background: `rgba(${t.accentRgb},0.18)` }}><FileText style={{ width: 16, height: 16, color: t.accent }} /></div>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: "#fff" }}>PDF Document</p>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: t.accent }}>Click to open</p>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {[{ icon: Download, label: "Download", fn: dl }, { icon: Share2, label: shareStatus || "Share", fn: share }].map(({ icon: Icon, label, fn }) => (
                  <motion.button key={label} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={fn}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, cursor: "pointer", fontSize: 11, fontWeight: 800, color: t.badgeTxt, background: t.badgeBg, border: `1px solid rgba(${t.accentRgb},0.2)` }}>
                    <Icon style={{ width: 12, height: 12 }} /> {label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </CardShell>

        {/* Lightbox */}
        <AnimatePresence>
          {previewOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(3,3,20,0.92)", backdropFilter: "blur(24px)" }}>
              <div style={{ position: "absolute", inset: 0 }} onClick={() => setPreviewOpen(false)} />
              <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}
                style={{ position: "relative", width: "100%", maxWidth: 900, borderRadius: 24, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh", background: "rgba(10,10,30,0.97)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: t.accent }}>{record.DocType || "Document"}</p>
                    <p style={{ margin: 0, marginTop: 3, fontSize: 15, fontWeight: 900, color: "#fff" }}>{record.Title}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={dl}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#fff", background: t.accent, border: "none" }}>
                      <Download style={{ width: 13, height: 13 }} /> Download
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.04 }} onClick={() => setPreviewOpen(false)}
                      style={{ padding: 8, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", color: "rgba(148,163,184,0.8)" }}>
                      <X style={{ width: 18, height: 18 }} />
                    </motion.button>
                  </div>
                </div>
                <div style={{ flex: 1, padding: 32, display: "flex", alignItems: "center", justifyContent: "center", overflowY: "auto", background: "rgba(0,0,0,0.4)" }}>
                  {record.DocType === "Aadhaar Card"
                    ? <AadhaarCardView record={record} />
                    : isPdf
                    ? <iframe src={record.FileAttachment} style={{ width: "100%", height: "60vh", borderRadius: 16, background: "#fff" }} title={record.Title} />
                    : <img src={record.FileAttachment} alt={record.Title} referrerPolicy="no-referrer" style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 16, objectFit: "contain" }} />
                  }
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── MEDIA / OTHERS ────────────────────────────────────────────────────────
  const isMedia = category.id === "media";
  const initials = (record.Particulars || "?")[0].toUpperCase();

  return (
    <CardShell category={category} onEdit={() => onEdit(record)} onDelete={() => onDelete(rowNum)}>
      <PersonHeader initials={initials} name={record.Particulars || "Account"} badge={isMedia ? "Media" : "Others"} />
      {record.Userid    && <Row label="Login / ID" value={record.Userid} mono copyId="uid" copied={copied} onCopy={cp} />}
      {record.Password  && <SecretField label="Password" value={record.Password} id="pwd" reveal={reveal} onToggle={tog} onCopy={cp} copied={copied} />}
      {record.MobileNumber && <Row label="Recovery" value={record.MobileNumber} mono copyId="mob" copied={copied} onCopy={cp} />}
      {record.RecoveryMail && <Row label="Recovery Email" value={record.RecoveryMail} copyId="rmail" copied={copied} onCopy={cp} />}
      {category.id === "others" && record.Remarks && (
        <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 10, background: `rgba(${t.accentRgb},0.07)`, border: `1px solid rgba(${t.accentRgb},0.15)`, fontSize: 10, fontStyle: "italic", color: "rgba(203,213,225,0.5)", lineHeight: 1.55 }}>
          {record.Remarks}
        </div>
      )}
    </CardShell>
  );
}
