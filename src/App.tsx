import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Loader2 } from "lucide-react";
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { auth, googleProvider } from "./lib/firebase";
import { CATEGORIES, CategorySchema, INITIAL_SIMULATED_DATA } from "./types";
import { addRecord, updateRecord, deleteRecord, fetchAllData } from "./services/dataService";

// Components
import Background      from "./components/Background";
import Sidebar         from "./components/Sidebar";
import Header          from "./components/Header";
import Dashboard       from "./components/Dashboard";
import RecordsView     from "./components/RecordsView";
import ProfilePanel    from "./components/ProfilePanel";
import CardFormModal   from "./components/CardFormModal";
import ConfirmModal, { ConfirmState } from "./components/ConfirmModal";
import ToastStack, { Toast } from "./components/ToastStack";
import AIChat from "./components/AIChat";

// ─── types ─────────────────────────────────────────────────────────────────

type VaultData = Record<string, any[]>;

// ─── Login screen ──────────────────────────────────────────────────────────

function LoginScreen({ onSignIn, loading }: { onSignIn: () => void; loading: boolean }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "#000008" }}>
      <Background />

      {/* Glow blobs */}
      <div style={{ position: "absolute", top: -128, right: -128, width: 600, height: 600, borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", bottom: -128, left: -128, width: 500, height: 500, borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", background: "radial-gradient(circle, rgba(79,70,229,0.14) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", top: "40%", right: "20%", width: 300, height: 300, borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none", background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        style={{
          position: "relative", width: "100%", maxWidth: 460, margin: "0 16px",
          background: "rgba(6,6,24,0.94)",
          border: "1px solid rgba(124,58,237,0.28)",
          borderRadius: 32,
          backdropFilter: "blur(40px) saturate(150%)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04), 0 0 80px rgba(124,58,237,0.12)",
        }}
      >
        {/* Top gradient bar */}
        <div style={{ height: 2, background: "linear-gradient(90deg, #7c3aed, #6366f1, #818cf8)", borderRadius: "32px 32px 0 0" }} />

        <div style={{ padding: "36px 40px 36px", textAlign: "center" }}>
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 22, delay: 0.15 }}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 80, height: 80, borderRadius: 24, marginBottom: 28,
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              boxShadow: "0 16px 48px rgba(124,58,237,0.55), 0 0 80px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.22)",
            }}
          >
            <ShieldCheck style={{ width: 40, height: 40, color: "#fff", strokeWidth: 1.8 }} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 260, damping: 24 }}
            style={{ margin: 0, marginBottom: 10, fontSize: 40, fontWeight: 900, color: "#fff", letterSpacing: "-1.5px", lineHeight: 1 }}
          >
            My{" "}
            <span style={{
              background: "linear-gradient(90deg, #a78bfa 0%, #818cf8 50%, #a78bfa 100%)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 3s linear infinite",
            }}>Vault</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            style={{ margin: 0, marginBottom: 28, fontSize: 14, color: "rgba(148,163,184,0.7)", fontWeight: 500, lineHeight: 1.5 }}
          >
            Your encrypted personal archive — secured with Google
          </motion.p>

          {/* Feature pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 32 }}>
            {["Zero-Knowledge", "Firestore", "AES-256", "OAuth 2.0"].map((f, i) => (
              <motion.span
                key={f}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.07 }}
                style={{
                  padding: "5px 12px", borderRadius: 99, fontSize: 10, fontWeight: 800,
                  textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "#a78bfa",
                  background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.22)",
                }}
              >
                {f}
              </motion.span>
            ))}
          </div>

          {/* Sign-in button */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, type: "spring", stiffness: 260, damping: 24 }}
            whileHover={{ scale: 1.03, boxShadow: "0 12px 40px rgba(124,58,237,0.6), inset 0 1px 0 rgba(255,255,255,0.28)" }}
            whileTap={{ scale: 0.97 }}
            onClick={onSignIn}
            disabled={loading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 12, padding: "15px 24px", borderRadius: 16,
              fontSize: 14, fontWeight: 900, color: "#fff", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.65 : 1,
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              border: "1px solid rgba(124,58,237,0.5)",
              boxShadow: "0 6px 24px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.18)",
              letterSpacing: "0.01em",
            }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: 17, height: 17, animation: "spin 1s linear infinite" }} />
                Authenticating…
              </>
            ) : (
              <>
                {/* Google G icon */}
                <svg style={{ width: 17, height: 17 }} viewBox="0 0 24 24">
                  <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="rgba(255,255,255,0.85)" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="rgba(255,255,255,0.7)" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="rgba(255,255,255,0.55)" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </motion.button>

          <p style={{ margin: 0, marginTop: 20, fontSize: 10, color: "rgba(71,85,105,0.7)", fontWeight: 600 }}>
            By signing in you agree your data is stored securely in Firestore
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser]                         = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading]           = useState(true);
  const [signInLoading, setSignInLoading]       = useState(false);
  const [data, setData]                         = useState<VaultData>({});
  const [dataLoading, setDataLoading]           = useState(false);
  const [isLive, setIsLive]                     = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategorySchema | null>(null);
  const [searchQuery, setSearchQuery]           = useState("");
  const [showProfile, setShowProfile]           = useState(false);
  const [mobileOpen, setMobileOpen]             = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modal
  const [modalOpen, setModalOpen]   = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [isSaving, setIsSaving]     = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = React.useRef(0);

  // Confirm dialog
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false, title: "", message: "", onConfirm: () => {},
  });

  // ── helpers ──────────────────────────────────────────────────────────────

  const addToast = useCallback((type: Toast["type"], title: string, message?: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const openConfirm = useCallback((opts: Omit<ConfirmState, "open">) => {
    setConfirmState({ ...opts, open: true });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, open: false }));
  }, []);

  // ── auth ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const handleSignIn = async () => {
    setSignInLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      addToast("error", "Sign-in failed", e.message ?? "Could not sign in with Google");
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignOut = () => {
    openConfirm({
      title: "Sign out of My Vault?",
      message: "Your local session will be cleared. Your data remains safe in Firestore.",
      confirmLabel: "Sign Out",
      variant: "warn",
      onConfirm: async () => {
        closeConfirm();
        await signOut(auth);
        setData({});
        setIsLive(false);
        setSelectedCategory(null);
      },
    });
  };

  // ── data loading ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setDataLoading(true);
      try {
        const fetched = await fetchAllData();
        if (!cancelled) {
          setData(fetched.data);
          setIsLive(fetched.isLive);
        }
      } catch {
        if (!cancelled) {
          setData(INITIAL_SIMULATED_DATA);
          setIsLive(false);
          addToast("info", "Offline mode", "Using demo data — Firestore not reachable");
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]); // eslint-disable-line

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const handleAdd = () => {
    if (!selectedCategory) return;
    setEditRecord(null);
    setModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditRecord(record);
    setModalOpen(true);
  };

  const handleDelete = (record: any) => {
    if (!selectedCategory) return;
    const displayName =
      record.Name ?? record.AccountHolderName ?? record.CardHolderName ??
      record.Particulars ?? record.Title ?? "this record";
    openConfirm({
      title: "Delete Record?",
      message: `"${displayName}" will be permanently removed from ${selectedCategory.title}.`,
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          if (isLive) {
            await deleteRecord(selectedCategory.sheetName, record._rowNum);
          }
          setData(prev => ({
            ...prev,
            [selectedCategory.sheetName]: (prev[selectedCategory.sheetName] ?? [])
              .filter(r => r !== record),
          }));
          addToast("success", "Record deleted", `Removed from ${selectedCategory.title}`);
        } catch (e: any) {
          addToast("error", "Delete failed", e.message);
        }
      },
    });
  };

  const handleModalSave = async (formData: Record<string, any>): Promise<{ success: boolean; error?: string }> => {
    if (!selectedCategory) return { success: false, error: "No category selected" };
    setIsSaving(true);
    try {
      if (editRecord) {
        const updated = { ...editRecord, ...formData };
        if (isLive) {
          await updateRecord(selectedCategory.sheetName, editRecord._rowNum, updated);
        }
        setData(prev => ({
          ...prev,
          [selectedCategory.sheetName]: (prev[selectedCategory.sheetName] ?? [])
            .map(r => r === editRecord ? updated : r),
        }));
        addToast("success", "Record updated", selectedCategory.title);
      } else {
        const newRecord = { ...formData, _rowNum: Date.now() };
        if (isLive) {
          await addRecord(selectedCategory.sheetName, formData);
        }
        setData(prev => ({
          ...prev,
          [selectedCategory.sheetName]: [...(prev[selectedCategory.sheetName] ?? []), newRecord],
        }));
        addToast("success", "Record added", selectedCategory.title);
      }
      setModalOpen(false);
      return { success: true };
    } catch (e: any) {
      addToast("error", "Save failed", e.message);
      return { success: false, error: e.message };
    } finally {
      setIsSaving(false);
    }
  };

  // ── nav helpers ───────────────────────────────────────────────────────────

  const handleSelectCategory = (cat: CategorySchema | null) => {
    setSelectedCategory(cat);
    setSearchQuery("");
    setShowProfile(false);
    setMobileOpen(false);
  };

  const handleShowProfile = () => {
    setShowProfile(true);
    setSelectedCategory(null);
    setMobileOpen(false);
  };

  const totalRecords = CATEGORIES.reduce((s, c) => s + (data[c.sheetName]?.length ?? 0), 0);

  // ── render ────────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#000008" }}>
        <Background />
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="h-16 w-16 rounded-3xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 8px 40px rgba(124,58,237,0.4)" }}
        >
          <ShieldCheck className="h-8 w-8 text-white" strokeWidth={1.8} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onSignIn={handleSignIn} loading={signInLoading} />;
  }

  const sidebarW = sidebarCollapsed ? 64 : 240;
  const sidebarProps = {
    selectedCategory, showProfile,
    onSelectCategory: handleSelectCategory,
    onShowProfile: handleShowProfile,
    onSignOut: handleSignOut,
    user: { displayName: user.displayName, email: user.email, photoURL: user.photoURL },
    totalRecords,
    collapsed: sidebarCollapsed,
    onToggleCollapse: () => setSidebarCollapsed(v => !v),
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `${sidebarW}px 1fr`,
      gridTemplateRows: "auto 1fr",
      height: "100vh",
      overflow: "hidden",
      background: "#000008",
      transition: "grid-template-columns 0.28s cubic-bezier(0.4,0,0.2,1)",
    }}>
      <Background />

      {/* ── Sidebar (desktop) — row 1+2, col 1 ─────────────────── */}
      <div className="hidden lg:block" style={{ gridColumn: 1, gridRow: "1 / 3", height: "100vh", overflow: "hidden" }}>
        <Sidebar {...sidebarProps} />
      </div>

      {/* ── Header — row 1, col 2 ───────────────────────────────── */}
      <div style={{ gridColumn: 2, gridRow: 1, zIndex: 10 }}>
        <Header
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onAddRecord={handleAdd}
          onBackToDash={() => handleSelectCategory(null)}
          mobileMenuOpen={mobileOpen}
          onToggleMobile={() => setMobileOpen(v => !v)}
        />
      </div>

      {/* ── Main content — row 2, col 2 ─────────────────────────── */}
      <div style={{ gridColumn: 2, gridRow: 2, minHeight: 0, overflow: "hidden", position: "relative" }}>
        {/* Loading overlay */}
        <AnimatePresence>
          {dataLoading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center"
              style={{ background: "rgba(0,0,8,0.7)", backdropFilter: "blur(8px)" }}
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  className="h-12 w-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                >
                  <ShieldCheck className="h-6 w-6 text-white" strokeWidth={1.8} />
                </motion.div>
                <p className="text-sm font-black text-white">Syncing vault…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page content */}
        <main style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}>
          <AnimatePresence mode="wait">
            {!selectedCategory ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Dashboard
                  data={data}
                  isLive={isLive}
                  onSelectCategory={handleSelectCategory}
                  userName={user.displayName ?? user.email ?? ""}
                />
              </motion.div>
            ) : (
              <motion.div
                key={selectedCategory.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <RecordsView
                  category={selectedCategory}
                  records={data[selectedCategory.sheetName] ?? []}
                  searchQuery={searchQuery}
                  onAdd={handleAdd}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile sidebar overlay ──────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,8,0.75)", backdropFilter: "blur(8px)" }}
            />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ position: "fixed", left: 0, top: 0, height: "100%", zIndex: 50 }}
            >
              <Sidebar {...sidebarProps} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Profile panel ───────────────────────────────────────── */}
      <ProfilePanel
        open={showProfile}
        onClose={() => setShowProfile(false)}
        onSignOut={handleSignOut}
        data={data}
        user={{
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        }}
      />

      {/* ── Form modal ──────────────────────────────────────────── */}
      {selectedCategory && (
        <CardFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          category={selectedCategory}
          initialData={editRecord ?? undefined}
          onSave={handleModalSave}
          isSaving={isSaving}
        />
      )}

      {/* ── Confirm dialog ──────────────────────────────────────── */}
      <ConfirmModal
        state={confirmState}
        onCancel={closeConfirm}
      />

      {/* ── Toast stack ─────────────────────────────────────────── */}
      <ToastStack toasts={toasts} onDismiss={removeToast} />

      {/* ── AI Chat ─────────────────────────────────────────────── */}
      <AIChat data={data} onNavigate={(catId) => {
        const cat = CATEGORIES.find(c => c.id === catId);
        if (cat) handleSelectCategory(cat);
      }} />
    </div>
  );
}
