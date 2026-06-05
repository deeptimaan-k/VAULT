import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Plus, ChevronRight, Menu } from "lucide-react";
import { CategorySchema } from "../types";
import { useIsMobile } from "../hooks/useIsMobile";

interface Props {
  selectedCategory: CategorySchema | null;
  searchQuery: string;
  onSearch: (q: string) => void;
  onAddRecord: () => void;
  onBackToDash: () => void;
  mobileMenuOpen: boolean;
  onToggleMobile: () => void;
}

export default function Header({
  selectedCategory, searchQuery, onSearch, onAddRecord,
  onBackToDash, mobileMenuOpen, onToggleMobile,
}: Props) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchOpen, setSearchOpen]       = useState(false);
  const isMobile                          = useIsMobile();

  const now     = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 20,
      display: "flex", alignItems: "center", gap: isMobile ? 10 : 16,
      padding: isMobile ? "0 14px" : "0 28px",
      height: 56,
      minHeight: 56,
      background: "rgba(4,4,18,0.92)",
      backdropFilter: "blur(28px) saturate(160%)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      boxShadow: "0 1px 0 rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.4)",
    }}>

      {/* Hamburger — mobile only */}
      {isMobile && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleMobile}
          style={{
            flexShrink: 0, width: 34, height: 34, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            cursor: "pointer", color: "rgba(148,163,184,0.8)",
          }}
        >
          <Menu style={{ width: 16, height: 16 }} />
        </motion.button>
      )}

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, minWidth: 0 }}>
        {selectedCategory ? (
          <>
            {!isMobile && (
              <>
                <motion.button whileHover={{ color: "#a78bfa" }} whileTap={{ scale: 0.95 }} onClick={onBackToDash}
                  style={{ fontSize: 13, fontWeight: 700, color: "rgba(100,116,139,0.7)", cursor: "pointer", background: "none", border: "none", padding: 0 }}>
                  Dashboard
                </motion.button>
                <ChevronRight style={{ width: 13, height: 13, color: "rgba(71,85,105,0.6)", flexShrink: 0 }} />
              </>
            )}
            <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 900, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? 120 : "none" }}>
              {selectedCategory.title}
            </span>
          </>
        ) : (
          <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>Dashboard</span>
        )}
      </div>

      {/* Search — desktop always visible, mobile toggle */}
      {isMobile ? (
        <>
          <div style={{ flex: 1 }} />
          {/* Search icon button on mobile */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSearchOpen(v => !v)}
            style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: searchOpen ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${searchOpen ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.08)"}`, cursor: "pointer" }}>
            {searchOpen ? <X style={{ width: 14, height: 14, color: "#a78bfa" }} /> : <Search style={{ width: 14, height: 14, color: "rgba(148,163,184,0.7)" }} />}
          </motion.button>
        </>
      ) : (
        <motion.div
          animate={searchFocused ? { boxShadow: "0 0 0 2px rgba(124,58,237,0.45), 0 0 24px rgba(124,58,237,0.15)" } : { boxShadow: "none" }}
          style={{ flex: 1, maxWidth: 400, position: "relative", display: "flex", alignItems: "center", borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.045)", border: `1px solid ${searchFocused ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.07)"}`, transition: "border-color 0.15s" }}
        >
          <Search style={{ position: "absolute", left: 13, width: 14, height: 14, flexShrink: 0, color: searchFocused ? "#a78bfa" : "rgba(100,116,139,0.7)", transition: "color 0.15s" }} />
          <input type="text" placeholder={selectedCategory ? `Search ${selectedCategory.title}…` : "Search vault…"} value={searchQuery} onChange={e => onSearch(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            style={{ width: "100%", paddingLeft: 38, paddingRight: searchQuery ? 36 : 14, paddingTop: 10, paddingBottom: 10, background: "transparent", border: "none", outline: "none", fontSize: 13, fontWeight: 600, color: "#fff" }}
            className="placeholder-slate-600"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} onClick={() => onSearch("")}
                style={{ position: "absolute", right: 10, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, color: "rgba(100,116,139,0.7)", cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "none" }}>
                <X style={{ width: 11, height: 11 }} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Right group — desktop */}
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }} className="hidden xl:flex">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{timeStr}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(100,116,139,0.6)", letterSpacing: "0.06em" }}>{dateStr}</span>
          </div>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.07)" }} className="hidden xl:block" />
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#10b981" }} className="hidden md:flex">
            <span style={{ position: "relative", display: "flex", width: 7, height: 7 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#34d399", opacity: 0.75, animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
              <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: "#34d399", display: "block" }} />
            </span>
            Live
          </div>
          {selectedCategory && (
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 8px 32px rgba(124,58,237,0.6), inset 0 1px 0 rgba(255,255,255,0.25)" }}
              whileTap={{ scale: 0.96 }}
              onClick={onAddRecord}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 12, background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)", border: "1px solid rgba(124,58,237,0.55)", boxShadow: "0 4px 20px rgba(124,58,237,0.38), inset 0 1px 0 rgba(255,255,255,0.18)", fontSize: 13, fontWeight: 900, color: "#fff", cursor: "pointer", letterSpacing: "0.01em" }}
            >
              <Plus style={{ width: 14, height: 14 }} />
              <span className="hidden sm:inline">Add Record</span>
            </motion.button>
          )}
        </div>
      )}

      {/* Mobile right: Add button only when category selected */}
      {isMobile && selectedCategory && (
        <motion.button whileTap={{ scale: 0.9 }} onClick={onAddRecord}
          style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "1px solid rgba(124,58,237,0.5)", boxShadow: "0 4px 16px rgba(124,58,237,0.4)", cursor: "pointer" }}>
          <Plus style={{ width: 16, height: 16, color: "#fff" }} />
        </motion.button>
      )}

      {/* Mobile search bar — expands below header */}
      <AnimatePresence>
        {isMobile && searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ position: "absolute", top: 56, left: 0, right: 0, padding: "10px 14px", background: "rgba(4,4,18,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)", zIndex: 19 }}
          >
            <div style={{ position: "relative", display: "flex", alignItems: "center", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(124,58,237,0.3)" }}>
              <Search style={{ position: "absolute", left: 13, width: 14, height: 14, color: "#a78bfa" }} />
              <input autoFocus type="text" placeholder={selectedCategory ? `Search ${selectedCategory.title}…` : "Search vault…"} value={searchQuery} onChange={e => onSearch(e.target.value)}
                style={{ width: "100%", paddingLeft: 38, paddingRight: searchQuery ? 36 : 14, paddingTop: 11, paddingBottom: 11, background: "transparent", border: "none", outline: "none", fontSize: 14, fontWeight: 600, color: "#fff" }}
              />
              {searchQuery && (
                <button onClick={() => onSearch("")} style={{ position: "absolute", right: 10, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, color: "rgba(100,116,139,0.7)", cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "none" }}>
                  <X style={{ width: 11, height: 11 }} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
