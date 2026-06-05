import React, { useState } from "react";
import { 
  Copy, Check, Eye, EyeOff, Edit2, Trash2, X,
  User, CreditCard, Landmark, Mail, Lock, FileText, Phone, Calendar,
  Download, Share2
} from "lucide-react";
import { CategorySchema, formatExpiryToMMYY, formatCardNumber } from "../types";

interface RecordItemCardProps {
  key?: any;
  category: CategorySchema;
  record: Record<string, any>;
  onEdit: (record: Record<string, any>) => void;
  onDelete: (rowNum: number) => any;
}

export default function RecordItemCard({
  category,
  record,
  onEdit,
  onDelete
}: RecordItemCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealSecrets, setRevealSecrets] = useState<Record<string, boolean>>({});

  const triggerCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const toggleSecret = (key: string) => {
    setRevealSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const rowNum = record._rowNum || 0;

  // Render visual color stripe based on category ID
  const getCategoryStripeClass = (catId: string) => {
    switch (catId) {
      case "personal": return "from-blue-400 to-indigo-600";
      case "financial": return "from-emerald-400 to-teal-600";
      case "card": return "from-cyan-400 to-blue-500";
      case "media": return "from-amber-400 to-orange-600";
      case "documents": return "from-purple-400 to-fuchsia-600";
      default: return "from-rose-400 to-pink-600";
    }
  };

  // Render custom layout per category
  if (category.id === "personal") {
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(record.Name || "User")}`;
    
    return (
      <div 
        id={`record-personal-${rowNum}`}
        className="relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between group"
      >
        {/* Visual Stripe from Custom Spec */}
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getCategoryStripeClass(category.id)}`} />

        <div>
          {/* Header */}
          <div className="flex items-center gap-4.5 pb-4 border-b border-white/5">
            <img 
              src={avatarUrl} 
              alt={record.Name} 
              referrerPolicy="no-referrer"
              className="h-12 w-12 rounded-full object-cover bg-white/15 ring-2 ring-white/10 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(record.Name || "User")}`;
              }}
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-black text-white truncate" title={record.Name}>
                {record.Name || "No Name Given"}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>DOB: {record.DOB ? record.DOB : "Not set"}</span>
              </div>
            </div>
          </div>

          {/* Quick Info Block */}
          <div className="mt-5 space-y-3.5">
            {/* Identity Papers */}
            {record.EpicNumber && (
              <div className="flex items-center justify-between text-xs bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition">
                <span className="text-slate-400 font-bold">EPIC Number:</span>
                <span className="font-mono text-white flex items-center gap-2 uppercase font-black">
                  {String(record.EpicNumber).toUpperCase()}
                  <button 
                    onClick={() => triggerCopy(String(record.EpicNumber).toUpperCase(), "epic")}
                    className="p-1 hover:bg-white/15 rounded-lg transition text-slate-400 lg:hover:text-white"
                  >
                    {copiedKey === "epic" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </span>
              </div>
            )}

            {record.AdharNumber && (
              <div className="flex items-center justify-between text-xs bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition">
                <span className="text-slate-400 font-bold">Aadhaar:</span>
                <span className="font-mono text-white flex items-center gap-2">
                  {record.AdharNumber}
                  <button 
                    onClick={() => triggerCopy(record.AdharNumber, "adhar")}
                    className="p-1 hover:bg-white/15 rounded-lg transition text-slate-400 lg:hover:text-white"
                  >
                    {copiedKey === "adhar" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </span>
              </div>
            )}

            {record.PanNumber && (
              <div className="flex items-center justify-between text-xs bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition">
                <span className="text-slate-400 font-bold">PAN:</span>
                <span className="font-mono text-white flex items-center gap-2 uppercase font-black">
                  {String(record.PanNumber).toUpperCase()}
                  <button 
                    onClick={() => triggerCopy(String(record.PanNumber).toUpperCase(), "pan")}
                    className="p-1 hover:bg-white/15 rounded-lg transition text-slate-400 lg:hover:text-white"
                  >
                    {copiedKey === "pan" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </span>
              </div>
            )}

            {record.DrivingLicence && (
              <div className="flex items-center justify-between text-xs bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/10 transition">
                <span className="text-slate-400 font-bold">DL:</span>
                <span className="font-mono text-white flex items-center gap-2">
                  {record.DrivingLicence}
                  <button 
                    onClick={() => triggerCopy(record.DrivingLicence, "dl")}
                    className="p-1 hover:bg-white/15 rounded-lg transition text-slate-400 lg:hover:text-white"
                  >
                    {copiedKey === "dl" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </span>
              </div>
            )}

            {/* Comm Lines */}
            <div className="grid grid-cols-1 gap-2.5 pt-2 text-xs">
              {record.MobileNumber && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-slate-400 flex items-center gap-1.5"><Phone className="h-4 w-4 text-slate-500" /> Main</span>
                  <span className="text-white font-bold flex items-center gap-2">
                    {record.MobileNumber}
                    <button 
                      onClick={() => triggerCopy(record.MobileNumber, "mob")}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      {copiedKey === "mob" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </span>
                </div>
              )}

              {record.AlternateMobileNumber && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-slate-400 flex items-center gap-1.5"><Phone className="h-4 w-4 text-slate-500" /> Alternate</span>
                  <span className="text-white font-bold flex items-center gap-2">
                    {record.AlternateMobileNumber}
                    <button 
                      onClick={() => triggerCopy(record.AlternateMobileNumber, "altmob")}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      {copiedKey === "altmob" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </span>
                </div>
              )}

              {record.EmailID && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-slate-400 flex items-center gap-1.5"><Mail className="h-4 w-4 text-slate-500" /> Email</span>
                  <span className="text-white truncate font-bold flex items-center gap-2 max-w-[150px]">
                    <span className="truncate">{record.EmailID}</span>
                    <button 
                      onClick={() => triggerCopy(record.EmailID, "email")}
                      className="text-slate-400 hover:text-white p-0.5 flex-shrink-0"
                    >
                      {copiedKey === "email" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-white/5 text-xs">
          <button
            onClick={() => onEdit(record)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition duration-200 cursor-pointer border border-white/5"
          >
            <Edit2 className="h-3.5 w-3.5 text-indigo-400" />
            Edit
          </button>
          <button
            onClick={() => onDelete(rowNum)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-300 font-bold transition duration-200 cursor-pointer border border-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    );
  }

  if (category.id === "financial") {
    const isPassVisible = revealSecrets["pwd"];
    return (
      <div 
        id={`record-financial-${rowNum}`}
        className="relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between group"
      >
        {/* Visual Stripe */}
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getCategoryStripeClass(category.id)}`} />

        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-3.5 border-b border-white/5">
            <div>
              <div className="flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-emerald-400" />
                <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">
                  {record.BankName || "Bank Account"}
                </span>
              </div>
              <h4 className="text-base font-black text-white mt-1.5">
                {record.AccountHolderName}
              </h4>
            </div>
            {/* Custom Pill Badge format */}
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-lg shadow-emerald-500/10">
              {record.AccountType || "Savings"}
            </span>
          </div>

          {/* Account Numbers and IFSC */}
          <div className="mt-5 space-y-3.5 text-xs">
            {record.AccountNumber && (
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1.5 hover:bg-white/10 transition">
                <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">Account Number</div>
                <div className="font-mono text-sm text-white font-black flex items-center justify-between">
                  <span>{record.AccountNumber}</span>
                  <button 
                    onClick={() => triggerCopy(record.AccountNumber, "acc_num")}
                    className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                  >
                    {copiedKey === "acc_num" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5">
              {record.IFSC && (
                <div className="p-3 border border-white/5 bg-white/5 rounded-2xl">
                  <div className="text-[9px] uppercase font-black text-slate-400">IFSC Code</div>
                  <div className="font-mono text-xs text-white font-black flex items-center justify-between mt-1.5">
                    <span className="truncate">{record.IFSC}</span>
                    <button 
                      onClick={() => triggerCopy(record.IFSC, "ifsc")}
                      className="text-slate-400 hover:text-white p-0.5 shrink-0"
                    >
                      {copiedKey === "ifsc" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {record.UserID && (
                <div className="p-3 border border-white/5 bg-white/5 rounded-2xl">
                  <div className="text-[9px] uppercase font-black text-slate-400">Net ID</div>
                  <div className="font-mono text-xs text-white font-black flex items-center justify-between mt-1.5">
                    <span className="truncate max-w-[64px]" title={record.UserID}>{record.UserID}</span>
                    <button 
                      onClick={() => triggerCopy(record.UserID, "uid")}
                      className="text-slate-400 hover:text-white p-0.5 shrink-0"
                    >
                      {copiedKey === "uid" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Password Field */}
            {record.Password && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-slate-400 font-bold">Password:</span>
                <span className="font-mono text-white flex items-center gap-1.5">
                  <span className="font-black">{isPassVisible ? record.Password : "••••••••"}</span>
                  <button 
                    onClick={() => toggleSecret("pwd")} 
                    className="p-1 hover:text-white text-slate-400 rounded-lg hover:bg-white/5 transition"
                  >
                    {isPassVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button 
                    onClick={() => triggerCopy(record.Password, "pwd_copy")}
                    className="p-1 hover:text-white text-slate-400 rounded-lg hover:bg-white/5 transition"
                  >
                    {copiedKey === "pwd_copy" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </span>
              </div>
            )}

            {record.CustomerID && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-slate-400 font-bold">Customer ID:</span>
                <span className="font-mono text-white flex items-center gap-1.5">
                  <span className="font-black">{record.CustomerID}</span>
                  <button 
                    onClick={() => triggerCopy(record.CustomerID, "cust_id")}
                    className="p-1 hover:text-white text-slate-400 rounded-lg hover:bg-white/5 transition"
                  >
                    {copiedKey === "cust_id" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </span>
              </div>
            )}

            {record.ProfilePassword && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-slate-400 font-bold">Profile PW:</span>
                <span className="font-mono text-white flex items-center gap-1.5">
                  <span className="font-black">{revealSecrets["prof_pwd"] ? record.ProfilePassword : "••••••••"}</span>
                  <button 
                    onClick={() => toggleSecret("prof_pwd")} 
                    className="p-1 hover:text-white text-slate-400 rounded-lg hover:bg-white/5 transition"
                  >
                    {revealSecrets["prof_pwd"] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button 
                    onClick={() => triggerCopy(record.ProfilePassword, "prof_pwd_copy")}
                    className="p-1 hover:text-white text-slate-400 rounded-lg hover:bg-white/5 transition"
                  >
                    {copiedKey === "prof_pwd_copy" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </span>
              </div>
            )}

            {/* Other details */}
            {(record.LinkedMobileNumber || record.LinkedEmail) && (
              <div className="pt-2.5 border-t border-white/5 space-y-1 text-slate-400 hover:text-slate-350 transition">
                {record.LinkedMobileNumber && (
                  <div className="flex justify-between">
                    <span className="font-medium">Linked Mobile:</span>
                    <span className="font-bold text-white">{record.LinkedMobileNumber}</span>
                  </div>
                )}
                {record.LinkedEmail && (
                  <div className="flex justify-between">
                    <span className="font-medium">Linked Email:</span>
                    <span className="font-bold text-white truncate max-w-[150px]">{record.LinkedEmail}</span>
                  </div>
                )}
              </div>
            )}

            {record.SecurityAnswers && (
              <div className="text-[10px] text-slate-400 bg-white/5 p-3 rounded-2xl border border-white/5 mt-1.5 italic leading-relaxed">
                <span className="font-bold font-sans text-slate-300">Q&A:</span> {record.SecurityAnswers}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-white/5 text-xs">
          <button
            onClick={() => onEdit(record)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition duration-200 cursor-pointer border border-white/5"
          >
            <Edit2 className="h-3.5 w-3.5 text-indigo-400" />
            Edit
          </button>
          <button
            onClick={() => onDelete(rowNum)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-300 font-bold transition duration-200 cursor-pointer border border-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    );
  }

  if (category.id === "card") {
    const isCVVVisible = revealSecrets["cvv"];
    const isPinVisible = revealSecrets["pin"];

    // Stylize credit card layout dynamically with stunning dark gradients
    let cardGradient = "from-slate-800 to-slate-950 text-white border-white/15 shadow-indigo-505/20";
    if (record.CardType === "Visa") {
      cardGradient = "from-blue-700 via-indigo-900 to-slate-950 text-blue-50 border-blue-500/20 shadow-blue-500/20";
    } else if (record.CardType === "Mastercard") {
      cardGradient = "from-rose-700 via-amber-900 to-slate-950 text-amber-50 border-rose-500/20 shadow-rose-500/20";
    } else if (record.CardType === "Amex") {
      cardGradient = "from-teal-600 via-emerald-900 to-slate-950 text-teal-50 border-teal-500/20 shadow-teal-500/20";
    }

    return (
      <div 
        id={`record-card-${rowNum}`}
        className="relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between group"
      >
        {/* Visual Stripe */}
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getCategoryStripeClass(category.id)}`} />

        <div>
          {/* Card Plastic Layout */}
          <div className={`rounded-2xl bg-gradient-to-br ${cardGradient} p-5 border shadow-xl relative overflow-hidden transition duration-300 hover:scale-[1.02]`}>
            {/* Background vector accents */}
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/[0.04] rounded-l-full pointer-events-none" />

            {/* Card Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest opacity-80">
                  {record.IssuedBank || "Global Card"}
                </p>
                <div className="h-5 w-7 bg-yellow-400/20 border border-yellow-400/40 rounded-lg mt-2 flex items-center justify-center opacity-95">
                  <span className="text-[7px] text-yellow-300 font-mono leading-none">█</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-sm font-black tracking-widest italic py-0.5 px-3 rounded-full bg-white/10">
                  {record.CardType || "Card"}
                </span>
                {record["Debit/Credit"] && (
                  <span className="text-[9px] font-black tracking-widest uppercase py-0.5 px-2.5 rounded-md bg-white/15 border border-white/5 text-white/90">
                    {record["Debit/Credit"]}
                  </span>
                )}
              </div>
            </div>

            {/* Card Number */}
            <div className="my-6 flex items-center justify-between">
              <span className="font-mono text-base font-black tracking-widest text-white">
                {formatCardNumber(record.CardNumber) || "••••-••••-••••-••••"}
              </span>
              {record.CardNumber && (
                <button
                  type="button"
                  onClick={() => triggerCopy(formatCardNumber(record.CardNumber), "card_no")}
                  className="p-1 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition"
                >
                  {copiedKey === "card_no" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>

            {/* Card Footer Exp/CVV */}
            <div className="flex items-end justify-between text-xs pt-1">
              <div>
                <p className="text-[8px] uppercase font-black tracking-widest opacity-60">Card Holder</p>
                <p className="font-black tracking-wide uppercase truncate max-w-[150px] mt-0.5">
                  {record.CardHolderName || "CARDHOLDER NAME"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[8px] uppercase font-black tracking-widest opacity-60">Expires</p>
                  <p className="font-mono font-black mt-0.5">{formatExpiryToMMYY(record.Expiry)}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase font-black tracking-widest opacity-60">CVV</p>
                  <p className="font-mono font-black flex items-center gap-1.5 mt-0.5">
                    <span>{isCVVVisible ? record.CVV : "•••"}</span>
                    <button 
                      onClick={() => toggleSecret("cvv")} 
                      className="p-0.5 text-white/70 hover:text-white"
                    >
                      {isCVVVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pin codes details hidden below card */}
          {record.PIN && (
            <div className="mt-4 p-3.5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-500" />
                ATM / Transaction PIN:
              </span>
              <span className="font-mono font-bold text-white flex items-center gap-2">
                <span>{isPinVisible ? record.PIN : "••••"}</span>
                <button 
                  onClick={() => toggleSecret("pin")} 
                  className="p-1 hover:text-white text-slate-400 rounded-lg hover:bg-white/5 transition"
                >
                  {isPinVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button 
                  onClick={() => triggerCopy(record.PIN, "pin")}
                  className="p-1 hover:text-white text-slate-400 rounded-lg hover:bg-white/5 transition"
                >
                  {copiedKey === "pin" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-white/5 text-xs">
          <button
            onClick={() => onEdit(record)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition duration-200 cursor-pointer border border-white/5"
          >
            <Edit2 className="h-3.5 w-3.5 text-indigo-400" />
            Edit
          </button>
          <button
            onClick={() => onDelete(rowNum)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-300 font-bold transition duration-200 cursor-pointer border border-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    );
  }

  if (category.id === "documents") {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [sharedStatus, setSharedStatus] = useState<string | null>(null);

    const isImage = record.FileAttachment && (record.FileAttachment.startsWith("data:image/") || record.FileAttachment.startsWith("data:image/svg"));
    const isPdf = record.FileAttachment && record.FileAttachment.startsWith("data:application/pdf");

    const handleDownload = () => {
      if (!record.FileAttachment) return;
      const link = document.createElement("a");
      link.href = record.FileAttachment;
      
      let ext = "jpg";
      if (record.FileAttachment.includes("pdf")) ext = "pdf";
      else if (record.FileAttachment.includes("png")) ext = "png";
      else if (record.FileAttachment.includes("svg")) ext = "svg";
      
      const sanitizedTitle = (record.Title || "document").replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${sanitizedTitle}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleShare = async () => {
      if (!record.FileAttachment) return;
      
      let ext = "jpg";
      if (record.FileAttachment.includes("pdf")) ext = "pdf";
      else if (record.FileAttachment.includes("png")) ext = "png";
      
      const sanitizedTitle = (record.Title || "Document").replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${sanitizedTitle}.${ext}`;
      const shareText = `Vasu Vault Secure Document:\nTitle: ${record.Title || "Untitled"}\nType: ${record.DocType || "Document"}\nDoc Number: ${record.DocNumber || "N/A"}`;

      if (navigator.share) {
        try {
          const dataUrl = record.FileAttachment;
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], fileName, { type: blob.type });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: record.Title || "Secure Document",
              text: shareText,
            });
            setSharedStatus("Shared!");
            setTimeout(() => setSharedStatus(null), 2000);
            return;
          } else {
            await navigator.share({
              title: record.Title || "Secure Document",
              text: shareText,
            });
            setSharedStatus("Shared!");
            setTimeout(() => setSharedStatus(null), 2000);
            return;
          }
        } catch (err) {
          console.log("Web Share silent abort:", err);
        }
      }

      // Clipboard fallback
      try {
        await navigator.clipboard.writeText(`${shareText}\n\n[Attachment Data]\n${record.FileAttachment}`);
        setSharedStatus("Copied!");
        setTimeout(() => setSharedStatus(null), 2000);
      } catch (err) {
        console.error("Clipboard write failure:", err);
        setSharedStatus("Failed Copy");
        setTimeout(() => setSharedStatus(null), 2000);
      }
    };

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    return (
      <div 
        id={`record-documents-${rowNum}`}
        className="relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 hover:shadow-2xl hover:shadow-purple-500/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between group"
      >
        {/* Visual Stripe */}
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getCategoryStripeClass(category.id)}`} />

        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-3.5 border-b border-white/5">
            <div>
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-purple-400" />
                <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">
                  {record.DocType || "Document"}
                </span>
              </div>
              <h4 className="text-base font-black text-white mt-1.5 truncate max-w-[190px]" title={record.Title}>
                {record.Title || "Untitled Document"}
              </h4>
            </div>
            
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-400/30">
              Vault Sealed
            </span>
          </div>

          {/* Doc ID Number */}
          {record.DocNumber && (
            <div className="mt-4 flex items-center justify-between text-xs bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-slate-400 font-bold">Doc ID / Reference:</span>
              <span className="font-mono text-white flex items-center gap-2">
                <span className="font-bold">{record.DocNumber}</span>
                <button 
                  onClick={() => triggerCopy(record.DocNumber, "docNum")}
                  className="p-1 hover:bg-white/15 rounded-lg transition text-slate-400 lg:hover:text-white"
                >
                  {copiedKey === "docNum" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </span>
            </div>
          )}

          {/* PDF or Image file preview */}
          {record.FileAttachment && (
            <div className="mt-4">
              {isImage ? (
                <div 
                  onClick={() => setIsPreviewOpen(true)}
                  className="relative group/preview overflow-hidden rounded-2xl border border-white/5 bg-slate-950/50 h-36 flex items-center justify-center transition hover:border-purple-500/30 cursor-pointer"
                >
                  <img 
                    src={record.FileAttachment} 
                    alt={record.Title} 
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain p-2 transition duration-500 group-hover/preview:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition duration-300">
                    <span className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/30">
                      <Eye className="h-3.5 w-3.5" />
                      View Full Document
                    </span>
                  </div>
                </div>
              ) : isPdf ? (
                <div 
                  onClick={() => setIsPreviewOpen(true)}
                  className="cursor-pointer border border-white/5 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/20 rounded-2xl p-4 flex items-center gap-3.5 transition group/pdf"
                >
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/20 text-rose-300">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0 font-sans">
                    <p className="text-xs font-black text-slate-200">PDF Document</p>
                    <p className="text-[10px] text-purple-400 font-bold mt-1 group-hover/pdf:text-purple-300 transition">Click to Open Secure PDF</p>
                  </div>
                  <div className="p-1 rounded-lg bg-white/5 text-slate-400 group-hover/pdf:text-white transition">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
              ) : (
                <div className="border border-white/5 bg-white/5 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <FileText className="h-5 w-5 text-purple-400 shrink-0" />
                  <span className="truncate">Data URL Length: {formatBytes(record.FileAttachment.length)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between pt-4 mt-6 border-t border-white/5 text-xs text-slate-350">
          <div className="flex items-center gap-2">
            {record.FileAttachment && (
              <>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/10 transition cursor-pointer"
                  title="Download File"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/10 transition cursor-pointer"
                  title="Share File"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{sharedStatus || "Share"}</span>
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => onEdit(record)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition duration-200 cursor-pointer border border-white/5"
            >
              <Edit2 className="h-3.5 w-3.5 text-purple-400" />
              Edit
            </button>
            <button
              onClick={() => onDelete(rowNum)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-300 font-bold transition duration-200 cursor-pointer border border-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>

        {/* Lightbox Modal */}
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl transition duration-300">
            {/* Overlay click to exit */}
            <div className="absolute inset-0 cursor-zoom-out" onClick={() => setIsPreviewOpen(false)} />
            
            <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">
                    {record.DocType || "Digital Locker Document"}
                  </span>
                  <h4 className="text-base font-black text-white mt-1">
                    {record.Title || "Attached Document"}
                  </h4>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Action Panel */}
              <div className="px-6 py-3.5 bg-slate-950/40 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between text-xs">
                <div className="text-slate-400 font-mono">
                  {record.DocNumber ? `Reference: ${record.DocNumber}` : "Vault Sealed Digital Scan"}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-550 font-black text-white rounded-xl shadow-lg shadow-purple-500/20 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download File
                  </button>
                  <button
                    onClick={handleShare}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-705 font-black text-slate-200 border border-white/5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {sharedStatus || "Share"}
                  </button>
                </div>
              </div>

              {/* Viewer Area */}
              <div className="flex-1 bg-slate-950/80 p-6 flex items-center justify-center overflow-auto min-h-[50vh]">
                {isPdf ? (
                  <iframe 
                    src={record.FileAttachment} 
                    className="w-full h-[60vh] rounded-2xl border border-white/10 bg-white" 
                    title={record.Title}
                  />
                ) : (
                  <img 
                    src={record.FileAttachment} 
                    alt={record.Title} 
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-[60vh] rounded-2xl object-contain shadow-2xl bg-black/40 p-1"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Handle generic Media/Gmail or Others log credentials Layout
  const isPassVisible = revealSecrets["pwd"];
  return (
    <div 
      id={`record-general-${rowNum}`}
      className="relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-between group"
    >
      {/* Visual Stripe */}
      <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getCategoryStripeClass(category.id)}`} />

      <div>
        {/* Header Title */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/90">
              {category.id === "media" ? <Mail className="h-4.5 w-4.5" /> : <Lock className="h-4.5 w-4.5" />}
            </div>
            <h4 className="text-base font-black text-white truncate max-w-[180px]" title={record.Particulars}>
              {record.Particulars || "Unlabeled Account"}
            </h4>
          </div>
        </div>

        {/* Credentials body */}
        <div className="mt-5 space-y-4 text-xs">
          {/* UserID / Login */}
          {record.Userid && (
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Login / ID</span>
              <div className="font-mono text-white flex items-center justify-between font-black mt-0.5">
                <span className="truncate max-w-[180px]">{record.Userid}</span>
                <button 
                  onClick={() => triggerCopy(record.Userid, "uid")}
                  className="p-1 hover:bg-white/10 rounded-lg transition text-slate-400 hover:text-white"
                >
                  {copiedKey === "uid" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Password */}
          {record.Password && (
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Password</span>
              <div className="font-mono text-white flex items-center justify-between font-black mt-0.5">
                <span>{isPassVisible ? record.Password : "••••••••"}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => toggleSecret("pwd")} 
                    className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
                  >
                    {isPassVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button 
                    onClick={() => triggerCopy(record.Password, "pwd_copy")}
                    className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-emerald-400 transition"
                  >
                    {copiedKey === "pwd_copy" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recovery mobile details */}
          {record.MobileNumber && (
            <div className="flex items-center justify-between p-1.5 text-slate-400 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Phone className="h-4 w-4" /> Recovery Mobile:
              </span>
              <span className="font-mono text-white font-black">{record.MobileNumber}</span>
            </div>
          )}

          {/* Recovery Email details */}
          {record.RecoveryMail && (
            <div className="flex items-center justify-between p-1.5 text-slate-400 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Mail className="h-4 w-4" /> Recovery Email:
              </span>
              <span className="font-mono text-white font-black flex items-center gap-1">
                <span className="truncate max-w-[140px]" title={record.RecoveryMail}>{record.RecoveryMail}</span>
                <button 
                  onClick={() => triggerCopy(record.RecoveryMail, "recoverymail")}
                  className="p-1 hover:bg-white/10 rounded-lg transition text-slate-400 hover:text-white"
                >
                  {copiedKey === "recoverymail" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </span>
            </div>
          )}

          {/* Others special notes/remarks */}
          {category.id === "others" && record.Remarks && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/10 rounded-2xl text-xs italic text-rose-300 leading-relaxed">
              {record.Remarks}
            </div>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-white/5 text-xs text-slate-300">
        <button
          onClick={() => onEdit(record)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition duration-200 cursor-pointer border border-white/5"
        >
          <Edit2 className="h-3.5 w-3.5 text-indigo-400" />
          Edit
        </button>
        <button
          onClick={() => onDelete(rowNum)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-300 font-bold transition duration-200 cursor-pointer border border-red-500/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}
