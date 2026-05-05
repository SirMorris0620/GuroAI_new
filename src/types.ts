export interface LessonPlanRequest {
  grade: string;
  subject: string;
  topic: string;
}

export interface LessonPlanResponse {
  content: string;
}

export interface HistoryItem extends LessonPlanRequest {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
}
