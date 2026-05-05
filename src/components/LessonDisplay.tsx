import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, Copy, Check, Info, Share2, MessageCircle, Settings2, PenLine, Wand2, ArrowRightLeft, Expand } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import FeedbackModal from "./FeedbackModal";
import { aiEditContent } from "../services/geminiService";

interface LessonDisplayProps {
  content: string;
  topic?: string;
  onUpdateContent?: (newContent: string) => void;
}

export default function LessonDisplay({ content, topic, onUpdateContent }: LessonDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const pdfTargetRef = useRef<HTMLDivElement>(null);

  // --- AI Toolbar State ---
  const [selection, setSelection] = useState<{ text: string; top: number; left: number; width: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // --- PDF Export State ---
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportOrientation, setExportOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [excludedSections, setExcludedSections] = useState<Set<string>>(new Set());

  // Split content into sections for the PDF export selector
  const sections = useMemo(() => {
    if (!content) return [];
    // Split by Markdown heading level 3 (standard Gemini prompt format) or any heading. 
    // Wait, the prompt output uses ### for sections
    const parts = content.split(/^(?=### )/m);
    return parts.map((part, index) => {
      const match = part.match(/^###\s+([^\n]+)/);
      return {
        id: index.toString(),
        title: match ? match[1] : (index === 0 ? "Introduction" : "Unnamed Section"),
        content: part
      }
    });
  }, [content]);

  const filteredExportContent = useMemo(() => {
    return sections
      .filter(s => !excludedSections.has(s.id))
      .map(s => s.content)
      .join('\n\n');
  }, [sections, excludedSections]);

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || isEditing) {
        if (!isEditing) setSelection(null);
        return;
      }
      if (!contentRef.current?.contains(sel.anchorNode)) {
        setSelection(null);
        return;
      }
      
      const text = sel.toString().trim();
      if (!text || text.length < 5) {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const parentRect = contentRef.current.getBoundingClientRect();
      
      setSelection({
        text,
        top: rect.top - parentRect.top,
        left: rect.left - parentRect.left,
        width: rect.width
      });
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [isEditing]);

  const handleAIEdit = async (instruction: 'REPHRASE' | 'SIMPLIFY' | 'EXPAND') => {
    if (!selection) return;
    setIsEditing(true);
    try {
      const newText = await aiEditContent(selection.text, instruction);
      // Ensure we have access to onUpdateContent, otherwise we just alert
      if (onUpdateContent) {
        if (content.includes(selection.text)) {
          const newContent = content.replace(selection.text, newText);
          onUpdateContent(newContent);
        } else {
          alert("Could not automatically replace text verbatim due to Markdown formatting. Try selecting unformatted text.");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Failed to edit content.");
    } finally {
      setIsEditing(false);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    // In a real app, this would be a link to the shared Firestore doc
    const dummyUrl = window.location.href + "?shared=" + Date.now();
    navigator.clipboard.writeText(dummyUrl);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleExportPDF = () => {
    setIsExportModalOpen(true);
  };

  const executePDFExport = () => {
    if (!pdfTargetRef.current) return;
    
    const element = pdfTargetRef.current;
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.display = 'block';
    clone.style.width = '100%';
    
    const printContainer = document.createElement('div');
    printContainer.id = 'print-export-container';
    printContainer.appendChild(clone);
    document.body.appendChild(printContainer);
    
    const style = document.createElement('style');
    style.id = 'print-export-style';
    style.innerHTML = `
      @media screen {
        #print-export-container { display: none !important; }
      }
      @media print {
        body > *:not(#print-export-container) { display: none !important; }
        #print-export-container { display: block !important; }
        @page { size: ${exportOrientation}; margin: 0.75in; }
      }
    `;
    document.head.appendChild(style);
    
    const originalTitle = document.title;
    document.title = `LessonPlan_${topic?.replace(/\s+/g, '_') || 'DepEd'}`;
    
    const cleanup = () => {
      document.title = originalTitle;
      if (document.getElementById('print-export-container')) {
        document.body.removeChild(printContainer);
      }
      if (document.getElementById('print-export-style')) {
        document.head.removeChild(style);
      }
      setIsExportModalOpen(false);
      window.removeEventListener('afterprint', cleanup);
    };
    
    window.addEventListener('afterprint', cleanup);
    
    // Trigger print
    window.print();
    
    // Fallback cleanup in case afterprint fails on some older browsers, 
    // but we use 2 seconds to make sure print dialog had time to open.
    // Actually modern browsers reliably fire afterprint.
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto mb-20"
    >
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden print:border-none print:shadow-none">
        {/* Header/Controls */}
        <div className="bg-slate-50/80 px-8 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <Info size={14} />
            Output: Human-AI Collaboration
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-sm font-medium"
            >
              {shared ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
              {shared ? "Link Copied" : "Share"}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-sm font-medium"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              {copied ? "Copy text" : "Copy"}
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all text-sm font-bold"
            >
              <Download size={16} />
              Export as PDF
            </button>
          </div>
        </div>

        <div className="p-8 md:p-12 print:p-0 relative" ref={contentRef}>
          {/* AI Editing Toolbar */}
          <AnimatePresence>
            {selection && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute z-50 bg-slate-900 text-white rounded-xl shadow-2xl overflow-hidden flex items-center border border-slate-700/50"
                style={{ 
                  top: `${Math.max(0, selection.top - 60)}px`, 
                  left: `${selection.left + (selection.width / 2)}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                {isEditing ? (
                  <div className="px-4 py-2 flex items-center gap-2 text-sm font-medium">
                    <Wand2 size={16} className="animate-spin text-amber-300" />
                    AI is writing...
                  </div>
                ) : (
                  <>
                    <button onClick={() => handleAIEdit('REPHRASE')} className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-800 transition-colors text-sm font-medium border-r border-slate-700/50">
                      <ArrowRightLeft size={14} className="text-blue-300" /> Rephrase
                    </button>
                    <button onClick={() => handleAIEdit('SIMPLIFY')} className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-800 transition-colors text-sm font-medium border-r border-slate-700/50">
                      <PenLine size={14} className="text-emerald-300" /> Simplify
                    </button>
                    <button onClick={() => handleAIEdit('EXPAND')} className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-800 transition-colors text-sm font-medium">
                      <Expand size={14} className="text-indigo-300" /> Expand
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-12 py-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 print:hidden">
          <p className="text-slate-400 text-sm italic">
            "Better teaching decisions, powered by responsible technology."
          </p>
          <button 
            onClick={() => setIsFeedbackOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all text-sm font-medium"
          >
            <MessageCircle size={18} />
            Give Feedback
          </button>
        </div>
      </div>

      {/* Hidden Render Target for PDF */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div 
           ref={pdfTargetRef} 
           className="markdown-body p-8 md:p-12 bg-white" 
           style={{ 
               width: exportOrientation === 'landscape' ? '1056px' : '816px',
               display: 'none' 
           }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{filteredExportContent}</ReactMarkdown>
        </div>
      </div>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      {/* PDF Export Settings Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExportModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[2rem] shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <Settings2 className="text-indigo-600" />
                <h3 className="font-serif font-bold text-xl text-slate-800">Export Settings</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Page Orientation</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setExportOrientation('portrait')}
                      className={`py-3 px-4 rounded-xl border-2 transition-all font-medium text-sm flex flex-col items-center gap-2 ${exportOrientation === 'portrait' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}
                    >
                      <div className="w-6 h-8 border-2 border-current rounded-sm" />
                      Portrait
                    </button>
                    <button 
                      onClick={() => setExportOrientation('landscape')}
                      className={`py-3 px-4 rounded-xl border-2 transition-all font-medium text-sm flex flex-col items-center gap-2 ${exportOrientation === 'landscape' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}
                    >
                      <div className="w-8 h-6 border-2 border-current rounded-sm" />
                      Landscape
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Include Sections</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {sections.map(section => (
                      <label key={section.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={!excludedSections.has(section.id)}
                          onChange={(e) => {
                            const next = new Set(excludedSections);
                            if (e.target.checked) next.delete(section.id);
                            else next.add(section.id);
                            setExcludedSections(next);
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                        />
                        <span className="text-sm font-medium text-slate-700">{section.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executePDFExport}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
                >
                  <Download size={18} />
                  Print / Save PDF
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
