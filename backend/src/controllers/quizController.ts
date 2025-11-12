import { Response } from 'express';
import { body, query } from 'express-validator';
import { prisma } from '../config/database';
import { AuthRequest, ApiResponse, QuizSubmission, QuizAnswer } from '../types';
import { logger } from '../config/logger';

export const getQuizzesValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('subject').optional().isString(),
  query('type').optional().isIn(['MOCK', 'DAILY', 'SUBJECT_WISE', 'CUSTOM'])
];

export const getQuizzes = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '10', subject, type } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {
      status: 'IN_PROGRESS' as any
    };

    if (subject && subject !== 'all') {
      const subjectIdInt = parseInt(subject as string);
      if (!isNaN(subjectIdInt)) {
        where.subject_id = subjectIdInt;
      } else {
        where.subject_id = null;
      }
    }

    if (type) {
      where.type = type;
    }

    // Filter by user's course if student
    const user = await prisma.user.findUnique({
      where: { user_id: req.user?.user_id },
      include: { student_profile: true }
    });

    if (user?.role === 'STUDENT' && user.student_profile?.course_id) {
      where.course_id = user.student_profile.course_id;
    }

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        include: {
          course: {
            select: {
              course_id: true,
              name: true
            }
          },
          _count: {
            select: {
              questions: true,
              attempts: true
            }
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' }
      }),
      prisma.quiz.count({ where })
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Quizzes retrieved successfully',
      data: quizzes.map(quiz => ({
        ...quiz,
        questionsCount: quiz._count.questions,
        attemptsCount: quiz._count.attempts
      })),
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getQuizById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const quizId = parseInt(id);

    if (isNaN(quizId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid quiz ID'
      });
      return;
    }

    const quiz = await prisma.quiz.findUnique({
      where: { quiz_id: quizId },
      include: {
        course: {
          select: {
            course_id: true,
            name: true
          }
        },
        questions: {
          include: {
            question: {
              select: {
                question_id: true,
                question_text: true,
                type: true,
                options: true,
                marks: true,
                difficulty: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!quiz || quiz.status as string !== 'IN_PROGRESS') {
      res.status(404).json({
        success: false,
        message: 'Quiz not found or not available'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Quiz retrieved successfully',
      data: quiz
    };

    res.json(response);
  } catch (error) {
    logger.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const submitQuizValidation = [
  body('quizId').isString().withMessage('Invalid quiz ID'),
  body('answers').isArray().withMessage('Answers must be an array'),
  body('answers.*.questionId').isString().withMessage('Invalid question ID'),
  body('answers.*.answer').notEmpty().withMessage('Answer is required'),
  body('totalTimeTaken').isInt({ min: 0 }).withMessage('Invalid time taken')
];

export const submitQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { quizId, answers, totalTimeTaken }: QuizSubmission = req.body;
    const userId = req.user!.user_id;
    const quizIdInt = parseInt(quizId);

    if (isNaN(quizIdInt)) {
      res.status(400).json({
        success: false,
        message: 'Invalid quiz ID'
      });
      return;
    }

    const quiz = await prisma.quiz.findUnique({
      where: { quiz_id: quizIdInt },
      include: {
        questions: {
          include: {
            question: true
          }
        }
      }
    });

    if (!quiz || quiz.status as string !== 'IN_PROGRESS') {
      res.status(404).json({
        success: false,
        message: 'Quiz not found or not available'
      });
      return;
    }

    // Check if user already attempted this quiz
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        user_id: userId,
        quiz_id: quizIdInt,
        is_completed: true
      }
    });

    if (existingAttempt) {
      res.status(400).json({
        success: false,
        message: 'Quiz already completed'
      });
      return;
    }

    // Calculate score
    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;

    const answerMap = new Map(answers.map((a: QuizAnswer) => [a.questionId, a.answer]));

    for (const quizQuestion of quiz.questions) {
      const userAnswer = answerMap.get(quizQuestion.question_id.toString());
      const correctAnswer = quizQuestion.question.correct_answer;

      if (userAnswer === correctAnswer) {
        score += quizQuestion.question.marks;
        correctAnswers++;
      } else if (userAnswer && quiz.has_negative_marking && quiz.negative_marks) {
        score -= quiz.negative_marks;
        wrongAnswers++;
      } else if (userAnswer) {
        wrongAnswers++;
      }
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        user_id: userId,
        quiz_id: quizIdInt,
        answers: JSON.stringify(answers),
        score,
        total_questions: quiz.questions.length,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        time_taken: totalTimeTaken,
        is_completed: true,
        submit_time: new Date()
      }
    });

    // Update student profile with new score
    await prisma.studentProfile.update({
      where: { user_id: userId },
      data: {
        total_score: {
          increment: score
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        attemptId: attempt.attempt_id,
        score,
        correctAnswers,
        wrongAnswers,
        totalQuestions: quiz.questions.length,
        timeTaken: totalTimeTaken,
        percentage: Math.round((correctAnswers / quiz.questions.length) * 100),
        passed: quiz.passing_marks ? score >= quiz.passing_marks : false
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getQuizAttempts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const { page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [attempts, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { user_id: userId, is_completed: true },
        include: {
          quiz: {
            select: {
              quiz_id: true,
              title: true,
              total_marks: true,
              passing_marks: true
            }
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { submit_time: 'desc' }
      }),
      prisma.quizAttempt.count({ where: { user_id: userId, is_completed: true } })
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Quiz attempts retrieved successfully',
      data: attempts,
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Get quiz attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
