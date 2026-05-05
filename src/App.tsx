/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, History as HistoryIcon, Github, LogIn, LogOut } from "lucide-react";
import LessonForm from "./components/LessonForm";
import LessonDisplay from "./components/LessonDisplay";
import GenerationLoader from "./components/GenerationLoader";
import HistoryModal from "./components/HistoryModal";
import { generateLessonPlan } from "./services/geminiService";
import { LessonPlanRequest, HistoryItem } from "./types";
import { useAuth } from "./contexts/AuthContext";
import { collection, query, orderBy, onSnapshot, setDoc, doc, deleteDoc, getDocs, where } from "firebase/firestore";
import { db } from "./lib/firebase";

export default function App() {
  const { user, signInWithGoogle, logOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load history from Firestore when user changes
  useEffect(() => {
    if (!user) {
      const savedHistory = localStorage.getItem("guroai_history");
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to parse history", e);
        }
      } else {
        setHistory([]);
      }
      return;
    }

    // Migrate if any items in local storage
    const savedHistory = localStorage.getItem("guroai_history");
    if (savedHistory) {
      try {
        const localHistory: HistoryItem[] = JSON.parse(savedHistory);
        if (Array.isArray(localHistory) && localHistory.length > 0) {
          localHistory.forEach(item => {
            const id = Date.now().toString() + Math.random().toString(36).substring(7);
            const newItem: HistoryItem = {
              ...item,
              id,
              userId: user.uid,
              timestamp: item.timestamp || Date.now(),
            };
            setDoc(doc(db, "users", user.uid, "lessons", id), newItem).catch(console.error);
          });
        }
        localStorage.removeItem("guroai_history");
      } catch (e) {
        console.error("Failed to parse/migrate local history", e);
      }
    }

    const q = query(
      collection(db, "users", user.uid, "lessons"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lessons: HistoryItem[] = [];
      snapshot.forEach((doc) => {
        lessons.push(doc.data() as HistoryItem);
      });
      lessons.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(lessons);
    }, (error) => {
      console.error("Firestore Error: ", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleGenerate = async (data: LessonPlanRequest) => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    setCurrentTopic(data.topic);
    
    try {
      const output = await generateLessonPlan(data);
      setResult(output);
      
      const id = Date.now().toString();
      const newItem: HistoryItem = {
        ...data,
        id,
        userId: user ? user.uid : "guest",
        content: output,
        timestamp: Date.now(),
      };

      if (user) {
        await setDoc(doc(db, "users", user.uid, "lessons", id), newItem);
      } else {
        const newHistory = [newItem, ...history].slice(0, 20);
        setHistory(newHistory);
        localStorage.setItem("guroai_history", JSON.stringify(newHistory));
      }
      
      setTimeout(() => {
        document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      setError(`Failed to generate lesson plan: ${errorMsg}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setResult(item.content);
    setCurrentTopic(item.topic);
    setIsHistoryOpen(false);
    setTimeout(() => {
      document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear your lesson history?")) {
      if (user) {
        try {
          const q = query(collection(db, "users", user.uid, "lessons"), where("userId", "==", user.uid));
          const snapshot = await getDocs(q);
          const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, "users", user.uid, "lessons", document.id)));
          await Promise.all(deletePromises);
        } catch (err) {
          console.error("Error clearing history", err);
          alert("Failed to clear history.");
        }
      } else {
        setHistory([]);
        localStorage.removeItem("guroai_history");
      }
    }
  };

  return (
    <div className="min-h-screen pb-10 flex flex-col font-sans">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-serif font-bold text-xl text-indigo-900">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-lg">G</div>
           GuroAI
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span className="hidden md:inline text-xs font-semibold bg-slate-100 px-2 py-1 rounded">V1.0 BETA</span>
          <div className="h-4 w-px bg-slate-200 mx-2" />
          
          {user ? (
            <>
              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors group"
              >
                <HistoryIcon size={20} className="group-hover:rotate-12 transition-transform" />
                <span className="text-sm font-bold hidden sm:inline">History</span>
                {history.length > 0 && (
                  <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full text-[10px] flex items-center justify-center">
                    {history.length}
                  </span>
                )}
              </button>
              <div className="h-4 w-px bg-slate-200 mx-2" />
              <button 
                onClick={logOut}
                className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors"
                title="Log out"
              >
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Avatar" className="w-6 h-6 rounded-full" />
                <span className="text-sm font-bold hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="flex items-center gap-2 text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-full transition-colors font-bold text-sm"
            >
              <LogIn size={16} />
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-6 pt-16 pb-8 text-center max-w-4xl mx-auto">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold mb-6 tracking-wide"
        >
          <Sparkles size={14} />
          PEDAGOGICALLY ALIGNED AI
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black font-serif text-slate-900 leading-[1.1] mb-6"
        >
          Elevate Your Teaching with <span className="text-indigo-600">Design, Build, Reflect.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-sans leading-relaxed"
        >
          A smart instructional designer for Filipino educators. Transform topics into highly structured, ethical, and classroom-ready lesson strategies.
        </motion.p>
      </header>

      {/* Main Action Area */}
      <main className="px-6 relative z-10">
        <LessonForm onSubmit={handleGenerate} isLoading={isLoading} />
        
        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-center text-sm font-medium"
          >
            {error}
          </motion.div>
        )}

        {/* Enhanced Loader */}
        <AnimatePresence>
          {isLoading && <GenerationLoader />}
        </AnimatePresence>

        {/* Results Area */}
        <div id="result-section" className="mt-20">
          <AnimatePresence>
            {result && <LessonDisplay content={result} topic={currentTopic} onUpdateContent={setResult} />}
          </AnimatePresence>
        </div>
      </main>

      {/* Aesthetic Accents */}
      <div className="fixed top-[20%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/30 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-amber-100/30 rounded-full blur-[100px] -z-10 pointer-events-none" />
      
      {/* Modals */}
      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />

      {/* Footer */}
      <footer className="mt-auto px-6 py-12 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <p className="text-slate-500 text-sm font-medium mb-1">
              Compliant with DepEd Order No. 003, s. 2026
            </p>
            <p className="text-slate-400 text-xs">
              AI for Filipino Schools • Human-centered instruction
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">
              <Github size={20} />
            </a>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-slate-300 text-xs font-mono tracking-tighter uppercase font-bold">
              AI STUDIO BUILD 2026
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
