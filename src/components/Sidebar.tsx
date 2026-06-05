import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, User, Briefcase, CreditCard, Mail, Lock,
  FileText, UserCircle, ChevronLeft, ChevronRight, ShieldCheck, LogOut, Database,
} from "lucide-react";
import { CATEGORIES, CategorySchema } from "../types";

const IconMap: Record<string, React.ComponentType<any>> = {
  User, Briefcase, CreditCard, Mail, Lock, FileText,
};

const catColors: Record<string, string> = {
  personal: "#818cf8", financial: "#34d399", card: "#22d3ee",
  media: "#fbbf24", others: "#fb7185", documents: "#c084fc",
};

interface Props {
  selectedCategory: CategorySchema | null;
  showProfile: boolean;
  onSelectCategory: (cat: CategorySchema | null) => void;
  onShowProfile: () => void;
  onSignOut: () => void;
  user: { displayName?: string | null; email?: string | null; photoURL?: string | null };
  totalRecords: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  selectedCategory, showProfile,
  onSelectCategory, onShowProfile, onSignOut, user, totalRecords,
  collapsed, onToggleCollapse,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const W = collapsed ? 64 : 240;

  return (
    <div style={{
      width: W,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      background: "rgba(5,5,20,0.98)",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      backdropFilter: "blur(40px)",
      transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden",
      zIndex: 30,
    }}>

      {/* ── Logo ─────────────────────────────────── */}
      <div style={{ padding: "16px 12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <motion.div
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
          onClick={() => onSelectCategory(null)}
          style={{
            flexShrink: 0, width: 34, height: 34, borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(124,58,237,0.45)",
            cursor: "pointer",
          }}
        >
          <img src="/logo.svg" alt="My Vault" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </motion.div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }} style={{ overflow: "hidden", flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff", lineHeight: 1, whiteSpace: "nowrap" }}>
                My <span className="shimmer-text">Vault</span>
              </p>
              <p style={{ margin: 0, marginTop: 2, fontSize: 8, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(100,116,139,0.7)", whiteSpace: "nowrap" }}>Secure Archive</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={onToggleCollapse}
          style={{
            flexShrink: 0, width: 24, height: 24, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(100,116,139,0.8)", cursor: "pointer", marginLeft: collapsed ? "auto" : undefined,
          }}
        >
          {collapsed ? <ChevronRight style={{ width: 12, height: 12 }} /> : <ChevronLeft style={{ width: 12, height: 12 }} />}
        </motion.button>
      </div>

      {/* ── Nav ──────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 8px" }}>

        <NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} color="#7c3aed"
          active={!selectedCategory && !showProfile} collapsed={collapsed}
          hovered={hovered === "dashboard"} onHover={setHovered} onClick={() => onSelectCategory(null)} />

        {/* Section label */}
        {!collapsed && (
          <p style={{ margin: "10px 0 4px 10px", fontSize: 8, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(100,116,139,0.45)" }}>
            Categories
          </p>
        )}
        {collapsed && <div style={{ height: 8 }} />}

        {CATEGORIES.map(cat => (
          <NavItem key={cat.id} id={cat.id} label={cat.title}
            icon={IconMap[cat.icon] || Database} color={catColors[cat.id] ?? "#7c3aed"}
            active={selectedCategory?.id === cat.id && !showProfile} collapsed={collapsed}
            hovered={hovered === cat.id} onHover={setHovered} onClick={() => onSelectCategory(cat)} />
        ))}

        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 4px" }} />

        <NavItem id="profile" label="My Profile" icon={UserCircle} color="#22d3ee"
          active={showProfile} collapsed={collapsed}
          hovered={hovered === "profile"} onHover={setHovered} onClick={onShowProfile} />
      </nav>

      {/* ── Footer ───────────────────────────────── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 8px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.03)", justifyContent: collapsed ? "center" : undefined }}>
          {user.photoURL ? (
            <img src={user.photoURL} alt="" referrerPolicy="no-referrer"
              style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", fontSize: 11, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
              {(user.displayName?.[0] ?? user.email?.[0] ?? "M").toUpperCase()}
            </div>
          )}

          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.displayName ?? "Vault Owner"}</p>
                <p style={{ margin: 0, marginTop: 1, fontSize: 9, color: "rgba(100,116,139,0.7)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "monospace" }}>{user.email}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!collapsed && (
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onSignOut}
              style={{ flexShrink: 0, padding: 5, borderRadius: 7, color: "rgba(100,116,139,0.7)", cursor: "pointer", background: "none", border: "none", display: "flex", alignItems: "center" }}
              title="Sign out"
            >
              <LogOut style={{ width: 13, height: 13 }} />
            </motion.button>
          )}
        </div>

        {!collapsed && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, padding: "5px 10px", borderRadius: 8, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(100,116,139,0.6)" }}>Vault Total</span>
            <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 900, color: "#a78bfa" }}>{totalRecords}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── NavItem ───────────────────────────────────────────────────────────────────

function NavItem({ id, label, icon: Icon, color, active, collapsed, hovered, onHover, onClick }: {
  id: string; label: string; icon: React.ComponentType<any>; color: string;
  active: boolean; collapsed: boolean; hovered: boolean;
  onHover: (id: string | null) => void; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      style={{
        width: "100%", display: "flex", alignItems: "center",
        gap: 9, padding: "7px 8px",
        borderRadius: 9, marginBottom: 2,
        background: active ? `linear-gradient(135deg,${color}22,${color}10)` : hovered ? "rgba(255,255,255,0.04)" : "transparent",
        border: `1px solid ${active ? color + "30" : "transparent"}`,
        boxShadow: active ? `0 0 16px ${color}18` : "none",
        cursor: "pointer", position: "relative", overflow: "hidden",
        justifyContent: collapsed ? "center" : undefined,
        transition: "background 0.15s, border-color 0.15s",
        textAlign: "left",
      }}
    >
      {/* Active left bar */}
      {active && (
        <motion.div layoutId="activeBar"
          style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, borderRadius: "0 3px 3px 0", background: color, boxShadow: `0 0 8px ${color}` }}
        />
      )}

      {/* Icon */}
      <div style={{
        flexShrink: 0, width: 28, height: 28, borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: active || hovered ? `${color}20` : "transparent",
        border: `1px solid ${active ? color + "30" : "transparent"}`,
        transition: "background 0.15s",
      }}>
        <Icon style={{ width: 14, height: 14, color: active ? color : hovered ? color : "rgba(100,116,139,0.8)" }} />
      </div>

      {/* Label */}
      <AnimatePresence>
        {!collapsed && (
          <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.12 }}
            style={{ fontSize: 12, fontWeight: active ? 700 : 600, color: active ? "#fff" : hovered ? "#e2e8f0" : "rgba(100,116,139,0.8)", whiteSpace: "nowrap" }}>
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Tooltip when collapsed */}
      {collapsed && hovered && (
        <motion.div initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }}
          style={{ position: "absolute", left: "calc(100% + 12px)", top: "50%", transform: "translateY(-50%)", padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", zIndex: 99, pointerEvents: "none", background: "rgba(8,8,28,0.97)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
          {label}
        </motion.div>
      )}
    </motion.button>
  );
}
