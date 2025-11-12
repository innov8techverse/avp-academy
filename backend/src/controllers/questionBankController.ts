import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { logger } from '../config/logger';
import type { Prisma, QuestionType, DifficultyLevel } from '@prisma/client';

// Get Questions from Question Bank
export const getQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      qp_code_id, 
      topic, 
      difficulty, 
      type 
    } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Prisma.QuestionWhereInput = {};
    
    if (search) {
      where.OR = [
        { question_text: { contains: search as string, mode: 'insensitive' } },
        { topic: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (qp_code_id) where.qp_code_id = parseInt(qp_code_id as string);
    if (topic) where.topic = topic as string;
    if (difficulty) where.difficulty = difficulty as DifficultyLevel;
    if (type) where.type = type as QuestionType;

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          qp_code: true
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.question.count({ where })
    ]);

    res.json({
      success: true,
      data: questions,
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Get questions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch questions' });
  }
};

// Get total count of questions
export const getQuestionsCount = async (req: AuthRequest, res: Response) => {
  try {
    const { search, qp_code_id, topic, difficulty, type } = req.query;

    const where: Prisma.QuestionWhereInput = {};
    
    if (search) {
      where.OR = [
        { question_text: { contains: search as string, mode: 'insensitive' } },
        { topic: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (qp_code_id) where.qp_code_id = parseInt(qp_code_id as string);
    if (topic) where.topic = topic as string;
    if (difficulty) where.difficulty = difficulty as DifficultyLevel;
    if (type) where.type = type as QuestionType;

    const total = await prisma.question.count({ where });

    res.json({
      success: true,
      data: { total }
    });
  } catch (error) {
    logger.error('Get questions count error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch questions count' });
  }
};

// Create Question
export const createQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const {
      question_text,
      type,
      qp_code_id,
      topic,
      difficulty,
      options,
      correct_answer,
      explanation,
      marks,
      question_paper_code,
      left_side,
      right_side,
      paper_id,
      order_index
    } = req.body;

    // Use transaction to handle both question creation and paper linking
    const result = await prisma.$transaction(async (tx) => {
      // Create the question
      const newQuestion = await tx.question.create({
        data: {
          question_text,
          type,
          qp_code_id: qp_code_id || null,
          topic,
          difficulty,
          options,
          correct_answer,
          explanation,
          question_paper_code,
          marks: marks || 1,
          left_side,
          right_side
        },
        include: {
          qp_code: true
        }
      });

      // If paper_id is provided, link the question to the paper
      if (paper_id) {
        // Verify the question paper exists
        const questionPaper = await (tx as any).questionPaper.findUnique({
          where: { paper_id: parseInt(paper_id) }
        });

        if (!questionPaper) {
          throw new Error('Question paper not found');
        }

        // Add question to paper
        await (tx as any).question_paper_questions.create({
          data: {
            paper_id: parseInt(paper_id),
            question_id: newQuestion.question_id,
            question_number: order_index || 1,
            marks: marks || 1
          }
        });
      }

      return newQuestion;
    });

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: result
    });
  } catch (error) {
    logger.error('Create question error:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to create question' 
    });
  }
};

// Update Question
export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const questionId = parseInt(id);

    if (isNaN(questionId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid question ID'
      });
      return;
    }

    // Filter out read-only fields that shouldn't be updated
    const {
      question_id,
      created_at,
      updated_at,
      qp_code,
      question_paper_questions,
      quiz_questions,
      user_answers,
      ...allowedUpdateData
    } = updateData;

    // Debug logging
    console.log('🔍 Update Question Debug:', {
      questionId,
      originalData: updateData,
      filteredData: allowedUpdateData
    });

    const question = await prisma.question.update({
      where: { question_id: questionId },
      data: allowedUpdateData,
      include: {
        qp_code: {
          select: {
            qp_code_id: true,
            code: true,
            description: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    logger.error('Update question error:', error);
    res.status(500).json({ success: false, message: 'Failed to update question' });
  }
};

// Delete Question
export const deleteQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const questionId = parseInt(id);

    if (isNaN(questionId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid question ID'
      });
      return;
    }

    // Check if question is used in any quiz
    const quizQuestion = await prisma.quizQuestion.findFirst({
      where: { question_id: questionId }
    });

    if (quizQuestion) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete question as it is used in tests'
      });
      return;
    }

    await prisma.question.delete({
      where: { question_id: questionId }
    });

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    logger.error('Delete question error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete question' });
  }
};

// Get Question by ID
export const getQuestionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const questionId = parseInt(id);

    if (isNaN(questionId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid question ID'
      });
      return;
    }

    const question = await prisma.question.findUnique({
      where: { question_id: questionId }
    });

    if (!question) {
      res.status(404).json({
        success: false,
        message: 'Question not found'
      });
      return;
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    logger.error('Get question by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch question' });
  }
};

// Bulk Import Questions
export const bulkImportQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Questions array is required'
      });
      return;
    }

    const createdQuestions = await prisma.question.createMany({
      data: questions.map(q => ({
        question_text: q.question_text,
        type: q.type,
        qp_code_id: q.qp_code_id,
        topic: q.topic,
        difficulty: q.difficulty,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        marks: q.marks || 1
      })),
      skipDuplicates: true
    });

    res.json({
      success: true,
      message: `${createdQuestions.count} questions imported successfully`,
      data: { count: createdQuestions.count }
    });
  } catch (error) {
    logger.error('Bulk import questions error:', error);
    res.status(500).json({ success: false, message: 'Failed to import questions' });
  }
};
