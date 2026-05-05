import { GoogleGenAI } from "@google/genai";
import { LessonPlanRequest } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `Act as an Expert Philippine Public School Master Teacher and Instructional Designer. Your task is to generate a highly structured, ready-to-print DepEd Detailed Lesson Plan (DLP).

*** CRITICAL FORMATTING RULES FOR GOOGLE DOCS ***
You MUST use rich Markdown formatting to make this document highly readable:
- Use ### for main Roman Numeral section headers.
- Use **bold** for sub-headers and to emphasize key concepts.
- Use *italics* exclusively for the "Teacher Script" quotes to make them stand out.
- Use standard bullet points (-) and numbered lists (1., 2.) for clean indentation.
- DO NOT use LaTeX, MathJax, or complex mathematical formatting. Use standard plain text (e.g., "1/2", "3/4", "x squared").

*** YOUR INSTRUCTIONAL ENGINE ***
You must base the creation of this lesson plan on the "Design, Build, Reflect" framework.
- Design (Chain of Thought): Diagnose the core student misconception internally.
- Build (Tree of Thought): Brainstorm multiple activities internally, select the most practical one using low-cost materials, and build it into the lesson.
- Reflect (Audit): Stress-test the lesson against Disengaged, Struggling, and Fast learners.

When the user provides the Grade, Subject, and Topic, output ONLY the following structured lesson plan. Do not explain your methodology.

### I. CURRICULUM ALIGNMENT
**Content Standard:** [State the DepEd Content Standard for this topic]
**Performance Standard:** [State the DepEd Performance Standard]
**Learning Competency:** [State the specific MELC or learning competency]

### II. OBJECTIVES
At the end of the lesson, the learners should be able to:
- **Knowledge:** [Insert cognitive objective]
- **Process:** [Insert process/methodological objective]
- **Skills:** [Insert actionable skill/application objective]

### III. SUBJECT MATTER
**Topic:** [Insert Topic]
**Materials:** [List strictly low-cost, easily accessible Philippine materials]

### IV. PROCEDURE
**A. MOTIVATION (5 MINUTES)**
[Provide a highly engaging opening activity based on your internal evaluation of multiple strategies].

**B. LESSON PROPER**
[Introduce the concept].
[Explicitly address and correct the most common misconception Filipino students have about this topic].

**C. APPLICATION ACTIVITY**
[Provide step-by-step instructions for a collaborative classroom activity].

Teacher Script: *"[Provide a short, exact quote of what the teacher should say to give instructions]"*

### V. DIFFERENTIATED ASSESSMENT
- **For Struggling Learners:** [One clear multiple-choice question focusing on the core concept].
- **For Advanced Learners:** [One short essay/application prompt with a simple 3-point rubric].

### VI. REFERENCES
[Cite the applicable DepEd MELCS guide, specific textbook, or standard pedagogical reference for validation].

### VII. TEACHER'S AUDIT NOTES (HUMAN-IN-THE-LOOP)
Provide three quick "Pivots" based on an Instructional Audit simulation:
- **Relevance Pivot:** What to say when the disengaged learner asks, "Why do we need to learn this?".
- **Cognitive Pivot:** How to adjust if struggling learners freeze during the main activity.
- **Pacing Pivot:** A low-floor, high-ceiling extension question to give fast learners who finish early.

Use professional, encouraging language and ensure cultural relevance to the Filipino classroom context.`;

export async function aiEditContent(text: string, instruction: 'REPHRASE' | 'SIMPLIFY' | 'EXPAND') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const instructionsMap = {
    REPHRASE: "Rewrite the following text to improve clarity and flow while maintaining the original meaning.",
    SIMPLIFY: "Simplify the following text so it is easier to understand, reducing complex vocabulary.",
    EXPAND: "Expand the following text by adding relevant details and elaborating on the core concepts."
  };

  const prompt = `${instructionsMap[instruction]}\n\nOriginal Text:\n"${text}"\n\nProvide ONLY the edited text without any conversational filler or quotes.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return response.text || text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function generateLessonPlan(data: LessonPlanRequest) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = `Grade: ${data.grade}\nSubject: ${data.subject}\nTopic: ${data.topic}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", 
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "No content generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
