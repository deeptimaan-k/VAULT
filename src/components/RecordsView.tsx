import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Inbox, Database } from "lucide-react";
import { CategorySchema } from "../types";
import RecordItemCard from "./RecordItemCard";

interface Props {
  category: CategorySchema;
  records: any[];
  searchQuery: string;
  onAdd: () => void;
  onEdit: (record: any) => void;
  onDelete: (record: any) => void;
}

export default function RecordsView({ category, records, searchQuery, onAdd, onEdit, onDelete }: Props) {
  const filtered = records.filter(r =>
    !searchQuery ||
    Object.values(r).some(v =>
      v && String(v).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Section header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ margin: 0, marginBottom: 6, fontSize: 10, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(100,116,139,0.5)" }}>
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"} {searchQuery ? "found" : "total"}
        </p>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>{category.title}</h2>
      </div>

      {/* Empty state */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="h-20 w-20 rounded-3xl flex items-center justify-center mb-6"
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.15)",
                boxShadow: "0 0 40px rgba(124,58,237,0.08)",
              }}>
              {searchQuery
                ? <Search className="h-9 w-9 text-slate-600" />
                : <Inbox className="h-9 w-9 text-slate-600" />}
            </div>
            <h3 className="text-lg font-black text-white mb-2">
              {searchQuery ? "No results found" : "This vault is empty"}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mb-6">
              {searchQuery
                ? `No records in "${category.title}" match "${searchQuery}"`
                : `Add your first ${category.title} record to get started`}
            </p>
            {!searchQuery && (
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 8px 32px rgba(124,58,237,0.6), inset 0 1px 0 rgba(255,255,255,0.25)" }}
                whileTap={{ scale: 0.96 }}
                onClick={onAdd}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 22px", borderRadius: 12, cursor: "pointer",
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  border: "1px solid rgba(124,58,237,0.55)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
                  fontSize: 13, fontWeight: 900, color: "#fff",
                }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                Add First Record
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 20,
              alignItems: "stretch",
            }}
          >
            <AnimatePresence>
              {filtered.map((record, i) => (
                <motion.div
                  key={record._rowNum ?? i}
                  initial={{ opacity: 0, y: 24, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94, y: -12 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24, delay: i * 0.04 }}
                  style={{ height: "100%" }}
                >
                  <RecordItemCard
                    record={record}
                    category={category}
                    onEdit={() => onEdit(record)}
                    onDelete={() => onDelete(record)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
