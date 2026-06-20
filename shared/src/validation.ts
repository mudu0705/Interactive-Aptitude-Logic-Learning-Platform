import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const otpVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 characters long'),
});

export const profileSetupSchema = z.object({
  college: z.string().optional(),
  targetCompanies: z.array(z.string()).min(1, 'Select at least one target company'),
  dailyGoalXP: z.number().int().min(10, 'Daily goal must be at least 10 XP'),
});

export const quizSubmissionSchema = z.object({
  questionId: z.string().uuid(),
  isCorrect: z.boolean(),
  timeTakenSeconds: z.number().nonnegative(),
  confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

export const createPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long'),
  content: z.string().min(10, 'Content must be at least 10 characters long'),
  category: z.string().min(2, 'Category is required'),
});

export const createCommentSchema = z.object({
  content: z.string().min(2, 'Comment must be at least 2 characters long'),
});

export const adminCreateQuestionSchema = z.object({
  topicId: z.string().uuid(),
  text: z.string().min(5, 'Question text must be at least 5 characters long'),
  options: z.array(z.string()).min(2, 'Provide at least two options'),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().min(5, 'Provide an explanation for the answer'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']),
});

export const createWeeklyExamSchema = z.object({
  name: z.string().min(3, 'Exam name must be at least 3 characters long'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  duration: z.number().int().min(5).max(300),
  totalQuestions: z.number().int().min(1).max(100),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MIXED']),
  companyPattern: z.enum(['TCS', 'Infosys', 'Accenture', 'Wipro', 'Capgemini', 'Cognizant']),
});

export const submitExamSchema = z.object({
  examId: z.string().uuid(),
  timeTakenSeconds: z.number().int().nonnegative(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    selectedAnswer: z.string()
  })),
});

