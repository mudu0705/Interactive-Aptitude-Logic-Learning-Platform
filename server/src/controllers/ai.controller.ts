import { Response, NextFunction } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import prisma from '../services/db.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { explainConcept, generateInterviewFeedback, generateAIQuestion } from '../services/ai.service';
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

    // Generate next interview question dynamically
    const nextQuestionPrompt = `You are conducting a professional technical job interview for the company ${company}.
    The interview transcript so far:
    ${interviewHistories[userId].map(h => `${h.sender}: ${h.text}`).join('\n')}
    
    Ask the candidate the next logical question. Keep it to 1 short question (e.g. follow up on their project, ask about DSA, or a logic puzzle). Do not say anything else.`;

    const fallbackQuestions = [
      'That sounds interesting. Can you tell me about the database structure you chose for your main project and why?',
      'How would you design a system to handle high concurrency in a login flow?',
      'Can you explain the difference between processes and threads in an operating system?',
      'Thank you. We have completed the technical portion. Feel free to conclude when you are ready to receive your report.'
    ];

    const currentTurn = interviewHistories[userId].filter(h => h.sender === 'USER').length;
    const fallbackQ = fallbackQuestions[currentTurn - 1] || fallbackQuestions[fallbackQuestions.length - 1];

    // Import callGemini or invoke explainConcept logic directly
    // Let's use a smart mock call that requests the next conversational hook
    const explanation = await explainConcept(`${company} Interview`, nextQuestionPrompt);
    const lines = explanation.split('\n').filter(l => l.trim().length > 0 && !l.includes('###') && !l.includes('*'));
    const nextQuestion = lines[0] || fallbackQ;

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
