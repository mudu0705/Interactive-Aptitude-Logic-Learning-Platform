import { Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { quizSubmissionSchema } from 'shared';

export const startSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { topicId } = req.body;

    if (!userId || !topicId) {
      return res.status(400).json({ success: false, message: 'Topic ID is required' });
    }

    // Start a new practice session with EASY difficulty
    const session = await prisma.practiceSession.create({
      data: {
        userId,
        topicId,
        difficulty: 'EASY',
      },
    });

    return res.json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

export const getQuestionsForSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Practice session not found' });
    }

    // Fetch questions matching this topic and current difficulty
    const questions = await prisma.question.findMany({
      where: {
        topicId: session.topicId,
        difficulty: session.difficulty,
      },
      take: 5,
    });

    const formattedQuestions = questions.map((q) => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    }));

    return res.json({
      success: true,
      difficulty: session.difficulty,
      questions: formattedQuestions,
    });
  } catch (error) {
    next(error);
  }
};

export const submitResponse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { sessionId } = req.params;
    const data = quizSubmissionSchema.parse(req.body);

    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const question = await prisma.question.findUnique({
      where: { id: data.questionId },
    });

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Log the response
    const loggedResponse = await prisma.questionResponse.create({
      data: {
        userId,
        questionId: data.questionId,
        isCorrect: data.isCorrect,
        timeTakenSeconds: data.timeTakenSeconds,
        confidence: data.confidence,
      },
    });

    // Gamification Engine Reward Calculation
    let xpEarned = 0;
    if (data.isCorrect) {
      switch (question.difficulty) {
        case 'EASY': xpEarned = 10; break;
        case 'MEDIUM': xpEarned = 20; break;
        case 'HARD': xpEarned = 30; break;
        case 'EXPERT': xpEarned = 50; break;
      }
    } else {
      xpEarned = 2; // Participation XP
    }

    const coinsEarned = Math.round(xpEarned * 0.5);

    // Fetch Profile
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const newXp = profile.xp + xpEarned;
    const newCoins = profile.coins + coinsEarned;
    
    // Level formula: Level = floor(sqrt(XP)/10) + 1
    const newLevel = Math.floor(Math.sqrt(newXp) / 10) + 1;
    const levelUp = newLevel > profile.level;

    // Streak tracker logic
    let newStreak = profile.streak;
    const now = new Date();
    if (profile.lastActiveDate) {
      const diffTime = Math.abs(now.getTime() - profile.lastActiveDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    // Update profile
    await prisma.profile.update({
      where: { userId },
      data: {
        xp: newXp,
        coins: newCoins,
        level: newLevel,
        streak: newStreak,
        lastActiveDate: now,
      },
    });

    // Adaptive Difficulty Engine Logic
    // Fetch last 3 responses of this user for this topic session
    const lastResponses = await prisma.questionResponse.findMany({
      where: {
        userId,
        question: { topicId: session.topicId },
      },
      orderBy: { answeredAt: 'desc' },
      take: 3,
    });

    let newDifficulty = session.difficulty;
    let adaptiveFeedback = 'Keep practicing to level up!';

    if (lastResponses.length >= 3) {
      const allCorrect = lastResponses.every(r => r.isCorrect);
      const allIncorrect = lastResponses.every(r => !r.isCorrect);

      if (allCorrect && session.difficulty !== 'EXPERT') {
        // Upgrade difficulty
        if (session.difficulty === 'EASY') newDifficulty = 'MEDIUM';
        else if (session.difficulty === 'MEDIUM') newDifficulty = 'HARD';
        else if (session.difficulty === 'HARD') newDifficulty = 'EXPERT';

        adaptiveFeedback = `Fantastic! 3 correct answers in a row. Upgrading difficulty to ${newDifficulty}!`;
      } else if (allIncorrect && session.difficulty !== 'EASY') {
        // Downgrade difficulty
        if (session.difficulty === 'EXPERT') newDifficulty = 'HARD';
        else if (session.difficulty === 'HARD') newDifficulty = 'MEDIUM';
        else if (session.difficulty === 'MEDIUM') newDifficulty = 'EASY';

        adaptiveFeedback = `Reviewing performance. Let's practice with ${newDifficulty} questions to solidfy your foundation.`;
      }
    }

    if (newDifficulty !== session.difficulty) {
      await prisma.practiceSession.update({
        where: { id: session.id },
        data: { difficulty: newDifficulty },
      });
    }

    // Achievement unlocks logic
    // Unlocking first question achievement, 100 XP, 500 XP achievements
    const unlockedAchievements: string[] = [];
    const checkAchievement = async (title: string, desc: string, icon: string, xpReward: number) => {
      let ach = await prisma.achievement.findUnique({ where: { title } });
      if (!ach) {
        ach = await prisma.achievement.create({
          data: { title, description: desc, iconName: icon, xpReward },
        });
      }
      
      const userAch = await prisma.userAchievement.findFirst({
        where: { userId, achievementId: ach.id },
      });

      if (!userAch) {
        await prisma.userAchievement.create({
          data: { userId, achievementId: ach.id },
        });
        unlockedAchievements.push(title);
      }
    };

    await checkAchievement('First Step', 'Solve your first practice question', 'Zap', 20);
    if (newXp >= 100) {
      await checkAchievement('Century Scorer', 'Reach 100 total XP', 'Award', 50);
    }
    if (newStreak >= 3) {
      await checkAchievement('Daily Grind', 'Maintain a 3-day active streak', 'Flame', 100);
    }

    return res.json({
      success: true,
      xpEarned,
      coinsEarned,
      levelUp,
      newLevel,
      streak: newStreak,
      adaptiveFeedback,
      nextRecommendedDifficulty: newDifficulty,
      unlockedAchievements,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const responses = await prisma.questionResponse.findMany({
      where: { userId },
      include: {
        question: {
          include: {
            topic: {
              include: { category: true },
            },
          },
        },
      },
    });

    const totalQuestions = responses.length;
    const correctAnswers = responses.filter((r) => r.isCorrect).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // Average time taken
    const totalTime = responses.reduce((acc, r) => acc + r.timeTakenSeconds, 0);
    const avgTime = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0;

    // Detect weak and strong topics based on accuracy
    const topicPerformance: Record<string, { total: number; correct: number; name: string }> = {};
    responses.forEach((r) => {
      const tid = r.question.topicId;
      if (!topicPerformance[tid]) {
        topicPerformance[tid] = { total: 0, correct: 0, name: r.question.topic.name };
      }
      topicPerformance[tid].total += 1;
      if (r.isCorrect) {
        topicPerformance[tid].correct += 1;
      }
    });

    const weakTopics: string[] = [];
    const strongTopics: string[] = [];

    Object.keys(topicPerformance).forEach((tid) => {
      const info = topicPerformance[tid];
      const acc = (info.correct / info.total) * 100;
      if (acc < 50) {
        weakTopics.push(info.name);
      } else if (acc >= 75) {
        strongTopics.push(info.name);
      }
    });

    // Recent activity list
    const recentActivity = responses.slice(-5).map((r) => ({
      topic: r.question.topic.name,
      correct: r.isCorrect,
      answeredAt: r.answeredAt,
    }));

    // Weekly progress
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyXP = days.map((day) => ({ day, xp: 0 }));
    weeklyXP[new Date().getDay()].xp = correctAnswers * 10;

    // Fetch Global Rank
    const ranking = await prisma.studentRanking.findUnique({
      where: { userId },
    });
    const globalRank = ranking?.globalRank || 1;

    // Fetch Weekly Exam Results
    const examResults = await prisma.weeklyExamResult.findMany({
      where: { userId, submittedAt: { not: null } },
      include: { exam: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Fetch Upcoming Exams
    const now = new Date();
    const upcomingExams = await prisma.weeklyExam.findMany({
      where: { isPublished: true, startDate: { gte: now } },
      orderBy: { startDate: 'asc' },
      take: 2,
    });

    // Fetch Mock Test history
    const mockAttempts = await prisma.mockTestAttempt.findMany({
      where: { userId },
      include: { mockTest: true },
      orderBy: { completedAt: 'desc' },
      take: 5,
    });

    // Subject-wise accuracy calculation
    const subjectStats: Record<string, { total: number; correct: number }> = {
      'Quantitative Aptitude': { total: 0, correct: 0 },
      'Logical Reasoning': { total: 0, correct: 0 },
      'Verbal Ability': { total: 0, correct: 0 },
      'Programming MCQs': { total: 0, correct: 0 },
    };

    responses.forEach((r) => {
      const catName = r.question.topic.category.name;
      if (subjectStats[catName]) {
        subjectStats[catName].total += 1;
        if (r.isCorrect) {
          subjectStats[catName].correct += 1;
        }
      }
    });

    const subjectPerformance = Object.keys(subjectStats).map((subject) => {
      const stats = subjectStats[subject];
      return {
        subject,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      };
    });

    // Recommended topics
    const allTopics = await prisma.topic.findMany({ take: 3 });
    const recommendedTopics = allTopics.map(t => t.name);

    // Company-wise Readiness Calculation
    const profile = await prisma.profile.findUnique({ where: { userId } });
    const readinessScore = profile?.readinessScore || 0;
    const targetList = profile ? JSON.parse(profile.targetCompanies) : [];

    const companies = ['TCS', 'Infosys', 'Accenture', 'Wipro', 'Capgemini', 'Cognizant'];
    const companyReadiness = companies.map((company) => {
      const isTarget = targetList.includes(company);
      // Targets get a slight base index boost, combined with general accuracy
      const base = isTarget ? 15 : 0;
      const score = Math.min(100, Math.round(readinessScore * 0.8 + base + (accuracy * 0.1)));
      return { company, score };
    });

    // AI dynamic recommendations
    const aiRecommendations = [
      `Maintain your ${profile?.streak || 1}-day active streak! Complete daily goals to level up.`,
      weakTopics.length > 0 
        ? `Improve score in weak subject "${weakTopics[0]}" to boost TCS alignment by 12%.`
        : 'Syllabus accuracy is high! Start a company-tailored mock interview simulator next.',
      `Try out the new Weekly Exam "${upcomingExams[0]?.name || 'Placement Practice'}" scheduled for this week.`,
    ];

    return res.json({
      success: true,
      analytics: {
        totalQuestions,
        correctAnswers,
        accuracy,
        avgTime,
        weakTopics: weakTopics.slice(0, 3),
        strongTopics: strongTopics.slice(0, 3),
        recentActivity,
        weeklyXP,
        globalRank,
        weeklyExamResults: examResults,
        upcomingWeeklyExams: upcomingExams,
        mockTestHistory: mockAttempts,
        subjectPerformance,
        recommendedTopics,
        companyReadiness,
        aiRecommendations,
      },
    });
  } catch (error) {
    next(error);
  }
};
