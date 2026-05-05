import { motion } from "motion/react";
import { GraduationCap, BookOpen, AlertCircle } from "lucide-react";
import { LessonPlanRequest } from "../types";
import { useState } from "react";

interface LessonFormProps {
  onSubmit: (data: LessonPlanRequest) => void;
  isLoading: boolean;
}

export default function LessonForm({ onSubmit, isLoading }: LessonFormProps) {
  const [formData, setFormData] = useState<LessonPlanRequest>({
    grade: "",
    subject: "",
    topic: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.grade && formData.subject && formData.topic) {
      onSubmit(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 w-full max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
          <BookOpen id="form-icon" size={24} />
        </div>
        <div>
          <h2 id="form-title" className="text-xl font-bold font-serif text-slate-800">
            Create Your Lesson Plan
          </h2>
          <p className="text-sm text-slate-500 font-sans">
            Aligned with DepEd Order No. 003, s. 2026
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="grade" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Grade Level
          </label>
          <input
            id="grade"
            type="text"
            placeholder="e.g., Grade 10"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="subject" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            placeholder="e.g., Araling Panlipunan"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="topic" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Topic / Lesson Title
          </label>
          <input
            id="topic"
            type="text"
            placeholder="e.g., Rights of a Citizen"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            required
          />
        </div>

        <button
          id="generate-button"
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            isLoading
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 hover:shadow-indigo-300 active:scale-[0.98]"
          }`}
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full" />
              </motion.div>
              Generating Strategy...
            </>
          ) : (
            <>
              <GraduationCap size={20} />
              Generate Detailed Lesson Plan (DLP)
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-amber-800 text-xs">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <p>
          AI for Education: This tool supports human-centered teaching. Please review all outputs for classroom safety and pedagogical appropriateness.
        </p>
      </div>
    </motion.div>
  );
}
