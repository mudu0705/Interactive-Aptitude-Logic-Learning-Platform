import { Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { submitExamSchema } from 'shared';

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Get all weekly exams grouped by status (Upcoming, Live, Completed)
export const getAvailableExams = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const now = new Date();

    // Fetch all published exams
    const exams = await prisma.weeklyExam.findMany({
      where: { isPublished: true },
      include: {
        results: {
          where: { userId },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    const liveExams = [];
    const upcomingExams = [];
    const completedExams = [];

    for (const exam of exams) {
      const isAttempted = exam.results.length > 0 && exam.results[0].submittedAt !== null;
      const activeResult = exam.results.find(r => r.submittedAt === null);

      const formattedExam = {
        id: exam.id,
        name: exam.name,
        startDate: exam.startDate,
        endDate: exam.endDate,
        duration: exam.duration,
        totalQuestions: exam.totalQuestions,
        categories: JSON.parse(exam.categories),
        difficulty: exam.difficulty,
        companyPattern: exam.companyPattern,
        isAttempted,
        activeResultId: activeResult?.id || null,
        score: isAttempted ? exam.results[0].score : null,
        percentage: isAttempted ? exam.results[0].percentage : null,
      };

      if (isAttempted || new Date(exam.endDate) < now) {
        completedExams.push(formattedExam);
      } else if (new Date(exam.startDate) <= now && new Date(exam.endDate) >= now) {
        liveExams.push(formattedExam);
      } else {
        upcomingExams.push(formattedExam);
      }
    }

    return res.json({
      success: true,
      liveExams,
      upcomingExams,
      completedExams,
    });
  } catch (error) {
    next(error);
  }
};

// Start or resume a weekly exam attempt
export const startExamAttempt = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { examId } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Verify exam is active
    const exam = await prisma.weeklyExam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });

    if (!exam || !exam.isPublished) {
      return res.status(404).json({ success: false, message: 'Weekly exam not found' });
    }

    const now = new Date();
    if (new Date(exam.startDate) > now || new Date(exam.endDate) < now) {
      return res.status(400).json({ success: false, message: 'Exam is not currently active' });
    }

    // Check for existing attempts
    const existingAttempt = await prisma.weeklyExamResult.findFirst({
      where: { examId, userId },
    });

    if (existingAttempt && existingAttempt.submittedAt !== null) {
      return res.status(400).json({ success: false, message: 'You have already attempted this exam once' });
    }

    let attempt = existingAttempt;

    // Create a new attempt session if not already active
    if (!attempt) {
      attempt = await prisma.weeklyExamResult.create({
        data: {
          examId,
          userId,
          score: 0,
          percentage: 0,
          timeTakenSeconds: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          answersJson: JSON.stringify({}),
          startedAt: new Date(),
        },
      });
    }

    // Persist and calculate time remaining based on start time
    const elapsedSeconds = Math.floor((new Date().getTime() - new Date(attempt.startedAt).getTime()) / 1000);
    const durationSeconds = exam.duration * 60;
    const timeRemainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

    if (timeRemainingSeconds <= 0) {
      // Auto-submit if time already expired before resumption
      await autoSubmitExam(attempt.id);
      return res.status(400).json({ success: false, message: 'Exam duration has expired' });
    }

    // Randomize question list order and also options order
    const shuffledQuestions = shuffleArray(exam.questions).map((q) => {
      const originalOptions = JSON.parse(q.options);
      const shuffledOptions = shuffleArray(originalOptions);
      return {
        id: q.id,
        text: q.text,
        options: shuffledOptions,
        difficulty: q.difficulty,
        marks: q.marks,
        estimatedSolvingTime: q.estimatedSolvingTime,
        aiHint: q.aiHint,
      };
    });

    return res.json({
      success: true,
      attemptId: attempt.id,
      name: exam.name,
      duration: exam.duration,
      timeRemainingSeconds,
      questions: shuffledQuestions,
    });
  } catch (error) {
    next(error);
  }
};

// Submit weekly exam answers
export const submitExamAttempt = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const data = submitExamSchema.parse(req.body);

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await prisma.weeklyExamResult.findUnique({
      where: { id: data.examId },
      include: { exam: { include: { questions: true } } },
    });

    if (!result || result.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Exam attempt not found' });
    }

    if (result.submittedAt !== null) {
      return res.status(400).json({ success: false, message: 'Attempt already submitted' });
    }

    // Grade options
    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    const examQuestions = result.exam.questions;

    const formattedAnswers: Record<string, string> = {};

    data.answers.forEach((ans) => {
      formattedAnswers[ans.questionId] = ans.selectedAnswer;
      const question = examQuestions.find(q => q.id === ans.questionId);
      if (question) {
        if (question.correctAnswer.trim().toLowerCase() === ans.selectedAnswer.trim().toLowerCase()) {
          score += question.marks;
          correctAnswers += 1;
        } else {
          wrongAnswers += 1;
        }
      }
    });

    // Count unanswered questions as wrong
    const answeredIds = Object.keys(formattedAnswers);
    const unansweredCount = examQuestions.length - answeredIds.length;
    wrongAnswers += unansweredCount;

    // Calculate maximum score possible
    const maxScore = examQuestions.reduce((sum, q) => sum + q.marks, 0);
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 10000) / 100 : 0;

    // Save final scores
    const updatedResult = await prisma.weeklyExamResult.update({
      where: { id: result.id },
      data: {
        score,
        percentage,
        timeTakenSeconds: data.timeTakenSeconds,
        correctAnswers,
        wrongAnswers,
        answersJson: JSON.stringify(formattedAnswers),
        submittedAt: new Date(),
      },
    });

    // Sync student readiness score and streaks
    await updateReadinessScore(userId);

    return res.json({
      success: true,
      message: 'Exam submitted successfully',
      result: {
        id: updatedResult.id,
        score,
        percentage,
        correctAnswers,
        wrongAnswers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Fetch results breakdown for a completed weekly exam
export const getExamResultDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { attemptId } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await prisma.weeklyExamResult.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: { questions: true },
        },
      },
    });

    if (!result || result.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Attempt result record not found' });
    }

    const studentAnswers = JSON.parse(result.answersJson);

    // Calculate rank
    const allResults = await prisma.weeklyExamResult.findMany({
      where: { examId: result.examId, submittedAt: { not: null } },
      orderBy: [
        { score: 'desc' },
        { timeTakenSeconds: 'asc' },
      ],
    });

    const rank = allResults.findIndex(r => r.userId === userId) + 1;

    // Format questions with student selection details
    const formattedQuestions = result.exam.questions.map((q) => {
      const selectedAnswer = studentAnswers[q.id] || null;
      return {
        id: q.id,
        text: q.text,
        options: JSON.parse(q.options),
        correctAnswer: q.correctAnswer,
        selectedAnswer,
        isCorrect: selectedAnswer !== null && q.correctAnswer.trim().toLowerCase() === selectedAnswer.trim().toLowerCase(),
        explanation: q.explanation,
        shortcut: q.shortcut,
        aiExplanation: q.aiExplanation,
        marks: q.marks,
        difficulty: q.difficulty,
        companyTags: JSON.parse(q.companyTags),
      };
    });

    return res.json({
      success: true,
      examName: result.exam.name,
      score: result.score,
      percentage: result.percentage,
      timeTakenSeconds: result.timeTakenSeconds,
      correctAnswers: result.correctAnswers,
      wrongAnswers: result.wrongAnswers,
      rank,
      totalParticipants: allResults.length,
      questions: formattedQuestions,
    });
  } catch (error) {
    next(error);
  }
};

// Internal auto submit helper
async function autoSubmitExam(attemptId: string) {
  const result = await prisma.weeklyExamResult.findUnique({
    where: { id: attemptId },
    include: { exam: { include: { questions: true } } },
  });

  if (!result || result.submittedAt !== null) return;

  const durationSeconds = result.exam.duration * 60;
  const examQuestions = result.exam.questions;
  const studentAnswers = JSON.parse(result.answersJson || '{}');

  let score = 0;
  let correctAnswers = 0;
  let wrongAnswers = 0;

  examQuestions.forEach((q) => {
    const selected = studentAnswers[q.id] || '';
    if (selected && q.correctAnswer.trim().toLowerCase() === selected.trim().toLowerCase()) {
      score += q.marks;
      correctAnswers += 1;
    } else {
      wrongAnswers += 1;
    }
  });

  const maxScore = examQuestions.reduce((sum, q) => sum + q.marks, 0);
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 10000) / 100 : 0;

  await prisma.weeklyExamResult.update({
    where: { id: attemptId },
    data: {
      score,
      percentage,
      timeTakenSeconds: durationSeconds,
      correctAnswers,
      wrongAnswers,
      submittedAt: new Date(),
    },
  });

  await updateReadinessScore(result.userId);
}

// Helper to recalculate student Readiness Index and leaderboard rankings
export async function updateReadinessScore(userId: string) {
  try {
    // 1. Calculate average practice accuracy
    const practiceResponses = await prisma.questionResponse.findMany({
      where: { userId },
    });
    const practiceCount = practiceResponses.length;
    const practiceCorrect = practiceResponses.filter(r => r.isCorrect).length;
    const practiceAccuracy = practiceCount > 0 ? (practiceCorrect / practiceCount) * 100 : 0;

    // 2. Calculate average weekly exam percentage
    const examResults = await prisma.weeklyExamResult.findMany({
      where: { userId, submittedAt: { not: null } },
    });
    const examCount = examResults.length;
    const examAvgPct = examCount > 0 ? examResults.reduce((acc, r) => acc + r.percentage, 0) / examCount : 0;

    // 3. Mock test average
    const mockAttempts = await prisma.mockTestAttempt.findMany({
      where: { userId },
    });
    const mockCount = mockAttempts.length;
    const mockAvgPct = mockCount > 0 ? (mockAttempts.reduce((acc, r) => acc + r.score, 0) / (mockCount * 5)) * 100 : 0; // Assuming 5 questions per mock

    // Combined Readiness Index Formula: 40% Practice + 40% Exams + 20% Mock Tests
    const readinessScore = Math.min(100, Math.round((practiceAccuracy * 0.4) + (examAvgPct * 0.4) + (mockAvgPct * 0.2)));

    // Update Profile readiness
    await prisma.profile.update({
      where: { userId },
      data: { readinessScore },
    });

    // Sync rankings table
    const allProfiles = await prisma.profile.findMany({
      orderBy: { readinessScore: 'desc' },
    });

    const rankIdx = allProfiles.findIndex(p => p.userId === userId) + 1;

    // Update StudentRanking
    await prisma.studentRanking.upsert({
      where: { userId },
      update: {
        globalRank: rankIdx,
        weeklyRank: rankIdx, // Caching same for dev simplicity
        readinessScore,
      },
      create: {
        userId,
        globalRank: rankIdx,
        weeklyRank: rankIdx,
        readinessScore,
      },
    });

    // Re-sync all rankings in background if necessary
    for (let i = 0; i < allProfiles.length; i++) {
      const uId = allProfiles[i].userId;
      const rScore = allProfiles[i].readinessScore;
      await prisma.studentRanking.upsert({
        where: { userId: uId },
        update: { globalRank: i + 1, weeklyRank: i + 1, readinessScore: rScore },
        create: { userId: uId, globalRank: i + 1, weeklyRank: i + 1, readinessScore: rScore },
      });
    }
  } catch (error) {
    console.error('Error updating readiness score:', error);
  }
}
