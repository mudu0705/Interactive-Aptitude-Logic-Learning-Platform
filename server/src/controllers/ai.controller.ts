import { Response, NextFunction } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import prisma from '../services/db.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { explainConcept, generateInterviewFeedback, generateAIQuestion, generateNextInterviewQuestion } from '../services/ai.service';
import { analyzeResumeText } from '../services/ats.service';

// Multer memory storage configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB file
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF resumes are supported.'));
    }
  },
}).single('resume');

// In-memory interview session manager (keyed by userId)
const interviewHistories: Record<string, { sender: 'AI' | 'USER'; text: string }[]> = {};

export const askTutor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { topicName, query } = req.body;
    if (!topicName || !query) {
      return res.status(400).json({ success: false, message: 'Topic name and query are required' });
    }

    const explanation = await explainConcept(topicName, query);
    return res.json({ success: true, response: explanation });
  } catch (error) {
    next(error);
  }
};

export const checkATSResume = (req: AuthRequest, res: Response, next: NextFunction) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      let textContent = '';

      if (req.file) {
        // Parse PDF file using pdf-parse
        const parsedPdf = await pdfParse(req.file.buffer);
        textContent = parsedPdf.text;
      } else if (req.body.text) {
        // Support direct text pasting
        textContent = req.body.text;
      } else {
        return res.status(400).json({ success: false, message: 'Upload a PDF file or provide resume text' });
      }

      // Fetch user's practice performance to contextualize predictions
      const analytics = await prisma.questionResponse.findMany({
        where: { userId },
      });

      const completedCount = new Set(analytics.map(a => a.questionId)).size;
      const correctCount = analytics.filter(a => a.isCorrect).length;
      const accuracy = analytics.length > 0 ? correctCount / analytics.length : 0.7;

      const analysis = analyzeResumeText(textContent, completedCount, accuracy);

      // Save ATS score and update readiness
      await prisma.profile.update({
        where: { userId },
        data: {
          readinessScore: analysis.score,
        },
      });

      return res.json({
        success: true,
        analysis,
      });
    } catch (error) {
      next(error);
    }
  });
};

export const startMockInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { company } = req.body;
    if (!company) {
      return res.status(400).json({ success: false, message: 'Company selection is required' });
    }

    const firstQuestion = `Hello! Thank you for joining this interview for ${company}. Let's start with a brief introduction. Can you tell me about yourself and your technical background?`;
    
    interviewHistories[userId] = [{ sender: 'AI', text: firstQuestion }];

    return res.json({
      success: true,
      message: firstQuestion,
    });
  } catch (error) {
    next(error);
  }
};

export const respondMockInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { message, company } = req.body;
    if (!message || !company) {
      return res.status(400).json({ success: false, message: 'Message and company are required' });
    }

    if (!interviewHistories[userId]) {
      interviewHistories[userId] = [];
    }

    interviewHistories[userId].push({ sender: 'USER', text: message });

    // Generate next interview question dynamically using Gemini
    const nextQuestion = await generateNextInterviewQuestion(company, interviewHistories[userId]);

    interviewHistories[userId].push({ sender: 'AI', text: nextQuestion });

    return res.json({
      success: true,
      message: nextQuestion,
    });
  } catch (error) {
    next(error);
  }
};

export const endMockInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { company } = req.body;
    if (!company) {
      return res.status(400).json({ success: false, message: 'Company is required' });
    }

    const history = interviewHistories[userId] || [];
    if (history.length < 2) {
      return res.status(400).json({ success: false, message: 'Interview transcript is too short to evaluate.' });
    }

    const feedback = await generateInterviewFeedback(company, history);
    
    // Log the Mock Attempt in database
    await prisma.mockTestAttempt.create({
      data: {
        userId,
        mockTestId: (await prisma.mockTest.findFirst({ where: { company } }))?.id || '',
        score: feedback.overallScore,
      },
    });

    // Reset history
    delete interviewHistories[userId];

    return res.json({
      success: true,
      feedback,
    });
  } catch (error) {
    next(error);
  }
};
