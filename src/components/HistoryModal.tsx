import { motion, AnimatePresence } from "motion/react";
import { X, Clock, ChevronRight, Trash2, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";

interface HistoryItem {
  id: string;
  grade: string;
  subject: string;
  topic: string;
  content: string;
  timestamp: number;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export default function HistoryModal({ isOpen, onClose, history, onSelectItem, onClearHistory }: HistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  const subjects = useMemo(() => {
    const subs = new Set(history.map(item => item.subject));
    return Array.from(subs).sort();
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      // 1. Search term (topic or subject)
      const matchesSearch = searchTerm === "" || 
        item.topic.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.subject.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Subject filter
      const matchesSubject = subjectFilter === "ALL" || item.subject === subjectFilter;
      
      // 3. Date filter
      let matchesDate = true;
      const now = Date.now();
      const msInDay = 24 * 60 * 60 * 1000;
      if (dateFilter === "7DAYS") {
        matchesDate = (now - item.timestamp) <= 7 * msInDay;
      } else if (dateFilter === "30DAYS") {
        matchesDate = (now - item.timestamp) <= 30 * msInDay;
      }

      return matchesSearch && matchesSubject && matchesDate;
    });
  }, [history, searchTerm, subjectFilter, dateFilter]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 font-serif font-bold text-xl text-slate-800">
                <Clock className="text-indigo-600" />
                Lesson History
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            {history.length > 0 && (
              <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex flex-col gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search topic or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-600"
                    >
                      <option value="ALL">All Subjects</option>
                      {subjects.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-600"
                  >
                    <option value="ALL">All Time</option>
                    <option value="7DAYS">Last 7 Days</option>
                    <option value="30DAYS">Last 30 Days</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-4">
                    <Clock size={32} />
                  </div>
                  <h4 className="text-slate-800 font-bold mb-1">No History Yet</h4>
                  <p className="text-slate-400 text-sm">
                    Generated lesson plans will appear here for easy access.
                  </p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm font-medium">
                  No lesson plans match your search criteria.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                          {item.grade}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-800 group-hover:text-indigo-900 line-clamp-1">
                        {item.topic}
                      </h5>
                      <p className="text-xs text-slate-500 mb-2">{item.subject}</p>
                      <div className="flex items-center text-indigo-600 text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                        View Plan <ChevronRight size={12} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="p-6 border-t border-slate-100">
                <button
                  onClick={onClearHistory}
                  className="w-full py-3 rounded-xl border border-red-100 text-red-500 text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                  Clear All History
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
