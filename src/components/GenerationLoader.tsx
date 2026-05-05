import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { GraduationCap, Brain, PenTool, ClipboardCheck, Sparkles, CheckCircle2, Loader2 } from "lucide-react";

const STEPS = [
  { id: 'diagnose', icon: Brain, label: "Diagnosing Learning Context", details: ["Analyzing subject and topic", "Identifying common misconceptions", "Formulating pedagogical strategy"], color: "text-blue-500", bg: "bg-blue-100" },
  { id: 'align', icon: GraduationCap, label: "Aligning with Standards", details: ["Cross-referencing DepEd MELCs", "Setting cognitive objectives", "Defining performance metrics"], color: "text-indigo-500", bg: "bg-indigo-100" },
  { id: 'draft', icon: PenTool, label: "Drafting Instruction", details: ["Structuring lesson timeline", "Writing specialized teacher scripts", "Designing low-cost activities"], color: "text-amber-500", bg: "bg-amber-100" },
  { id: 'audit', icon: ClipboardCheck, label: "Instructional Audit", details: ["Simulating disengaged learners", "Creating pacing pivots", "Finalizing assessment rubrics"], color: "text-emerald-500", bg: "bg-emerald-100" },
];

export default function GenerationLoader() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [activeSubStepIndex, setActiveSubStepIndex] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return prev;
        return prev + (100 - prev) * 0.02;
      });
    }, 100);

    const stepDuration = 3500; // ms per step
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      setActiveSubStepIndex(0);
    }, stepDuration);

    const subStepInterval = setInterval(() => {
      setActiveSubStepIndex((prev) => Math.min(prev + 1, 2));
    }, stepDuration / 3);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearInterval(subStepInterval);
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-12 mb-20 px-6">
      <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-indigo-100/50 border border-slate-100 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 p-32 bg-indigo-50 blur-[100px] -z-10 rounded-full" />
        <div className="absolute bottom-0 left-0 p-32 bg-blue-50 blur-[100px] -z-10 rounded-full" />

        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 mb-6"
          >
            <Sparkles size={32} />
          </motion.div>
          <h3 className="text-2xl font-serif font-bold text-slate-800">Crafting Lesson Plan</h3>
          <p className="text-slate-500 mt-2 max-w-md">Our AI is designing a highly-structured and pedagogical lesson specifically for your classroom.</p>
        </div>

        {/* Global Progress Bar */}
        <div className="mb-10 relative">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-slate-700">Overall Progress</span>
            <span className="text-sm font-bold text-indigo-600 tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-600 rounded-full relative"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
            >
               <motion.div 
                 className="absolute inset-0 bg-white/20 w-full"
                 animate={{ x: ["-100%", "100%"] }}
                 transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
               />
            </motion.div>
          </div>
        </div>

        {/* Step-by-step Timeline */}
        <div className="space-y-6">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isPending = index > currentStep;
            
            return (
              <div key={step.id} className={`relative flex gap-4 ${isPending ? 'opacity-40' : 'opacity-100'} transition-opacity duration-500`}>
                {/* Connector Line */}
                {index !== STEPS.length - 1 && (
                  <div className={`absolute left-[1.125rem] top-10 bottom-[-1.5rem] w-0.5 ${isCompleted ? 'bg-indigo-600' : 'bg-slate-200'} transition-colors duration-500`} />
                )}

                {/* Icon */}
                <div className="relative z-10">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-white border-2 transition-all duration-500 ${isActive ? 'border-indigo-600 shadow-lg shadow-indigo-100 scale-110' : isCompleted ? 'border-indigo-600 text-indigo-600' : 'border-slate-200 text-slate-300'}`}>
                    {isCompleted ? <CheckCircle2 size={18} className="text-indigo-600" /> : <step.icon size={isActive ? 18 : 16} className={isActive ? step.color : ''} />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <h4 className={`font-bold ${isActive ? 'text-slate-800' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                    {step.label}
                  </h4>
                  
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3"
                      >
                        <ul className="space-y-2">
                          {step.details.map((detail, subIndex) => {
                            const isSubCompleted = subIndex < activeSubStepIndex;
                            const isSubActive = subIndex === activeSubStepIndex;
                            const isSubPending = subIndex > activeSubStepIndex;
                            
                            return (
                              <motion.li 
                                key={subIndex}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: isSubPending ? 0.4 : 1, x: 0 }}
                                className="flex items-center gap-2 text-sm"
                              >
                                {isSubCompleted ? (
                                  <CheckCircle2 size={14} className="text-emerald-500" />
                                ) : isSubActive ? (
                                  <Loader2 size={14} className={`animate-spin ${step.color}`} />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200" />
                                )}
                                <span className={`${isSubActive ? 'text-slate-700 font-medium' : isSubCompleted ? 'text-slate-500' : 'text-slate-400'}`}>
                                  {detail}
                                </span>
                              </motion.li>
                            )
                          })}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
