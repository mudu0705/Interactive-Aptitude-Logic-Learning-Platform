import { Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { generateAIQuestion, assignQuestionMetadata } from '../services/ai.service';
import { generateCertificateData } from '../services/certificate.service';
import { adminCreateQuestionSchema, createWeeklyExamSchema } from 'shared';

// Get list of all users
export const adminGetUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
    
    const formattedUsers = users.map((u) => ({
      ...u,
      profile: u.profile ? {
        ...u.profile,
        targetCompanies: JSON.parse(u.profile.targetCompanies),
      } : null,
    }));

    return res.json({ success: true, users: formattedUsers });
  } catch (error) {
    next(error);
  }
};

// Toggle user role
export const adminUpdateUserRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ success: false, message: 'User ID and role are required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    // Log the admin action
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'UPDATE_ROLE',
        target: userId,
        details: `Updated role of user ${updatedUser.email} to ${role}`,
      },
    });

    return res.json({ success: true, message: `User role updated to ${role} successfully` });
  } catch (error) {
    next(error);
  }
};

// Generate question using Gemini AI
export const adminGenerateAIQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { topicId, difficulty } = req.body;
    if (!topicId || !difficulty) {
      return res.status(400).json({ success: false, message: 'Topic ID and difficulty are required' });
    }

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const rawQuestion = await generateAIQuestion(topic.name, difficulty as any);
    
    const question = await prisma.question.create({
      data: {
        topicId,
        text: rawQuestion.text || 'Sample Question Text?',
        options: JSON.stringify(rawQuestion.options || ['A', 'B', 'C', 'D']),
        correctAnswer: rawQuestion.correctAnswer || 'A',
        explanation: rawQuestion.explanation || 'Sample Explanation.',
        difficulty: difficulty,
        companyTags: JSON.stringify(['TCS', 'Accenture']),
        estimatedSolvingTime: 60,
        marks: difficulty === 'HARD' || difficulty === 'EXPERT' ? 2 : 1,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Question generated successfully using AI',
      question: {
        ...question,
        options: JSON.parse(question.options),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create a single question manually
export const adminCreateQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = adminCreateQuestionSchema.parse(req.body);

    const question = await prisma.question.create({
      data: {
        topicId: data.topicId,
        text: data.text,
        options: JSON.stringify(data.options),
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        difficulty: data.difficulty,
        companyTags: JSON.stringify(req.body.companyTags || []),
        shortcut: req.body.shortcut || null,
        estimatedSolvingTime: req.body.estimatedSolvingTime || 60,
        marks: req.body.marks || 1,
        aiHint: req.body.aiHint || null,
        aiExplanation: req.body.aiExplanation || null,
      },
    });

    return res.status(201).json({
      success: true,
      question: {
        ...question,
        options: JSON.parse(question.options),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create and publish a Weekly Exam
export const adminCreateWeeklyExam = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createWeeklyExamSchema.parse(req.body);

    // Fetch topics matching specified categories
    const categories = await prisma.category.findMany({
      where: { name: { in: data.categories } },
      include: { topics: true },
    });

    const topicIds = categories.flatMap(c => c.topics.map(t => t.id));

    // Fetch questions to attach
    const matchingQuestions = await prisma.question.findMany({
      where: {
        topicId: { in: topicIds },
        difficulty: data.difficulty === 'MIXED' ? undefined : data.difficulty,
      },
      take: data.totalQuestions,
    });

    if (matchingQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No practice questions found matching those categories/difficulties to seed the exam.',
      });
    }

    const exam = await prisma.weeklyExam.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        duration: data.duration,
        totalQuestions: matchingQuestions.length,
        categories: JSON.stringify(data.categories),
        difficulty: data.difficulty,
        companyPattern: data.companyPattern,
        isPublished: true,
      },
    });

    // Seed exam specific questions
    const examQuestionsData = matchingQuestions.map((q) => ({
      examId: exam.id,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      shortcut: q.shortcut,
      companyTags: q.companyTags,
      estimatedSolvingTime: q.estimatedSolvingTime,
      marks: q.marks,
      aiHint: q.aiHint,
      aiExplanation: q.aiExplanation,
    }));

    await prisma.weeklyExamQuestion.createMany({
      data: examQuestionsData,
    });

    // Create system notification
    await prisma.notification.create({
      data: {
        title: 'New Weekly Exam Published!',
        message: `Practice exam "${data.name}" (${data.companyPattern} pattern) is live. Complete it before ${new Date(data.endDate).toLocaleDateString()}.`,
        type: 'EXAM',
      },
    });

    // Log the admin action
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'CREATE_EXAM',
        target: exam.id,
        details: `Created Weekly Exam: ${data.name}`,
      },
    });

    return res.status(201).json({ success: true, message: 'Weekly Exam created and published successfully', examId: exam.id });
  } catch (error) {
    next(error);
  }
};

// Batch Import Questions (CSV / JSON format)
export const adminImportQuestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: 'Questions array is required' });
    }

    let importedCount = 0;

    for (const q of questions) {
      let categoryName = q.category || 'Programming MCQs';
      let topicName = q.topic || 'General';
      let difficulty = q.difficulty || 'MEDIUM';
      let explanation = q.explanation || 'Refer to standard syntax guidelines.';
      const text = q.question || q.text;
      const options = q.options || [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean);
      const correctAnswer = q.correctAnswer || q.answer;

      if (!text || options.length < 2 || !correctAnswer) {
        continue; // Skip invalid rows
      }

      // Auto-assign metadata using Gemini if requested or if missing key fields
      if (q.useAIClassification || !q.category || !q.topic || !q.explanation) {
        try {
          const aiMeta = await assignQuestionMetadata(text, options);
          categoryName = aiMeta.category || categoryName;
          topicName = aiMeta.topic || topicName;
          difficulty = aiMeta.difficulty || difficulty;
          explanation = aiMeta.explanation || explanation;
        } catch (err) {
          console.warn('AI classification failed, using defaults.', err);
        }
      }

      // Sync category
      let category = await prisma.category.findUnique({ where: { name: categoryName } });
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: categoryName,
            slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
            description: `Questions under ${categoryName} module.`,
          },
        });
      }

      // Sync topic
      let topic = await prisma.topic.findFirst({
        where: { name: topicName, categoryId: category.id },
      });
      if (!topic) {
        topic = await prisma.topic.create({
          data: {
            categoryId: category.id,
            name: topicName,
            slug: `${topicName.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 1000)}`,
            description: `Topics for ${topicName}.`,
            theory: `Theory reference for ${topicName}.`,
            formula: JSON.stringify([]),
            examples: JSON.stringify([]),
            shortcuts: JSON.stringify([]),
          },
        });
      }

      // Save question
      await prisma.question.create({
        data: {
          topicId: topic.id,
          text,
          options: JSON.stringify(options),
          correctAnswer,
          explanation,
          difficulty,
          shortcut: q.shortcut || null,
          companyTags: JSON.stringify(q.companyTags || ['TCS']),
          estimatedSolvingTime: q.estimatedSolvingTime ? Number(q.estimatedSolvingTime) : 60,
          marks: q.marks ? Number(q.marks) : 1,
          aiHint: q.aiHint || null,
          aiExplanation: q.aiExplanation || null,
        },
      });

      importedCount += 1;
    }

    // Log the admin action
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'IMPORT_QUESTIONS',
        details: `Imported ${importedCount} questions successfully`,
      },
    });

    return res.json({ success: true, message: `Successfully parsed and imported ${importedCount} questions` });
  } catch (error) {
    next(error);
  }
};

// Fetch student analytics details
export const adminGetStudentAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalQuestions = await prisma.question.count();
    const totalWeeklyExams = await prisma.weeklyExam.count();

    // Active in last 7 days
    const activeThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeStudents = await prisma.profile.count({
      where: { lastActiveDate: { gte: activeThreshold } },
    });

    // Today's exam attempts
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayAttempts = await prisma.weeklyExamResult.count({
      where: { submittedAt: { gte: startOfToday } },
    });

    // Pass percentages and scores
    const completedResults = await prisma.weeklyExamResult.findMany({
      where: { submittedAt: { not: null } },
      select: { percentage: true, score: true },
    });

    const avgScore = completedResults.length > 0 
      ? Math.round(completedResults.reduce((acc, r) => acc + r.percentage, 0) / completedResults.length) 
      : 0;

    const passCount = completedResults.filter(r => r.percentage >= 50).length;
    const passPercentage = completedResults.length > 0 ? Math.round((passCount / completedResults.length) * 100) : 0;

    // Hardest Topic Calculation
    const responses = await prisma.questionResponse.findMany({
      include: { question: { include: { topic: true } } },
    });

    const topicStats: Record<string, { total: number; correct: number }> = {};
    responses.forEach((r) => {
      const tName = r.question.topic.name;
      if (!topicStats[tName]) topicStats[tName] = { total: 0, correct: 0 };
      topicStats[tName].total += 1;
      if (r.isCorrect) topicStats[tName].correct += 1;
    });

    let hardestTopic = 'N/A';
    let minAccuracy = 100;
    Object.keys(topicStats).forEach((tName) => {
      const acc = (topicStats[tName].correct / topicStats[tName].total) * 100;
      if (acc < minAccuracy) {
        minAccuracy = acc;
        hardestTopic = tName;
      }
    });

    // Mock graphs data
    const dailyActivityGraph = [
      { day: 'Mon', attempts: 12 },
      { day: 'Tue', attempts: 19 },
      { day: 'Wed', attempts: 32 },
      { day: 'Thu', attempts: 24 },
      { day: 'Fri', attempts: 45 },
      { day: 'Sat', attempts: 60 },
      { day: 'Sun', attempts: 52 },
    ];

    const monthlyGrowthGraph = [
      { month: 'Jan', students: 120 },
      { month: 'Feb', students: 180 },
      { month: 'Mar', students: 250 },
      { month: 'Apr', students: 340 },
      { month: 'May', students: 510 },
      { month: 'Jun', students: totalStudents },
    ];

    return res.json({
      success: true,
      analytics: {
        totalStudents,
        activeStudents,
        totalQuestions,
        totalWeeklyExams,
        todayAttempts,
        avgScore,
        passPercentage,
        hardestTopic,
        dailyActivityGraph,
        monthlyGrowthGraph,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Dispatch global or direct notifications
export const adminSendNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, message, type, userId } = req.body;
    if (!title || !message || !type) {
      return res.status(400).json({ success: false, message: 'Title, message, and type are required' });
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId: userId || null,
      },
    });

    // Log the admin action
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: 'SEND_NOTIFICATION',
        details: `Dispatched Notification: "${title}" to ${userId ? `User: ${userId}` : 'All Users'}`,
      },
    });

    return res.status(201).json({ success: true, message: 'Notification sent successfully', notification });
  } catch (error) {
    next(error);
  }
};

// Export exam results directly to CSV
export const adminExportResults = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { examId } = req.query;
    if (!examId) return res.status(400).json({ success: false, message: 'Exam ID query is required' });

    const results = await prisma.weeklyExamResult.findMany({
      where: { examId: String(examId), submittedAt: { not: null } },
      include: { user: true, exam: true },
      orderBy: { score: 'desc' },
    });

    let csvContent = 'Rank,Student Name,Email,Exam Name,Score,Percentage,Time Taken (sec),Submitted At\n';
    results.forEach((r, idx) => {
      csvContent += `${idx + 1},"${r.user.name}",${r.user.email},"${r.exam.name}",${r.score},${r.percentage}%,${r.timeTakenSeconds},"${r.submittedAt?.toISOString()}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Exam_Results_${examId}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// Fetch audit security logs
export const adminGetAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const auditLogs = await prisma.auditLog.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const adminLogs = await prisma.adminLog.findMany({
      include: { admin: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.json({ success: true, auditLogs, adminLogs });
  } catch (error) {
    next(error);
  }
};

// Claim Certificate
export const claimCertificate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { categoryId } = req.body;
    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Category ID is required' });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { topics: true },
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const host = `${req.protocol}://${req.get('host')}`;

    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        userId,
        categoryName: category.name,
      },
    });

    if (existingCertificate) {
      const certDetails = generateCertificateData(
        user.name,
        existingCertificate.categoryName,
        host,
        existingCertificate.certificateId,
        existingCertificate.issuedAt
      );

      return res.json({
        success: true,
        message: 'Certificate already claimed',
        certificate: {
          ...existingCertificate,
          svgContent: certDetails.svgContent,
        },
      });
    }
    const certDetails = generateCertificateData(user.name, category.name, host);

    const certificate = await prisma.certificate.create({
      data: {
        userId,
        categoryName: category.name,
        certificateId: certDetails.certificateId,
        qrCodeUrl: certDetails.qrCodeUrl,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Certificate claimed successfully',
      certificate: {
        ...certificate,
        svgContent: certDetails.svgContent,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify Certificate
export const verifyCertificate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const certificate = await prisma.certificate.findUnique({
      where: { certificateId: id },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate invalid or not found' });
    }

    return res.json({
      success: true,
      valid: true,
      certificate: {
        id: certificate.id,
        certificateId: certificate.certificateId,
        recipientName: certificate.user.name,
        categoryName: certificate.categoryName,
        issuedAt: certificate.issuedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
