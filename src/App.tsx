import React, { useState, useEffect } from "react";
import { 
  User, Briefcase, CreditCard, Mail, Lock, FileText,
  Plus, Search, ArrowLeft, Database, Sparkles, 
  HelpCircle, CheckCircle2, AlertCircle, RefreshCw,
  FileSpreadsheet, ExternalLink, Settings, X, ShieldCheck
} from "lucide-react";
import { CATEGORIES, CategorySchema } from "./types";
import { 
  addRecord, updateRecord, deleteRecord, fetchAllData
} from "./services/dataService";
import RecordItemCard from "./components/RecordItemCard";
import CardFormModal from "./components/CardFormModal";
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { auth, googleProvider } from "./lib/firebase";

// Icon components mapping based on string identifiers
const IconMap: Record<string, React.ComponentType<any>> = {
  User: User,
  Briefcase: Briefcase,
  CreditCard: CreditCard,
  Mail: Mail,
  Lock: Lock,
  FileText: FileText
};

export default function App() {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [isLive, setIsLive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  
  // Authentication states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Navigation states
  const [selectedCategory, setSelectedCategory] = useState<CategorySchema | null>(null);
  
  // Searching & Filtering states
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sheet edit/add form states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeEditingRecord, setActiveEditingRecord] = useState<Record<string, any> | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fetch workspace data from MongoDB
  const loadWorkspaceData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMsg("");
    try {
      const result = await fetchAllData();
      setData(result.data);
      setIsLive(result.isLive);
    } catch (err: any) {
      console.error("Failed to load MongoDB layout:", err);
      setErrorMsg(err.message || "Failed to synchronize with live secure MongoDB Database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (!currentUser) {
        setData({});
        setIsLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadWorkspaceData(true);
    }
  }, [user]);

  // Save/Update helper
  const handleSaveRecord = async (formData: Record<string, any>): Promise<{ success: boolean; error?: string }> => {
    if (!selectedCategory) return { success: false, error: "No category selected." };
    setIsSaving(true);
    try {
      let result;
      if (activeEditingRecord?._rowNum) {
        // Edit mode
        result = await updateRecord(
          selectedCategory.sheetName,
          activeEditingRecord._rowNum,
          formData
        );
      } else {
        // Add mode
        result = await addRecord(selectedCategory.sheetName, formData);
      }

      if (result.success) {
        showSuccessAlert(result.message);
        await loadWorkspaceData(false);
        return { success: true };
      } else {
        setErrorMsg(result.message);
        return { success: false, error: result.message };
      }
    } catch (e: any) {
      setErrorMsg("Failed to deliver submission: " + e.message);
      return { success: false, error: e.message };
    } finally {
      setIsSaving(false);
    }
  };

  // Delete helper
  const handleDeleteRecord = async (rowNum: any) => {
    if (!selectedCategory) return;
    
    const confirmText = selectedCategory.id === "card" 
      ? "Are you sure you want to permanently delete this card record?" 
      : "Are you sure you want to permanently delete this record?";
      
    if (!window.confirm(confirmText)) return;

    try {
      setIsLoading(true);
      const result = await deleteRecord(selectedCategory.sheetName, rowNum);
      if (result.success) {
        showSuccessAlert(result.message);
        await loadWorkspaceData(false);
      } else {
        setErrorMsg(result.message);
      }
    } catch (e: any) {
      setErrorMsg("Delete request failed: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger form for Addition
  const handleOpenAddForm = () => {
    setActiveEditingRecord(null);
    setIsModalOpen(true);
  };

  // Trigger form for Editing
  const handleOpenEditForm = (record: Record<string, any>) => {
    setActiveEditingRecord(record);
    setIsModalOpen(true);
  };



  const showSuccessAlert = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => {
      setSuccessMsg("");
    }, 5000);
  };

  // Filters records of selected sheets based on searchQuery
  const getFilteredRecords = () => {
    if (!selectedCategory) return [];
    const rawList = data[selectedCategory.sheetName] || [];
    if (!searchQuery.trim()) return rawList;

    const query = searchQuery.toLowerCase();
    return rawList.filter(record => {
      return Object.entries(record).some(([key, val]) => {
        if (key.startsWith("_")) return false; // skip internal row numbers
        return String(val || "").toLowerCase().includes(query);
      });
    });
  };

  // Get total rows counts for category cards
  const getRecordCount = (sheetName: string) => {
    return data[sheetName]?.length || 0;
  };

  // Highlights / Color profiles class map based on category
  const getCategoryStripeClass = (catId: string) => {
    switch (catId) {
      case "personal": return "from-blue-400 to-indigo-600";
      case "financial": return "from-emerald-400 to-teal-600";
      case "card": return "from-cyan-400 to-blue-500";
      case "media": return "from-amber-400 to-orange-600";
      default: return "from-rose-400 to-pink-600";
    }
  };

  const getCategoryTextColors = (catId: string) => {
    switch (catId) {
      case "personal": return "text-blue-400 group-hover:from-blue-400 group-hover:to-indigo-300";
      case "financial": return "text-emerald-400 group-hover:from-emerald-400 group-hover:to-teal-300";
      case "card": return "text-cyan-400 group-hover:from-cyan-400 group-hover:to-blue-300";
      case "media": return "text-amber-400 group-hover:from-amber-400 group-hover:to-orange-300";
      default: return "text-rose-400 group-hover:from-rose-400 group-hover:to-pink-300";
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-sm font-semibold text-slate-400 font-mono text-[11px] tracking-widest uppercase">Securing environment...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white relative overflow-hidden">
        {/* Decorative background vectors */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl animate-pulse" />

        {/* Main glass card container */}
        <div className="w-full max-w-md transform rounded-3xl border border-white/10 bg-slate-950/40 p-10 text-center shadow-2xl backdrop-blur-xl transition duration-500 hover:scale-[1.01] animate-fade-in-up relative z-10">
          {/* Vault Brand Visual */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-xl shadow-indigo-500/20">
            <ShieldCheck className="h-8 w-8 text-white stroke-[2]" />
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white font-display">
            Personal Vault
          </h1>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed font-semibold">
            A secure client dashboard to add, edit, and view personal, financial, card, media, and other records synchronized in real-time inside your private Firestore Vault.
          </p>

          {/* Action Button: Continue with Google */}
          <div className="mt-10 space-y-4">
            <button
              id="btn-google-sign-in"
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await signInWithPopup(auth, googleProvider);
                } catch (err: any) {
                  console.error("Popup login failed", err);
                  setErrorMsg("Sign-in failed. Please ensure popups are enabled or open the applet in a new tab.");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full group relative flex items-center justify-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 py-4 px-6 text-sm font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.99] shadow-lg shadow-black/20 cursor-pointer"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.43 14.9.43 12 .43 7.35.43 3.37 3.1 1.34 7.02l3.87 3a6.97 6.97 0 016.79-5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.85-.08-1.66-.22-2.45H12v4.61h6.48a5.54 5.54 0 01-2.4 3.64v3.02h3.87c2.26-2.08 3.54-5.15 3.54-8.82z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.21 14.12A6.97 6.97 0 014.8 12c0-.74.13-1.46.36-2.12v-3a11.96 11.96 0 000 10.24l-3.87-3z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.57c3.24 0 5.95-1.07 7.93-2.92l-3.87-3.02c-1.08.73-2.46 1.15-4.06 1.15a6.97 6.97 0 01-6.79-4.96l-3.87 3a11.95 11.95 0 0010.66 6.75z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-rose-500/10 p-4 text-xs text-rose-300 border border-rose-500/20 text-left leading-normal animate-pulse">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-500/60" />
            <span>Multi-User Isolated Vault</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 min-h-screen font-sans text-white relative overflow-x-hidden selection:bg-indigo-600/50 selection:text-white flex flex-col" id="main-vault-root">
      
      {/* LAYER 1: ANIMATED BACKGROUND SYSTEM (CUSTOM SPECIFICATION) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" id="bg-layer">
        {/* Glow Orbs */}
        <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-indigo-505/20 bg-indigo-500 rounded-full blur-3xl opacity-15 animate-pulse"></div>
        <div className="absolute top-40 -left-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-15 animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute bottom-20 right-1/3 w-[500px] h-[500px] bg-purple-500 rounded-full blur-3xl opacity-10 animate-pulse" style={{ animationDelay: "2s" }}></div>
        {/* Floating Particles generated dynamically */}
        <div id="particles">
          {Array.from({ length: 20 }).map((_, i) => {
            const topVal = (Math.sin(i * 1489.17) * 50 + 50).toFixed(1);
            const leftVal = (Math.cos(i * 9283.43) * 50 + 50).toFixed(1);
            const speedVal = (6 + (i % 8) * 3.5).toFixed(1);
            const delayVal = ((i % 6) * 1.2).toFixed(1);
            return (
              <div
                key={i}
                className="particle"
                style={{
                  top: `${topVal}%`,
                  left: `${leftVal}%`,
                  animation: `float ${speedVal}s linear infinite`,
                  animationDelay: `${delayVal}s`
                }}
              />
            );
          })}
        </div>
      </div>

      {/* LAYER 2: INTERFACES & SCROLLING */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* 1. STICKY GLASS HEADER (CUSTOM SPECIFICATION 02) */}
        <header className="bg-white/5 backdrop-blur-2xl border-b border-white/10 shadow-2xl sticky top-0 z-40" id="global-header">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-row items-center justify-between gap-4">
            
            {/* Logo Brand */}
            <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setSelectedCategory(null)}>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-2xl text-white shadow-2xl shadow-indigo-500/50 transform hover:scale-105 transition-all duration-300">
                <ShieldCheck className="h-5.5 w-5.5 stroke-[2]" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white leading-none">
                  Vasu <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Vault</span>
                </h1>
                <p className="text-[10.5px] text-slate-400 font-bold tracking-wide mt-1 uppercase">
                  Personal Archive Manager
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              
              {/* User Profile */}
              {user && (
                <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl pl-2 pr-3.5 py-1 backdrop-blur-md">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || "User"} 
                      className="h-7 w-7 rounded-xl object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold text-xs uppercase">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-[11px] font-black text-white truncate max-w-[100px] leading-tight">
                      {user.displayName || "Secure Client"}
                    </p>
                    <p className="text-[9px] text-indigo-400 font-bold truncate max-w-[100px] leading-none mt-0.5 font-mono">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Sign Out Button */}
              {user && (
                <button
                  id="btn-sign-out"
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to lock and sign out of your vault session?")) {
                      await signOut(auth);
                    }
                  }}
                  className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 transition-all duration-200 cursor-pointer"
                  title="Lock and Sign Out"
                >
                  <Lock className="h-4.5 w-4.5" />
                </button>
              )}
              
              {/* Date pill from theme specs */}
              <div className="hidden lg:block text-xs font-black tracking-widest uppercase text-white/80 bg-white/10 backdrop-blur-sm px-4.5 py-2.5 rounded-full border border-white/25 transition cursor-default">
                {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>

              {/* Status Connections */}
              <div 
                id="live-status-connected"
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/35 px-4 py-1.5 text-[10px] font-black uppercase text-indigo-300"
                title="Google Firestore live cloud real-time connection."
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-450 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400"></span>
                </span>
                <span>Firestore Realtime</span>
              </div>
            </div>
          </div>
        </header>

        {/* 2. SUCCESS/ERROR GLOWING NOTIFICATIONS (07 TOAST NOTIFICATIONS RECIPES) */}
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-6 space-y-4 relative z-40" id="notification-zone">
          
          {successMsg && (
            <div className="flex items-center gap-4 px-6 py-4.5 rounded-2xl shadow-2xl border backdrop-blur-md bg-emerald-500/90 border-emerald-400 text-white animate-fade-in-up" id="success-toast-banner">
              <div className="p-2 rounded-full bg-white/20 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-sm tracking-wide">Submission Success</h4>
                <p className="text-xs opacity-90 mt-0.5">{successMsg}</p>
              </div>
              <button 
                onClick={() => setSuccessMsg("")} 
                className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-4 p-5 rounded-2xl shadow-2xl border backdrop-blur-md bg-red-500/95 border-red-400 text-white animate-fade-in-up md:p-6" id="error-toast-banner">
              <div className="p-2 rounded-full bg-white/20 shrink-0 mt-0.5">
                <AlertCircle className="h-5 w-5 text-white animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-sm tracking-wide">Sync Interrupted</h4>
                <p className="text-xs opacity-90 mt-1 bg-black/20 rounded-xl p-3 border border-white/5 font-mono select-text" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {errorMsg}
                </p>
              </div>
              <button
                onClick={() => setErrorMsg("")}
                className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* 3. MAIN WORKSPACE CONTENT */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-6 mb-12 relative z-30">
          
          {!selectedCategory ? (
            
            /* VIEW A: LANDING CATEGORIES GRID (BENTO GLASS CARD STYLE) */
            <div className="space-y-8 animate-fade-in-up" id="dashboard-categories-view">

              {/* Custom Bento Panel Title with color highlights */}
              <div>
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2.5">
                    <FileSpreadsheet className="h-4.5 w-4.5 text-slate-500" />
                    Active Database Vault Schemas
                  </h3>
                  <span className="text-[10px] font-black uppercase text-white/80 bg-white/10 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/25">
                    {CATEGORIES.length} Active Schemas
                  </span>
                </div>

                {/* Categories Grid layout with beautiful card animations */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="categories-grid-container">
                  {CATEGORIES.map((category, index) => {
                    const IconComponent = IconMap[category.icon] || Database;
                    const recordCount = getRecordCount(category.sheetName);

                    return (
                      <div
                        key={category.id}
                        id={`category-card-${category.id}`}
                        onClick={() => {
                          setSelectedCategory(category);
                          setSearchQuery("");
                        }}
                        style={{
                          animationDelay: `${index * 80}ms`,
                          animation: 'fadeInUp 0.6s ease-out forwards',
                          opacity: 0
                        }}
                        className="group relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl cursor-pointer hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.015] flex flex-col justify-between"
                      >
                        {/* High fidelity top stripe gradient highlight (04 Info Card recipe) */}
                        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getCategoryStripeClass(category.id)}`} />

                        <div className="space-y-5">
                          {/* Top row */}
                          <div className="flex items-center justify-between">
                            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-white group-hover:bg-gradient-to-br transition-all duration-300 group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-indigo-500/30">
                              <IconComponent className="h-5.5 w-5.5 stroke-[2]" />
                            </div>
                            
                            {/* Record Count badge */}
                            <div className="bg-white/5 text-slate-300 text-xs font-black px-3 py-1 rounded-xl border border-white/10 hover:bg-white/10 transition flex items-center gap-1.5">
                              <span className="font-mono text-white font-black text-sm">{recordCount}</span>
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest leading-none">records</span>
                            </div>
                          </div>

                          {/* Titles */}
                          <div>
                            <h4 className={`text-base font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r ${getCategoryTextColors(category.id)} transition duration-300`}>
                              {category.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                              {category.description}
                            </p>
                          </div>
                        </div>

                        {/* Footer details */}
                        <div className="pt-4 mt-6 border-t border-white/5 flex items-center justify-between text-xs font-bold text-slate-500 group-hover:text-slate-350 transition duration-300">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Sheet: {category.sheetName}</span>
                          <span className="text-[11px] text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all duration-200 flex items-center gap-1">
                            Browse Rows &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>



            </div>
          ) : (
            
            /* VIEW B: CATEGORY DETAILS TABLE & RECORDS PANELS */
            <div className="space-y-6 animate-fade-in-up" id="sheet-detail-records-view">
              
              {/* breadcrumb row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <button
                    id="btn-back-breadcrumb"
                    onClick={() => setSelectedCategory(null)}
                    className="p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/20 text-slate-4 w-11 h-11 flex items-center justify-center transition cursor-pointer"
                    title="Back to Vault Dashboard"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-450 font-black uppercase tracking-widest font-mono">
                        Vault: {selectedCategory.sheetName}
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                      <span className={`text-[9px] font-black uppercase py-0.5 px-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30`}>
                        {isLive ? "Sync Active" : "Local Sandbox"}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white mt-1.5 flex items-center gap-2.5">
                      <span className="w-1.5 h-6 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full" />
                      {selectedCategory.title}
                    </h2>
                  </div>
                </div>

                {/* Recipe 06: Action Add-New-Record Buttons */}
                <div className="flex items-center gap-3 self-end md:self-auto">
                  <button
                    id="btn-add-record-top"
                    onClick={handleOpenAddForm}
                    className="group relative overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] border border-white/20 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 group-hover:scale-110" />
                    <div className="relative flex items-center justify-center gap-2 px-6 py-3.5 text-white font-black text-xs tracking-wider uppercase">
                      <Plus className="h-4.5 w-4.5" />
                      Add New Record
                    </div>
                  </button>
                </div>
              </div>

              {/* Glowing Search Bar + total stats panels (Recipe 03) */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-5 bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-2xl">
                
                {/* Search query container */}
                <div className="relative group w-full md:w-96 flex-1">
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20 group-focus-within:opacity-40 transition duration-500 animate-pulse"></div>
                  <div className="relative flex items-center p-1 bg-slate-950/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="search-records-input"
                      type="text"
                      placeholder={`Search in ${selectedCategory.title}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-transparent text-sm font-bold text-white placeholder:text-white/30 outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] uppercase font-black text-slate-350 hover:text-white hover:bg-white/10 px-2 py-1.5 rounded-lg transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-4 shrink-0">
                  <span>Total row logs: <b className="text-white font-mono text-sm">{getRecordCount(selectedCategory.sheetName)}</b></span>
                  {searchQuery && (
                    <>
                      <span className="h-4 w-px bg-white/15" />
                      <span>Search Matches: <b className="text-indigo-400 font-mono text-sm">{getFilteredRecords().length}</b></span>
                    </>
                  )}
                </div>
              </div>

              {/* Database Query Progress Spinner */}
              {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-4" id="loading-spinner-box">
                  <div className="relative flex h-12 w-12 items-center justify-center">
                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500/20 opacity-75"></div>
                    <div className="relative inline-flex rounded-full h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center shadow-lg shadow-indigo-500/50">
                      <RefreshCw className="h-5 w-5 text-white animate-spin" />
                    </div>
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Loading spreadsheet data rows...</p>
                </div>
              ) : (
                
                /* Main rows lists grid */
                <div className="space-y-6">
                  {getFilteredRecords().length === 0 ? (
                    
                    /* Empty State Recipe */
                    <div className="border-2 border-dashed border-white/10 bg-white/5 rounded-3xl py-14 px-6 text-center max-w-md mx-auto relative overflow-hidden backdrop-blur-md" id="no-records-card">
                      <div className="h-12 w-12 bg-white/5 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <Search className="h-5 w-5" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">
                        {searchQuery ? "No matches found" : `Empty Vault Category`}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed font-medium">
                        {searchQuery ? "Check spelling keywords or clear search filter inputs." : "Initiate your persistent cloud database by adding your first row."}
                      </p>
                      <div className="mt-5">
                        {searchQuery ? (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="text-xs font-black uppercase tracking-wider bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 px-4 py-2 rounded-xl transition"
                          >
                            Clear Query
                          </button>
                        ) : (
                          <button
                            onClick={handleOpenAddForm}
                            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl transition cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                            Add First Record Row
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    
                    /* STAGGERED ANIMATIONS RENDER GRID */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="records-grid-container">
                      
                      {/* Dynamic lists mapping */}
                      {getFilteredRecords().map((record, index) => (
                        <div 
                          key={record._rowNum || Math.random()}
                          style={{
                            animationDelay: `${index * 60}ms`,
                            animation: 'fadeInUp 0.6s ease-out forwards',
                            opacity: 0
                          }}
                        >
                          <RecordItemCard
                            category={selectedCategory}
                            record={record}
                            onEdit={handleOpenEditForm}
                            onDelete={handleDeleteRecord}
                          />
                        </div>
                      ))}

                      {/* Interactive block append trigger (05 Cards Grid Recipe) */}
                      <div 
                        onClick={handleOpenAddForm}
                        className="border-2 border-dashed border-white/10 hover:border-indigo-400/55 hover:bg-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] bg-white/5 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group relative overflow-hidden backdrop-blur-md"
                        id="card-append-placeholder"
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition duration-350 pointer-events-none" />
                        <div className="p-3 bg-white/5 rounded-full text-slate-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 border border-white/5">
                          <Plus className="h-5 w-5" />
                        </div>
                        <h4 className="text-[11px] font-black text-slate-400 mt-4 uppercase tracking-widest group-hover:text-white transition duration-200">
                          Add record row
                        </h4>
                        <p className="text-xs text-slate-500 max-w-[200px] mt-1.5 leading-relaxed font-semibold">
                          Appends a new secure data row strictly into Category "{selectedCategory.title}"
                        </p>
                      </div>

                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>



        {/* 5. FORM MODAL OVERLAYS */}
        {selectedCategory && (
          <CardFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            category={selectedCategory}
            initialData={activeEditingRecord}
            onSave={handleSaveRecord}
            isSaving={isSaving}
          />
        )}

      </div>
    </div>
  );
}
