export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ADMIN';
  xp: number;
  coins: number;
  level: number;
  streak: number;
  dailyGoalXP: number;
  college?: string;
  targetCompanies: string[];
  readinessScore: number;
}

export interface FormulaItem {
  name: string;
  expression: string;
  description: string;
}

export interface ExampleItem {
  question: string;
  solution: string;
  explanation: string;
}

export interface ShortcutItem {
  title: string;
  trick: string;
}

export interface TopicDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  theory: string;
  formula: FormulaItem[];
  examples: ExampleItem[];
  shortcuts: ShortcutItem[];
  videoUrl?: string;
  pdfUrl?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  topicId: string;
}

export interface QuizSubmission {
  questionId: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface QuizResult {
  xpEarned: number;
  coinsEarned: number;
  levelUp: boolean;
  newLevel: number;
  streak: number;
  adaptiveFeedback: string;
  nextRecommendedDifficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  xp: number;
  level: number;
  college?: string;
  rank: number;
}

export interface Leaderboards {
  daily: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
  global: LeaderboardEntry[];
  college: LeaderboardEntry[];
}

export interface ForumPostType {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByUser?: boolean;
}

export interface ForumCommentType {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface ATSFeedback {
  score: number;
  missingSkills: string[];
  grammarIssues: string[];
  formattingSuggestions: string[];
  readyForJobPrediction: Record<string, number>; // e.g. {"TCS": 85, "Wipro": 90}
}

export interface InterviewMessage {
  sender: 'AI' | 'USER';
  text: string;
  timestamp: string;
  audioUrl?: string;
}

export interface MockInterviewFeedback {
  communicationScore: number;
  confidenceScore: number;
  grammarScore: number;
  technicalScore: number;
  overallScore: number;
  constructiveFeedback: string[];
}

export interface CertificateDetails {
  id: string;
  userName: string;
  categoryName: string;
  certificateId: string;
  issuedAt: string;
  qrCodeUrl: string;
}
