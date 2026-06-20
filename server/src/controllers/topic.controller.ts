import { Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { topics: true },
        },
      },
    });
    return res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

export const getTopicsByCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { categorySlug } = req.params;
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: {
        topics: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    return res.json({ success: true, topics: category.topics, categoryName: category.name });
  } catch (error) {
    next(error);
  }
};

export const getTopicBySlug = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const topic = await prisma.topic.findUnique({
      where: { slug },
      include: {
        category: true,
      },
    });

    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    // Parse serialized string fields
    const parsedTopic = {
      ...topic,
      formula: JSON.parse(topic.formula),
      examples: JSON.parse(topic.examples),
      shortcuts: JSON.parse(topic.shortcuts),
    };

    return res.json({ success: true, topic: parsedTopic });
  } catch (error) {
    next(error);
  }
};

export const getPersonalizedRoadmap = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Fetch existing roadmap or generate a new one
    let roadmap = await prisma.personalizedRoadmap.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!roadmap) {
      // Generate a mock personalized weekly plan based on the standard topics
      const weeklyPlan = [
        {
          week: 1,
          theme: 'Foundation in Quantitative Aptitude',
          tasks: [
            { topic: 'Percentages', status: 'TODO', reason: 'Critical starting block for arithmetic.' },
            { topic: 'Ratios & Proportions', status: 'TODO', reason: 'High weightage topic for Accenture and TCS.' }
          ]
        },
        {
          week: 2,
          theme: 'Analytical and Logical Reasoning',
          tasks: [
            { topic: 'Syllogisms', status: 'TODO', reason: 'Build deductive reasoning skills.' },
            { topic: 'Blood Relations', status: 'TODO', reason: 'Common puzzle format in Capgemini tests.' }
          ]
        },
        {
          week: 3,
          theme: 'Data Analysis and Verbal Skills',
          tasks: [
            { topic: 'Data Interpretation', status: 'TODO', reason: 'Essential for corporate roles.' },
            { topic: 'Sentence Correction', status: 'TODO', reason: 'Important for verbal assessment round.' }
          ]
        },
        {
          week: 4,
          theme: 'Programming & Interview Drill',
          tasks: [
            { topic: 'Programming MCQs', status: 'TODO', reason: 'Prepares for core technical questions.' },
            { topic: 'Mock Interview Prep', status: 'TODO', reason: 'Integrate skill sets for final round.' }
          ]
        }
      ];

      roadmap = await prisma.personalizedRoadmap.create({
        data: {
          userId,
          weekData: JSON.stringify(weeklyPlan),
        },
      });
    }

    const roadmapData = typeof roadmap.weekData === 'string' ? JSON.parse(roadmap.weekData) : roadmap.weekData;

    return res.json({ success: true, roadmap: roadmapData });
  } catch (error) {
    next(error);
  }
};
