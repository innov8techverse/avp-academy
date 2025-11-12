import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { logger } from '../config/logger';
import type { Prisma } from '@prisma/client';

// Create a new question paper with QP Code

export const createQuestionPaper = async (req: AuthRequest, res: Response) => {
  try {
    const {
      paper_name,
      qp_code_id,
      total_marks,
      total_questions,
      duration_minutes,
      description,
      difficulty_distribution,
      questions
    } = req.body;

    // Validate QP Code exists
    const qpCode = await prisma.qPCode.findUnique({
      where: { qp_code_id: parseInt(qp_code_id) }
    });

    if (!qpCode) {
      return res.status(400).json({
        success: false,
        message: 'QP Code not found'
      });
    }

    // Generate unique paper code
    const timestamp = Date.now();
    const paper_code = `${qpCode.code}-${timestamp}`;

    const questionPaper = await prisma.questionPaper.create({
      data: {
        paper_code,
        paper_name,
        qp_code_id: parseInt(qp_code_id),
        total_marks: total_marks ? parseInt(total_marks) : 0,
        total_questions: total_questions ? parseInt(total_questions) : 0,
        duration_minutes: duration_minutes ? parseInt(duration_minutes) : null,
        description: description || qpCode.description,
        difficulty_distribution
      },
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

    // Save questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const result = await prisma.$transaction(async (tx) => {
        const paperQuestions = [];
        let totalMarks = 0;
        let createdCount = 0;
        let linkedCount = 0;
        let skippedCount = 0;

        console.log(`🔄 Processing ${questions.length} questions for QP Code ID: ${qp_code_id}, Paper ID: ${questionPaper.paper_id}`);

        // Get the current max question number for this paper ONCE at the beginning
        const currentMaxQuestion = await tx.question_paper_questions.findFirst({
          where: { paper_id: questionPaper.paper_id },
          orderBy: { question_number: 'desc' },
          select: { question_number: true }
        });

        let nextQuestionNumber = (currentMaxQuestion?.question_number || 0) + 1;

        // Process each question individually with improved duplicate detection
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          let questionId: number;

          try {
            // Enhanced duplicate detection - check multiple fields for better accuracy
            const existingQuestion = await tx.question.findFirst({
              where: {
                qp_code_id: parseInt(qp_code_id),
                question_text: q.question_text,
                type: q.type,
                correct_answer: q.correct_answer
              },
              select: { 
                question_id: true,
                question_text: true,
                usage_count: true
              }
            });

            if (existingQuestion) {
              // Use existing question ID and update usage count
              questionId = existingQuestion.question_id;
              await tx.question.update({
                where: { question_id: questionId },
                data: { 
                  usage_count: { increment: 1 },
                  last_used_date: new Date()
                }
              });
              console.log(`✅ Found existing question ID ${questionId} (usage: ${existingQuestion.usage_count + 1})`);
            } else {
              // Create new question with proper error handling
              const newQuestion = await tx.question.create({
                data: {
        question_text: q.question_text,
        type: q.type,
        qp_code_id: parseInt(qp_code_id),
        topic: q.topic || null,
        difficulty: q.difficulty || 'MEDIUM',
        options: q.options || null,
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
        marks: q.marks || 1,
        left_side: q.left_side || null,
        right_side: q.right_side || null,
                  tags: q.tags || [],
                  usage_count: 1,
                  last_used_date: new Date()
                }
              });
              questionId = newQuestion.question_id;
              createdCount++;
              console.log(`🆕 Created new question ID ${questionId}: ${q.question_text.substring(0, 50)}...`);
            }

            // Check if this question is already linked to this specific paper
            const existingLink = await tx.question_paper_questions.findFirst({
        where: {
                paper_id: questionPaper.paper_id,
                question_id: questionId
              }
            });

            if (!existingLink) {
              // Use sequential numbering for new questions
              paperQuestions.push({
        paper_id: questionPaper.paper_id,
                question_id: questionId,
                question_number: nextQuestionNumber,
                marks: q.marks || 1
              });
              totalMarks += (q.marks || 1);
              linkedCount++;
              console.log(`🔗 Will link question ID ${questionId} to paper as question #${nextQuestionNumber} with ${q.marks || 1} marks`);
              
              // Increment for next question
              nextQuestionNumber++;
            } else {
              skippedCount++;
              console.log(`⏭️ Question ID ${questionId} already linked to this paper (Link ID: ${existingLink.id}), skipping...`);
              // Still count towards total marks if question is part of this paper
              totalMarks += (q.marks || 1);
            }

          } catch (error) {
            console.error(`❌ Error processing question ${i + 1}:`, error);
            // Continue with other questions instead of failing completely
            continue;
          }
        }

        // Create all the question-paper links at once with proper error handling
        if (paperQuestions.length > 0) {
          try {
            const createResult = await tx.question_paper_questions.createMany({
              data: paperQuestions,
              skipDuplicates: true // Database-level safety
            });
            console.log(`✅ Successfully linked ${createResult.count} questions to paper`);
          } catch (linkError) {
            console.error('❌ Error creating question-paper links:', linkError);
            throw linkError; // This will rollback the transaction
          }
        }

        // Get actual counts from database for accuracy
        const actualQuestionCount = await tx.question_paper_questions.count({
          where: { paper_id: questionPaper.paper_id }
        });

        const actualTotalMarks = await tx.question_paper_questions.aggregate({
          where: { paper_id: questionPaper.paper_id },
          _sum: { marks: true }
        });

        // Update paper with accurate totals
        await tx.questionPaper.update({
        where: { paper_id: questionPaper.paper_id },
        data: {
            total_questions: actualQuestionCount,
            total_marks: actualTotalMarks._sum.marks || 0
          }
        });

        return {
          totalQuestions: actualQuestionCount,
          totalMarks: actualTotalMarks._sum.marks || 0,
          createdCount,
          linkedCount,
          skippedCount
        };
      });

      console.log(`📊 Transaction completed successfully:`);
      console.log(`   📝 Questions created: ${result.createdCount}`);
      console.log(`   🔗 Questions linked: ${result.linkedCount}`);
      console.log(`   ⏭️ Questions skipped: ${result.skippedCount}`);
      console.log(`   📊 Total questions in paper: ${result.totalQuestions}`);
      console.log(`   🎯 Total marks: ${result.totalMarks}`);
    }

    // Log usage history
    await prisma.qPCodeUsageHistory.create({
      data: {
        qp_code_id: parseInt(qp_code_id),
        paper_id: questionPaper.paper_id,
        action_type: 'CREATE',
        details: {
          paper_code,
          paper_name,
          description: description || qpCode.description,
          total_questions: questions?.length || 0,
          total_marks: questions?.reduce((sum: number, q: any) => sum + (q.marks || 1), 0) || 0
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Question paper created successfully',
      data: questionPaper
    });
  } catch (error) {
    logger.error('Create question paper error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create question paper' });
  }
};

// Get all question papers with QP Code filtering
export const getQuestionPapers = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      qp_code_id,
      is_active 
    } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Prisma.QuestionPaperWhereInput = {};
    
    if (search) {
      where.OR = [
        { paper_code: { contains: search as string, mode: 'insensitive' } },
        { paper_name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (qp_code_id) where.qp_code_id = parseInt(qp_code_id as string);
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const [papers, total] = await Promise.all([
      prisma.questionPaper.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
        include: {
          qp_code: {
            select: {
              qp_code_id: true,
              code: true,
              description: true
            }
          },
          _count: {
            select: {
              question_paper_questions: true
            }
          }
        }
      }),
      prisma.questionPaper.count({ where })
    ]);

    return res.json({
      success: true,
      data: papers,
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Get question papers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch question papers' });
  }
};

// Get questions for a specific question paper (for frontend components that need just the questions)
export const getQuestionPaperQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const paperId = parseInt(id);
    const { page = 1, limit = 100 } = req.query;

    if (isNaN(paperId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question paper ID'
      });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Get the question paper to verify it exists
    const questionPaper = await prisma.questionPaper.findUnique({
      where: { paper_id: paperId },
      select: { paper_id: true, paper_name: true, paper_code: true }
    });

    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found'
      });
    }

    // First, let's check if there are any questions linked to this paper
    const questionCount = await prisma.question_paper_questions.count({
      where: { paper_id: paperId }
    });

    console.log(`🔍 Paper ${paperId} has ${questionCount} linked questions`);

    // Get questions for this paper with pagination
    const [questions, total] = await Promise.all([
      prisma.question_paper_questions.findMany({
        where: { paper_id: paperId },
        skip,
        take: parseInt(limit as string),
        orderBy: { question_number: 'asc' },
        include: {
          questions: {
            include: {
              qp_code: {
                select: {
                  qp_code_id: true,
                  code: true,
                  description: true
                }
              }
            }
          }
        }
      }),
      prisma.question_paper_questions.count({
        where: { paper_id: paperId }
      })
    ]);

    // Also get the raw questions to debug
    const rawQuestions = await prisma.question.findMany({
      where: {
        question_paper_questions: {
          some: { paper_id: paperId }
        }
      },
      select: {
        question_id: true,
        question_text: true,
        type: true,
        difficulty: true
      },
      take: 3 // Just first 3 for debugging
    });

    console.log(`🔍 Raw questions for paper ${paperId}:`, rawQuestions.map(q => ({
      id: q.question_id,
      text: q.question_text?.substring(0, 100) + '...',
      hasText: !!q.question_text,
      textLength: q.question_text?.length || 0
    })));

    // Transform the data to flatten the question structure
    const transformedQuestions = questions.map((item) => ({
      ...item.questions, // Spread the actual question data
      question_number: item.question_number,
      marks: item.marks,
      paper_question_id: item.id // Keep the junction table ID if needed
    }));

    console.log(`📊 getQuestionPaperQuestions Debug:`, {
      paperId,
      totalQuestionsFound: questions.length,
      firstQuestion: questions[0] ? {
        id: questions[0].id,
        question_number: questions[0].question_number,
        marks: questions[0].marks,
        hasQuestionData: !!questions[0].questions,
        questionText: questions[0].questions?.question_text?.substring(0, 50) + '...',
        questionId: questions[0].questions?.question_id
      } : null,
      transformedFirst: transformedQuestions[0] ? {
        question_id: transformedQuestions[0].question_id,
        question_text: transformedQuestions[0].question_text?.substring(0, 50) + '...',
        question_number: transformedQuestions[0].question_number
      } : null
    });

    return res.json({
      success: true,
      data: transformedQuestions, // Return flattened questions array
      paper: questionPaper, // Move paper info to top level
      total_questions: total, // Move total to top level
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Get question paper questions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch question paper questions' });
  }
};

// Get a specific question paper with questions
export const getQuestionPaper = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const paperId = parseInt(id);

    if (isNaN(paperId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question paper ID'
      });
    }

    const questionPaper = await prisma.questionPaper.findUnique({
      where: { paper_id: paperId },
      include: {
        qp_code: {
          select: {
            qp_code_id: true,
            code: true,
            description: true
          }
        },
        question_paper_questions: {
          orderBy: [
            { question_number: 'asc' }
          ],
          include: {
            questions: {
              include: {
                qp_code: {
                  select: {
                    qp_code_id: true,
                    code: true,
                    description: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            question_paper_questions: true
          }
        }
      }
    });

    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found'
      });
    }

    return res.json({
      success: true,
      data: questionPaper
    });
  } catch (error) {
    logger.error('Get question paper error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch question paper' });
  }
};

// Update question paper
export const updateQuestionPaper = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const paperId = parseInt(id);
    const updateData = req.body;

    if (isNaN(paperId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question paper ID'
      });
    }

    // If code is being updated, check for uniqueness
    if (updateData.paper_code) {
      const existingPaper = await prisma.questionPaper.findFirst({
        where: {
          paper_code: updateData.paper_code,
          paper_id: { not: paperId }
        }
      });

      if (existingPaper) {
        return res.status(400).json({
          success: false,
          message: 'Question paper code already exists'
        });
      }
    }

    const questionPaper = await prisma.questionPaper.update({
      where: { paper_id: paperId },
      data: updateData,
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

    // Log usage history
    await prisma.qPCodeUsageHistory.create({
      data: {
        qp_code_id: questionPaper.qp_code_id,
        paper_id: paperId,
        action_type: 'UPDATE',
        details: updateData
      }
    });

    return res.json({
      success: true,
      message: 'Question paper updated successfully',
      data: questionPaper
    });
  } catch (error) {
    logger.error('Update question paper error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update question paper' });
  }
};

// Delete question paper
export const deleteQuestionPaper = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const paperId = parseInt(id);

    if (isNaN(paperId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question paper ID'
      });
    }

    // Get paper info for history
    const questionPaper = await prisma.questionPaper.findUnique({
      where: { paper_id: paperId },
      select: { qp_code_id: true, paper_code: true, paper_name: true }
    });

    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found'
      });
    }

    // Check if paper has questions in the junction table
    const paperQuestions = await prisma.question_paper_questions.findFirst({
      where: { paper_id: paperId }
    });

    // Debug logging
    console.log('🔍 Delete Question Paper Debug:', {
      paperId,
      qpCodeId: questionPaper.qp_code_id,
      paperCode: questionPaper.paper_code,
      hasJunctionQuestions: !!paperQuestions,
      paperQuestions: paperQuestions ? 'Found' : 'None'
    });

    if (paperQuestions) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete question paper as it contains questions. Please remove all questions first.'
      });
    }

    await prisma.questionPaper.delete({
      where: { paper_id: paperId }
    });

    // Log usage history
    await prisma.qPCodeUsageHistory.create({
      data: {
        qp_code_id: questionPaper.qp_code_id,
        paper_id: paperId,
        action_type: 'DELETE',
        details: {
          paper_code: questionPaper.paper_code,
          paper_name: questionPaper.paper_name
        }
      }
    });

    return res.json({
      success: true,
      message: 'Question paper deleted successfully'
    });
  } catch (error) {
    logger.error('Delete question paper error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete question paper' });
  }
};

// Get questions by QP Code
export const getQuestionsByQPCode = async (req: AuthRequest, res: Response) => {
  try {
    const { qp_code_id } = req.params;
    const { page = 1, limit = 20, search, type, difficulty } = req.query;

    console.log('🔍 getQuestionsByQPCode called with:', {
      qp_code_id,
      page,
      limit,
      search,
      type,
      difficulty,
      timestamp: new Date().toISOString()
    });

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const qpCodeIdInt = parseInt(qp_code_id);

    if (isNaN(qpCodeIdInt)) {
      console.log('🔍 Invalid QP Code ID:', qp_code_id);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid QP Code ID',
        qp_code_id: qp_code_id
      });
    }

    const where: Prisma.QuestionWhereInput = {
      qp_code_id: qpCodeIdInt
    };

    if (search) {
      where.question_text = { contains: search as string, mode: 'insensitive' };
    }

    if (type) where.type = type as any;
    if (difficulty) where.difficulty = difficulty as any;

    console.log('🔍 Database query where clause:', where);

    // First check if QP Code exists
    const qpCodeExists = await prisma.qPCode.findUnique({
      where: { qp_code_id: qpCodeIdInt },
      select: { qp_code_id: true, code: true, description: true }
    });

    console.log('🔍 QP Code exists check:', {
      qpCodeIdInt,
      qpCodeExists
    });

    if (!qpCodeExists) {
      console.log('🔍 QP Code not found in database:', qpCodeIdInt);
      return res.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: 0
        },
        message: 'QP Code not found'
      });
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
        include: {
          qp_code: {
            select: {
              qp_code_id: true,
              code: true,
              description: true
            }
          }
        }
      }),
      prisma.question.count({ where })
    ]);

    console.log('🔍 Found questions:', {
      count: questions.length,
      total,
      questionTypes: questions.map(q => q.type),
      firstFewQuestions: questions.slice(0, 3).map(q => ({
        id: q.question_id,
        type: q.type,
        text: q.question_text?.substring(0, 50) + '...'
      }))
    });

    return res.json({
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
    logger.error('Get questions by QP code error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch questions' });
  }
};

// Get all questions (for Question Bank)
export const getAllQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search, type, difficulty, qp_code_id } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Prisma.QuestionWhereInput = {};

    if (search) {
      where.question_text = { contains: search as string, mode: 'insensitive' };
    }

    if (type) where.type = type as any;
    if (difficulty) where.difficulty = difficulty as any;
    if (qp_code_id && qp_code_id !== 'all') where.qp_code_id = parseInt(qp_code_id as string);

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
        include: {
          qp_code: {
            select: {
              qp_code_id: true,
              code: true,
              description: true
            }
          }
        }
      }),
      prisma.question.count({ where })
    ]);

    return res.json({
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
    logger.error('Get all questions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch questions' });
  }
};

// Add questions to a question paper
export const addQuestionsToPaper = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const paperId = parseInt(id);
    const { questions } = req.body; // Array of { question_id, question_number, marks }

    if (isNaN(paperId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question paper ID'
      });
    }

    // Verify question paper exists
    const questionPaper = await prisma.questionPaper.findUnique({
      where: { paper_id: paperId },
      include: { qp_code: true }
    });

    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found'
      });
    }

    // Add questions to paper with CSV import logic (create if not exists, reuse if exists)
    const result = await prisma.$transaction(async (tx) => {
      // Get current max question number
      const currentMaxQuestion = await tx.question_paper_questions.findFirst({
        where: { paper_id: paperId },
        orderBy: { question_number: 'desc' },
        select: { question_number: true }
      });

      let nextQuestionNumber = (currentMaxQuestion?.question_number || 0) + 1;
      let addedCount = 0;
      let skippedCount = 0;
      let createdCount = 0;
      let reusedCount = 0;

      // Process each question with CSV import logic
      for (const questionData of questions) {
        // Check if question already exists (avoid duplicates)
        const existingQuestion = await tx.question.findFirst({
          where: {
            qp_code_id: questionPaper.qp_code_id,
            question_text: questionData.question_text,
            type: questionData.type,
            correct_answer: questionData.correct_answer
          }
        });

        let question;
        if (existingQuestion) {
          // Use existing question and update usage count
          question = existingQuestion;
          await tx.question.update({
            where: { question_id: existingQuestion.question_id },
            data: { 
              usage_count: { increment: 1 },
              last_used_date: new Date()
            }
          });
          console.log(`✅ Reusing existing question ID ${existingQuestion.question_id}`);
          reusedCount++;
        } else {
          // Create new question
          question = await tx.question.create({
            data: {
              question_text: questionData.question_text,
              type: questionData.type,
              qp_code_id: questionPaper.qp_code_id,
              topic: questionData.topic,
              difficulty: questionData.difficulty || 'MEDIUM',
              options: questionData.options,
              correct_answer: questionData.correct_answer,
              explanation: questionData.explanation,
              marks: questionData.marks || 1,
              left_side: questionData.left_side,
              right_side: questionData.right_side,
              tags: questionData.tags || [],
              usage_count: 1,
              last_used_date: new Date()
            }
          });
          console.log(`🆕 Created new question ID ${question.question_id}`);
          createdCount++;
        }

        // Check if already linked to avoid duplicates
        const existingLink = await tx.question_paper_questions.findFirst({
          where: {
            paper_id: paperId,
            question_id: question.question_id
          }
        });

        if (!existingLink) {
          // Add to paper with proper numbering
          await tx.question_paper_questions.create({
            data: {
              paper_id: paperId,
              question_id: question.question_id,
              question_number: questionData.question_number || nextQuestionNumber++,
              marks: questionData.marks || 1
            }
          });
          console.log(`🔗 Linked question ${question.question_id} as #${nextQuestionNumber - 1}`);
          addedCount++;
        } else {
          console.log(`⏭️ Question ${question.question_id} already linked, skipping`);
          skippedCount++;
        }
      }

      console.log(`📊 addQuestionsToPaper results: ${addedCount} added, ${createdCount} created, ${reusedCount} reused, ${skippedCount} skipped`);

      return { addedCount, createdCount, reusedCount, skippedCount };
    });

    // Update total questions count
    const totalQuestions = await prisma.question_paper_questions.count({
      where: { paper_id: paperId }
    });

    await prisma.questionPaper.update({
      where: { paper_id: paperId },
      data: { total_questions: totalQuestions }
    });

    return res.json({
      success: true,
      message: `Questions processed: ${result.addedCount} added (${result.createdCount} created, ${result.reusedCount} reused), ${result.skippedCount} skipped (duplicates)`,
      data: { 
        added: result.addedCount,
        created: result.createdCount,
        reused: result.reusedCount,
        skipped: result.skippedCount,
        total_questions: totalQuestions 
      }
    });
  } catch (error) {
    logger.error('Add questions to paper error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add questions to paper' });
  }
};

// Remove a question from a question paper
export const removeQuestionFromPaper = async (req: AuthRequest, res: Response) => {
  try {
    const { id, qid } = req.params;
    const paperId = parseInt(id);
    const questionId = parseInt(qid);

    if (isNaN(paperId) || isNaN(questionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid paper ID or question ID'
      });
    }

    await prisma.question_paper_questions.deleteMany({
      where: {
        paper_id: paperId,
        question_id: questionId
      }
    });

    // Update total questions count
    const totalQuestions = await prisma.question_paper_questions.count({
      where: { paper_id: paperId }
    });

    await prisma.questionPaper.update({
      where: { paper_id: paperId },
      data: { total_questions: totalQuestions }
    });

    return res.json({
      success: true,
      message: 'Question removed from paper successfully',
      data: { total_questions: totalQuestions }
    });
  } catch (error) {
    logger.error('Remove question from paper error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove question from paper' });
  }
};

// Get available question papers for dropdown (QP Code based)
export const getQuestionPapersForDropdown = async (req: AuthRequest, res: Response) => {
  try {
    const { qp_code_id } = req.query;

    const where: Prisma.QuestionPaperWhereInput = {
      is_active: true
    };

    if (qp_code_id) where.qp_code_id = parseInt(qp_code_id as string);

    const papers = await prisma.questionPaper.findMany({
      where,
      select: {
        paper_id: true,
        paper_code: true,
        paper_name: true,
        description: true,
        qp_code: {
          select: {
            qp_code_id: true,
            code: true,
            description: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return res.json({
      success: true,
      data: papers
    });
  } catch (error) {
    logger.error('Get question papers for dropdown error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch question papers' });
  }
};

// Import questions from CSV
export const importQuestionsFromCSV = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const paperId = parseInt(id);
    const { questions } = req.body; // Array of question objects from CSV

    if (isNaN(paperId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question paper ID'
      });
    }

    // Verify question paper exists
    const questionPaper = await prisma.questionPaper.findUnique({
      where: { paper_id: paperId },
      include: { qp_code: true }
    });

    if (!questionPaper) {
      return res.status(404).json({
        success: false,
        message: 'Question paper not found'
      });
    }

    // Create questions and add to paper with proper numbering
    const createdQuestions = await prisma.$transaction(async (tx) => {
      // Get current max question number
      const currentMaxQuestion = await tx.question_paper_questions.findFirst({
        where: { paper_id: paperId },
        orderBy: { question_number: 'desc' },
        select: { question_number: true }
      });

      let nextQuestionNumber = (currentMaxQuestion?.question_number || 0) + 1;
      const created = [];

    for (const questionData of questions) {
        // Check if question already exists (avoid duplicates)
        const existingQuestion = await tx.question.findFirst({
          where: {
            qp_code_id: questionPaper.qp_code_id,
            question_text: questionData.question_text,
            type: questionData.type,
            correct_answer: questionData.correct_answer
          }
        });

        let question;
        if (existingQuestion) {
          // Use existing question
          question = existingQuestion;
          await tx.question.update({
            where: { question_id: existingQuestion.question_id },
            data: { 
              usage_count: { increment: 1 },
              last_used_date: new Date()
            }
          });
          console.log(`✅ Reusing existing question ID ${existingQuestion.question_id}`);
        } else {
          // Create new question
          question = await tx.question.create({
        data: {
          question_text: questionData.question_text,
          type: questionData.type,
          qp_code_id: questionPaper.qp_code_id,
          topic: questionData.topic,
          difficulty: questionData.difficulty || 'MEDIUM',
          options: questionData.options,
          correct_answer: questionData.correct_answer,
          explanation: questionData.explanation,
          marks: questionData.marks || 1,
          left_side: questionData.left_side,
          right_side: questionData.right_side,
              tags: questionData.tags || [],
              usage_count: 1,
              last_used_date: new Date()
            }
          });
          console.log(`🆕 Created new question ID ${question.question_id}`);
        }

        // Check if already linked to avoid duplicates
        const existingLink = await tx.question_paper_questions.findFirst({
          where: {
            paper_id: paperId,
            question_id: question.question_id
          }
        });

        if (!existingLink) {
          // Add to paper with proper numbering
          await tx.question_paper_questions.create({
        data: {
          paper_id: paperId,
          question_id: question.question_id,
              question_number: questionData.question_number || nextQuestionNumber++,
          marks: questionData.marks || 1
        }
      });
          console.log(`🔗 Linked question ${question.question_id} as #${nextQuestionNumber - 1}`);
        } else {
          console.log(`⏭️ Question ${question.question_id} already linked, skipping`);
        }

        created.push(question);
    }

      return created;
    });

    // Update total questions count
    const totalQuestions = await prisma.question_paper_questions.count({
      where: { paper_id: paperId }
    });

    await prisma.questionPaper.update({
      where: { paper_id: paperId },
      data: { total_questions: totalQuestions }
    });

    return res.json({
      success: true,
      message: 'Questions imported successfully',
      data: { 
        imported: createdQuestions.length, 
        total_questions: totalQuestions 
      }
    });
  } catch (error) {
    logger.error('Import questions from CSV error:', error);
    return res.status(500).json({ success: false, message: 'Failed to import questions' });
  }
};

// Get QP Code usage history
export const getQPCodeUsageHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { qp_code_id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [history, total] = await Promise.all([
      prisma.qPCodeUsageHistory.findMany({
        where: { qp_code_id: parseInt(qp_code_id) },
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' }
      }),
      prisma.qPCodeUsageHistory.count({
        where: { qp_code_id: parseInt(qp_code_id) }
      })
    ]);

    return res.json({
      success: true,
      data: history,
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Get QP code usage history error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch usage history' });
  }
};