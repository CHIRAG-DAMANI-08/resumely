interface FeedbackTip {
  type: "good" | "improve";
  tip: string;
  explanation?: string;
}

interface FeedbackCategory {
  score: number;
  tips: FeedbackTip[];
}

interface Feedback {
  overallScore: number;
  ATS: FeedbackCategory;
  toneAndStyle: FeedbackCategory;
  content: FeedbackCategory;
  structure: FeedbackCategory;
  skills: FeedbackCategory;
}

interface ScoreSnapshot {
  resumeId: string;
  overallScore: number;
  ATS: number;
  toneAndStyle: number;
  content: number;
  structure: number;
  skills: number;
  createdAt: number;
}

interface Resume {
  id: string;
  resumePath: string;
  imagePath: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  feedback: Feedback | null;
  keywordGapAnalysis?: import("../constants").KeywordGapAnalysis | null;
  jobKey?: string;
  fileName?: string;
  fileSize?: number;
  createdAt?: number;
}
