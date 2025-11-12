import { Response } from 'express';

import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { logger } from '../config/logger';
import EmailService from '../services/emailService';
import type { QuizType } from '@prisma/client';
import { TestStatus } from '@prisma/client';

// Utility function to handle IST timezone properly
const convertFromISTToUTC = (dateString: string): Date => {
  // If the date string doesn't have timezone info, assume it's IST
  if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-')) {
    // Parse the date string as IST and convert to UTC
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(5, 7)) - 1; // Month is 0-indexed
    const day = parseInt(dateString.substring(8, 10));
    const hour = parseInt(dateString.substring(11, 13));
    const minute = parseInt(dateString.substring(14, 16));
    
    // Create date in IST
    const istDate = new Date(year, month, day, hour, minute, 0);
    
    // Convert IST to UTC by subtracting 5.5 hours
    const utcDate = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
    
    return utcDate;
  }
  
  // If it already has timezone info, just parse it
  return new Date(dateString);
};

// Utility function to display times in IST for logging
const toISTString = (date: Date): string => {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Test Creation with Configuration
export const createTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      type,
      courseId,
      subjectId,
      batchIds,
      duration,
      maxMarks,
      scheduledDate, // Legacy field for backward compatibility
      startTime,     // New field: when test becomes available
      endTime,       // New field: when test automatically closes
      autoStart,     // Auto transition to IN_PROGRESS at start time
      autoEnd,       // Auto transition to COMPLETED at end time
      gracePeriod,   // Grace period in minutes after end time
      isCommon,
      questionSource,
      selectedQuestions,
      manualQuestions,

      settings
    } = req.body;

    const parsedMaxMarks = parseInt(maxMarks);
    const parsedDuration = parseInt(duration);
    const parsedPassPercentage = parseInt(settings?.passPercentage || '40');
    const parsedNegativeMarks = parseFloat(settings?.negativeMarkValue || '0');

    const totalQuestions = selectedQuestions?.length || 0;
    const marksPerQuestion =
      totalQuestions > 0 && parsedMaxMarks > 0
        ? Math.floor(parsedMaxMarks / totalQuestions)
        : 1;

    // Map frontend test types to QuizType enum values
    const getQuizType = (frontendType: string): QuizType => {
      switch (frontendType) {
        case 'Mock Test': return 'MOCK';
        case 'Daily Test': return 'DAILY';
        case 'Weekly Test': return 'CUSTOM';
        case 'Monthly Test': return 'CUSTOM';
        default: return 'MOCK';
      }
    };

    // Determine initial status based on scheduling
    let initialStatus: TestStatus = 'DRAFT' as TestStatus;
    const now = new Date();
    
    // If start time is provided and we have auto-start enabled
    if (startTime && autoStart !== false) {
      const startDateTime = new Date(startTime);
      if (startDateTime <= now) {
        // Start time is in the past or now - make it IN_PROGRESS if we have end time or just started
        initialStatus = endTime ? 'IN_PROGRESS' as TestStatus : 'IN_PROGRESS' as TestStatus;
      } else {
        // Start time is in the future - set to NOT_STARTED (will be published but not available)
        initialStatus = 'NOT_STARTED' as TestStatus;
      }
    }

    // Debug timezone conversion
    if (startTime) {
      const utcStartTime = convertFromISTToUTC(startTime);
      logger.info(`🕐 TIMEZONE CONVERSION DEBUG:`, {
        input_start_time: startTime,
        converted_utc: utcStartTime.toISOString(),
        displayed_as_ist: toISTString(utcStartTime)
      });
    }
    if (endTime) {
      const utcEndTime = convertFromISTToUTC(endTime);
      logger.info(`🕐 TIMEZONE CONVERSION DEBUG:`, {
        input_end_time: endTime,
        converted_utc: utcEndTime.toISOString(),
        displayed_as_ist: toISTString(utcEndTime)
      });
    }

    // Create the test
    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        type: getQuizType(type),
        course_id: isCommon ? null : courseId,
        subject_id: isCommon ? null : subjectId,

        time_limit_minutes: parsedDuration,
        total_marks: parsedMaxMarks,
        total_questions: totalQuestions,
        marks_per_question: marksPerQuestion,
        passing_marks: parsedPassPercentage,
        has_negative_marking: settings?.negativeMarks || false,
        negative_marks: parsedNegativeMarks,
        // New scheduling fields (converted from IST to UTC for storage)
        start_time: startTime ? convertFromISTToUTC(startTime) : null,
        end_time_scheduled: endTime ? convertFromISTToUTC(endTime) : null,
        auto_start: autoStart !== false, // Default true
        auto_end: autoEnd !== false,     // Default true  
        grace_period_minutes: gracePeriod ? parseInt(gracePeriod as string) : 5,
        // Legacy field for backward compatibility
        scheduled_at: scheduledDate ? new Date(scheduledDate) : (startTime ? new Date(startTime) : null),
        status: initialStatus,
        is_active: true,
        // Enhanced test configuration settings
        shuffle_questions: settings?.shuffleQuestions ?? true,
        shuffle_options: settings?.shuffleOptions ?? true,
        show_immediate_result: settings?.showImmediateResult ?? false,
        allow_revisit: settings?.allowRevisit ?? true,
        show_correct_answers: settings?.showCorrectAnswers ?? true,
        result_release_time: settings?.resultReleaseTime ? new Date(settings.resultReleaseTime) : null,
        allow_previous_navigation: settings?.allowPreviousNavigation ?? true
      } as any
    });

    // Handle batch assignments if not common test
    if (!isCommon && batchIds && batchIds.length > 0) {
      // Remove existing batch assignments
      await prisma.quizBatch.deleteMany({
        where: { quiz_id: quiz.quiz_id }
      });
      
      // Create new QuizBatch entries for all selected batches
      const quizBatchData = batchIds.map((batchId: number) => ({
        quiz_id: quiz.quiz_id,
        batch_id: batchId
      }));

      await prisma.quizBatch.createMany({
        data: quizBatchData,
        skipDuplicates: true
      });
    } else if (isCommon) {
      // Remove all batch assignments for common tests
      await prisma.quizBatch.deleteMany({
        where: { quiz_id: quiz.quiz_id }
      });
    }

    // Handle questions with proper validation and transaction safety
    if (questionSource === 'questionBank' && selectedQuestions && selectedQuestions.length > 0) {
      await prisma.$transaction(async (tx) => {
        // Remove duplicates from selected questions and ensure they are numbers
        const uniqueQuestionIds: number[] = [...new Set(selectedQuestions.map((id: any) => parseInt(String(id))))].filter((id: any) => !isNaN(id)) as number[];
        
        // Validate that all questions exist
        const existingQuestions = await tx.question.findMany({
          where: { question_id: { in: uniqueQuestionIds } },
          select: { question_id: true, question_text: true, qp_code_id: true }
        });

        if (existingQuestions.length !== uniqueQuestionIds.length) {
          throw new Error(`Some selected questions do not exist. Expected: ${uniqueQuestionIds.length}, Found: ${existingQuestions.length}`);
        }

        // Remove any existing quiz questions to avoid duplicates
        await tx.quizQuestion.deleteMany({
          where: { quiz_id: quiz.quiz_id }
        });

        // Add selected questions to the test with proper ordering
        const quizQuestions = uniqueQuestionIds.map((questionId, index) => ({
        quiz_id: quiz.quiz_id,
        question_id: questionId,
        order: index + 1
      }));

        const result = await tx.quizQuestion.createMany({
        data: quizQuestions,
        skipDuplicates: true
      });

        console.log(`✅ Added ${result.count} questions to quiz ${quiz.quiz_id}`);
      });
    } else if (questionSource === 'manual' && manualQuestions && manualQuestions.length > 0) {
      // Handle manual questions with proper creation and linking
      await prisma.$transaction(async (tx) => {
        // Remove any existing quiz questions first
        await tx.quizQuestion.deleteMany({
          where: { quiz_id: quiz.quiz_id }
        });

        let createdCount = 0;
        let linkedCount = 0;

        for (let i = 0; i < manualQuestions.length; i++) {
          const questionData = manualQuestions[i];
          let questionId: number;

          // Check if question already exists (to avoid duplicates)
          const existingQuestion = await tx.question.findFirst({
            where: {
              question_text: questionData.question_text,
              type: questionData.type,
              correct_answer: questionData.correct_answer,
              // If qp_code_id is provided, include it in the check
              ...(questionData.qp_code_id && { qp_code_id: questionData.qp_code_id })
            },
            select: { question_id: true }
          });

          if (existingQuestion) {
            // Use existing question
            questionId = existingQuestion.question_id;
            
            // Update usage count
            await tx.question.update({
              where: { question_id: questionId },
              data: { 
                usage_count: { increment: 1 },
                last_used_date: new Date()
              }
            });
            
            console.log(`✅ Reusing existing question ID ${questionId}`);
          } else {
            // Create new question
            const newQuestion = await tx.question.create({
              data: {
                question_text: questionData.question_text,
                type: questionData.type,
                topic: questionData.topic || null,
                difficulty: questionData.difficulty || 'MEDIUM',
                options: questionData.options || null,
                correct_answer: questionData.correct_answer,
                explanation: questionData.explanation || null,
                marks: questionData.marks || 1,
                left_side: questionData.left_side || null,
                right_side: questionData.right_side || null,
                tags: questionData.tags || [],
                qp_code_id: questionData.qp_code_id || null,
                usage_count: 1,
                last_used_date: new Date()
              }
            });
            
            questionId = newQuestion.question_id;
            createdCount++;
            console.log(`🆕 Created new question ID ${questionId}`);
          }

          // Link question to quiz
          await tx.quizQuestion.create({
            data: {
              quiz_id: quiz.quiz_id,
              question_id: questionId,
              order: i + 1
            }
          });
          
          linkedCount++;
        }

        console.log(`📊 Manual questions processed: ${createdCount} created, ${linkedCount} linked to quiz ${quiz.quiz_id}`);
      });
    }

    // After successful quiz creation, send email notifications
    try {
      if (isCommon) {
        // Send notification to all students for common tests
        const emailResult = await EmailService.sendQuizNotificationToAllStudents(quiz as any);
        if (emailResult.success) {
          logger.info(`Quiz notification emails sent to ${emailResult.sentTo} students for common test: ${quiz.title}`);
        } else {
          logger.warn(`Some quiz notification emails failed: ${emailResult.errors.join(', ')}`);
        }
      } else if (batchIds && batchIds.length > 0) {
        // Send notification to students in specific batches
        const emailResult = await EmailService.sendQuizNotificationToBatches(quiz as any, batchIds);
        if (emailResult.success) {
          logger.info(`Quiz notification emails sent to ${emailResult.sentTo} students in batches for test: ${quiz.title}`);
        } else {
          logger.warn(`Some quiz notification emails failed: ${emailResult.errors.join(', ')}`);
        }
      }
    } catch (emailError) {
      logger.error('Failed to send quiz notification emails:', emailError);
      // Don't fail the test creation if email notifications fail
    }

    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      data: {
        quiz_id: quiz.quiz_id,
        title: quiz.title,
        type: quiz.type,
        course_id: quiz.course_id,
        subject_id: quiz.subject_id,

        time_limit_minutes: quiz.time_limit_minutes,
        total_marks: quiz.total_marks,
        passing_marks: quiz.passing_marks,
        total_questions: quiz.total_questions,
        marks_per_question: quiz.marks_per_question,
        status: quiz.status,
        scheduled_at: quiz.scheduled_at
      }
    });
  } catch (error) {
    logger.error('Create test error:', error);
    res.status(500).json({ success: false, message: 'Failed to create test' });
  }
};

// Get Tests for Admin
export const getTests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, subject, type, courseId, status } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (subject && subject !== 'all') where.subject_id = parseInt(subject as string);
    if (type && type !== 'all') where.type = type as QuizType;
    if (courseId && courseId !== 'all') where.course_id = parseInt(courseId as string);
    if (status && status !== 'all') {
      if (status === 'Active' || status === 'Published') where.status = 'IN_PROGRESS' as any;
      else if (status === 'Draft') where.status = 'DRAFT';
      else if (status === 'Archived') where.status = 'ARCHIVED';
    }

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          course: { select: { course_id: true, name: true } },
          subject: { select: { subject_id: true, name: true } },
          quiz_batches: { 
            include: { 
              batch: { select: { batch_id: true, batch_name: true } } 
            } 
          },
          questions: { include: { question: true } },
          attempts: true,
          _count: { select: { questions: true, attempts: true } }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.quiz.count({ where })
    ]);

    // Transform data to match frontend expectations (only use selected fields)
    const transformedTests = quizzes.map((quiz: any) => ({
      id: quiz.quiz_id,
      title: quiz.title,
      description: quiz.description,
      type: quiz.type?.toString().replace('_', ' ') || 'Mock Test',
      courseId: quiz.course_id,
      course: quiz.course?.name || 'All Courses',
      subjectId: quiz.subject_id,
      subject: quiz.subject?.name || 'All Subjects',
      batchIds: quiz.quiz_batches?.map((qb: any) => qb.batch.batch_id) || [],
      batches: quiz.quiz_batches?.map((qb: any) => qb.batch.batch_name) || [],
      questions: quiz._count.questions,
      duration: quiz.time_limit_minutes || 0,
      maxMarks: quiz.total_marks || 0,
      attempts: quiz._count.attempts,
      status: quiz.status as string,
      scheduledDate: quiz.scheduled_at ? quiz.scheduled_at.toISOString().split('T')[0] : '',
      // Enhanced scheduling fields
      startTime: quiz.start_time ? quiz.start_time.toISOString() : null,
      endTime: quiz.end_time_scheduled ? quiz.end_time_scheduled.toISOString() : null,
      autoStart: quiz.auto_start ?? true,
      autoEnd: quiz.auto_end ?? true,
      gracePeriod: quiz.grace_period_minutes || 5,
      isCommon: !quiz.course_id && !quiz.subject_id,
      selectedQuestions: quiz.questions,
      leaderboard_enabled: quiz.leaderboard_enabled || false,
      settings: {
        shuffleQuestions: quiz.shuffle_questions ?? true,
        shuffleOptions: quiz.shuffle_options ?? true,
        showImmediateResult: quiz.show_immediate_result ?? false,
        negativeMarks: quiz.has_negative_marking || false,
        negativeMarkValue: quiz.negative_marks || 0,
        timeLimit: true,
        allowRevisit: quiz.allow_revisit ?? true,
        showCorrectAnswers: quiz.show_correct_answers ?? true,
        allowPreviousNavigation: quiz.allow_previous_navigation ?? true,
        resultReleaseTime: quiz.result_release_time ? quiz.result_release_time.toISOString() : null,
        passPercentage: quiz.passing_marks || 40
      },
      createdAt: quiz.created_at.toISOString(),
      updatedAt: quiz.updated_at.toISOString()
    }));

    res.json({
      success: true,
      data: transformedTests,
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Get tests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tests' });
  }
};

// Add Question to Test (Manual or from Question Bank)
export const addQuestionToTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const { questionId } = req.body;
    const testIdInt = parseInt(testId);
    const questionIdInt = parseInt(questionId);

    // Verify test exists
    const quiz = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt }
    });

    if (!quiz) {
      res.status(404).json({
        success: false,
        message: 'Test not found'
      });
      return;
    }

    // Verify question exists
    const question = await prisma.question.findUnique({
      where: { question_id: questionIdInt }
    });

    if (!question) {
      res.status(404).json({
        success: false,
        message: 'Question not found'
      });
      return;
    }

    // Check if question is already in test
    const existingQuestion = await prisma.quizQuestion.findFirst({
      where: {
        quiz_id: testIdInt,
        question_id: questionIdInt
      }
    });

    if (existingQuestion) {
      res.status(400).json({
        success: false,
        message: 'Question already exists in test'
      });
      return;
    }

    // Get the last question's order
    const lastQuestion = await prisma.quizQuestion.findFirst({
      where: { quiz_id: testIdInt },
      orderBy: { order: 'desc' }
    });

    const nextOrder = lastQuestion?.order ? lastQuestion.order + 1 : 1;

    // Add question to test
    await prisma.quizQuestion.create({
      data: {
        quiz_id: testIdInt,
        question_id: question.question_id,
        order: nextOrder
      }
    });

    res.json({
      success: true,
      message: 'Question added to test successfully'
    });
  } catch (error) {
    logger.error('Add question to test error:', error);
    res.status(500).json({ success: false, message: 'Failed to add question to test' });
  }
};

// Test Reports - Test-wise
export const getTestReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const testIdInt = parseInt(testId);

    if (isNaN(testIdInt)) {
      res.status(400).json({
        success: false,
        message: 'Invalid test ID'
      });
      return;
    }

    const test = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt },
      include: {
        course: true,
        questions: {
          include: {
            question: true
          },
          orderBy: { order: 'asc' }
        },
        attempts: {
          include: {
            user: {
              select: {
                user_id: true,
                full_name: true,
                email: true
              }
            }
          },
          orderBy: { score: 'desc' }
        }
      }
    }) as any;

    if (!test) {
      res.status(404).json({
        success: false,
        message: 'Test not found'
      });
      return;
    }

    // Calculate analytics
    const totalAttempts = test.attempts.length;
    const completedAttempts = test.attempts.filter((a: any) => a.is_completed).length;
    const unattendedAttempts = test.attempts.filter((a: any) => a.is_unattended).length;
    const attendedAttempts = test.attempts.filter((a: any) => !a.is_unattended).length;
    const averageScore = attendedAttempts > 0
      ? test.attempts.filter((a: any) => !a.is_unattended).reduce((sum: number, a: any) => sum + a.score, 0) / attendedAttempts
      : 0;
    const passRate = attendedAttempts > 0
      ? (test.attempts.filter((a: any) => !a.is_unattended && a.score >= (test.passing_marks ?? 0)).length / attendedAttempts) * 100
      : 0;

    // Question-wise analysis
    const questionAnalysis = test.questions.map((q: any) => {
      const correctCount = test.attempts.filter((attempt: any) => {
        const answers = attempt.answers as any;
        return answers[q.question_id] === q.question.correct_answer;
      }).length;

      return {
        question_id: q.question_id,
        question_text: q.question.question_text,
        topic: q.question.topic,
        difficulty: q.question.difficulty,
        correct_answers: correctCount,
        incorrect_answers: totalAttempts - correctCount,
        accuracy: totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0
      };
    });

    res.json({
      success: true,
      data: {
        test_id: test.quiz_id,
        title: test.title,
        description: test.description,
        course_id: test.course_id,
        subject_id: test.subject_id,
        batch_id: test.batch_id,
        time_limit_minutes: test.time_limit_minutes,
        total_marks: test.total_marks,
        passing_marks: test.passing_marks,
        has_negative_marking: test.has_negative_marking,
        negative_marks: test.negative_marks,
        status: test.status,
        scheduled_at: test.scheduled_at,
        expires_at: test.expires_at,
        start_time: test.start_time,
        end_time: test.end_time,
        created_at: test.created_at,
        updated_at: test.updated_at,
        statistics: {
          total_attempts: totalAttempts,
          completed_attempts: completedAttempts,
          unattended_attempts: unattendedAttempts,
          attended_attempts: attendedAttempts,
          average_score: averageScore,
          pass_rate: passRate
        },
        question_analysis: questionAnalysis,
        attempts: test.attempts
      }
    });
  } catch (error) {
    logger.error('Get test report error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch test report' });
  }
};

// Student-wise Test Report
export const getStudentTestReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, testId } = req.params;
    const studentIdInt = parseInt(studentId);
    const testIdInt = parseInt(testId);

    if (isNaN(studentIdInt) || isNaN(testIdInt)) {
      res.status(400).json({
        success: false,
        message: 'Invalid student ID or test ID'
      });
      return;
    }

    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        user_id: studentIdInt,
        quiz_id: testIdInt
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        },
        quiz: {
          include: {
            questions: {
              include: {
                question: true
              },
              orderBy: { order: 'asc' }
            }
          }
        },
        useranswers: {
          include: {
            question: true
          }
        }
      }
    });

    if (!attempt) {
      console.log(`No attempt found for student ${studentIdInt} and test ${testIdInt}`);
      res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
      return;
    }

    console.log('Found attempt:', {
      attempt_id: attempt.attempt_id,
      answers_exists: !!attempt.answers,
      user_answers_count: attempt.useranswers?.length || 0,
      quiz_questions_count: attempt.quiz?.questions?.length || 0
    });

    // Create a map of user answers for quick lookup
    const userAnswersMap = new Map();
    (attempt.useranswers || []).forEach((ua: any) => {
      userAnswersMap.set(ua.question_id, ua);
    });

   
    // Question-wise analysis
    const questionAnalysis = (attempt.quiz.questions || []).map((q: any) => {
      if (!q || !q.question) {
        console.warn('Malformed question data:', q);
        return null;
      }

      const userAnswerData = userAnswersMap.get(q.question_id);
      const studentAnswer = userAnswerData?.answer_text || '';
      
      // Use the stored is_correct value from UserAnswer table
      // This ensures consistency with the answer submission logic
      const isCorrect = userAnswerData?.is_correct || false;
      
      console.log(`Question ${q.question_id} analysis:`, {
        student_answer: studentAnswer,
        is_correct: isCorrect,
        marks_obtained: userAnswerData?.marks_obtained || 0,
        question_type: q.question.type,
        correct_answer: q.question.correct_answer
      });

      // Format options for frontend display
      let formattedOptions = [];
      if (q.question.options) {
        if (Array.isArray(q.question.options)) {
          formattedOptions = q.question.options;
        } else if (typeof q.question.options === 'object') {
          // Convert object to array of values
          formattedOptions = Object.values(q.question.options);
        }
      }

      return {
        question_id: q.question_id,
        question_text: q.question.question_text || 'Question text not available',
        type: q.question.type || 'MCQ', // Add question type
        options: formattedOptions,
        correct_answer: q.question.correct_answer,
        student_answer: studentAnswer,
        user_answer: studentAnswer, // Add for frontend compatibility
        is_correct: isCorrect,
        marks: userAnswerData?.marks_obtained || 0,
        marks_obtained: userAnswerData?.marks_obtained || 0, // Use stored marks from UserAnswer table
        topic: q.question.topic || 'Unknown',
        difficulty: q.question.difficulty || 'Medium',
        explanation: q.question.explanation || 'No explanation available'
      };
    }).filter(Boolean); // Remove null entries

    res.json({
      success: true,
      data: {
        attempt_id: attempt.attempt_id,
        user: attempt.user,
        user_name: attempt.user.full_name,
        user_avatar: null, // Avatar not available in current user data
        start_time: attempt.start_time,
        submit_time: attempt.submit_time,
        score: attempt.score,
        total_marks: attempt.quiz.total_marks || 0,
        total_questions: attempt.total_questions,
        correct_answers: attempt.correct_answers,
        wrong_answers: attempt.wrong_answers,
        unattempted: attempt.unattempted,
        accuracy: attempt.accuracy,
        percentage: attempt.score ? (attempt.score / (attempt.quiz.total_marks || 0)) * 100 : 0,
        time_taken: attempt.time_taken,
        rank: await getStudentRank(testIdInt, attempt.score ?? 0),
        is_unattended: (attempt as any).is_unattended,
        question_analysis: questionAnalysis
      }
    });
  } catch (error) {
    logger.error('Get student test report error:', error);
    console.error('Full error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch student test report',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Helper function to get student rank
async function getStudentRank(quiz_id: number, score: number): Promise<number> {
  const higherScores = await prisma.quizAttempt.count({
    where: {
      quiz_id,
      score: { gt: score }
    }
  });

  return higherScores + 1;
}

// Publish Test
export const publishTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const testIdInt = parseInt(testId);

    // Verify test exists and get question count
    const existingTest = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt },
      include: {
        questions: true
      }
    });

    if (!existingTest) {
      res.status(404).json({
        success: false,
        message: 'Test not found'
      });
      return;
    }

    // Validate that test has at least one question
    if (existingTest.questions.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot publish test: Test must have at least one question'
      });
      return;
    }

    // Check if test is already in a published state
    if (['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(existingTest.status as string)) {
      res.status(400).json({
        success: false,
        message: `Test is already published and in ${existingTest.status} state`
      });
      return;
    }

    // Determine the correct status based on scheduling
    let newStatus: TestStatus = 'IN_PROGRESS' as TestStatus; // Default if no scheduling
    const now = new Date();

    if (existingTest.start_time) {
      if (existingTest.start_time > now) {
        // Start time is in the future
        newStatus = 'NOT_STARTED' as TestStatus;
      } else if (existingTest.expires_at && existingTest.expires_at <= now) {
        // End time has passed
        newStatus = 'COMPLETED' as TestStatus;
      } else {
        // Currently in progress
        newStatus = 'IN_PROGRESS' as TestStatus;
      }
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { quiz_id: testIdInt },
      data: { status: newStatus }
    });

    res.json({
      success: true,
      message: 'Test published successfully',
      data: {
        quiz_id: updatedQuiz.quiz_id,
        title: updatedQuiz.title,
        status: updatedQuiz.status
      }
    });
  } catch (error) {
    logger.error('Publish test error:', error);
    res.status(500).json({ success: false, message: 'Failed to publish test' });
  }
};

// Archive Test
export const archiveTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const testIdInt = parseInt(testId);

    // Verify test exists
    const existingTest = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt }
    });

    if (!existingTest) {
      res.status(404).json({
        success: false,
        message: 'Test not found'
      });
      return;
    }

    // Check if test is already archived
    if (existingTest.status === 'ARCHIVED') {
      res.status(400).json({
        success: false,
        message: 'Test is already archived'
      });
      return;
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { quiz_id: testIdInt },
      data: { status: 'ARCHIVED' as TestStatus }
    });

    res.json({
      success: true,
      message: 'Test archived successfully',
      data: {
        quiz_id: updatedQuiz.quiz_id,
        title: updatedQuiz.title,
        status: updatedQuiz.status
      }
    });
  } catch (error) {
    logger.error('Archive test error:', error);
    res.status(500).json({ success: false, message: 'Failed to archive test' });
  }
};

// Move Test to Draft
export const draftTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const testIdInt = parseInt(testId);

    // Verify test exists
    const existingTest = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt }
    });

    if (!existingTest) {
      res.status(404).json({
        success: false,
        message: 'Test not found'
      });
      return;
    }

    // Check if test is already in draft
    if (existingTest.status === 'DRAFT') {
      res.status(400).json({
        success: false,
        message: 'Test is already in draft status'
      });
      return;
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { quiz_id: testIdInt },
      data: { status: 'DRAFT' as TestStatus }
    });

    res.json({
      success: true,
      message: 'Test moved to draft successfully',
      data: {
        quiz_id: updatedQuiz.quiz_id,
        title: updatedQuiz.title,
        status: updatedQuiz.status
      }
    });
  } catch (error) {
    logger.error('Draft test error:', error);
    res.status(500).json({ success: false, message: 'Failed to move test to draft' });
  }
};

// Start Test (Manual transition to IN_PROGRESS)
export const startTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const testIdInt = parseInt(testId);

    const existingTest = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt }
    });

    if (!existingTest) {
      res.status(404).json({
        success: false,
        message: 'Test not found'
      });
      return;
    }

    if (existingTest.status as string === 'IN_PROGRESS') {
      res.status(400).json({
        success: false,
        message: 'Test is already in progress'
      });
      return;
    }

    if (existingTest.status as string === 'COMPLETED') {
      res.status(400).json({
        success: false,
        message: 'Test has already been completed'
      });
      return;
    }

    const now = new Date();
    const updatedQuiz = await prisma.quiz.update({
      where: { quiz_id: testIdInt },
      data: { 
        status: 'IN_PROGRESS' as TestStatus,
        updated_at: now
      }
    });

    // Enhanced logging with IST time
    const istTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    logger.info(`🚀 MANUAL TEST START: "${updatedQuiz.title}" (ID: ${updatedQuiz.quiz_id}) | Status: ${existingTest.status} → IN_PROGRESS | Started at ${istTime} (IST)`);

    res.json({
      success: true,
      message: 'Test started successfully',
      data: {
        quiz_id: updatedQuiz.quiz_id,
        title: updatedQuiz.title,
        status: updatedQuiz.status,
        started_at: istTime
      }
    });
  } catch (error) {
    logger.error('Start test error:', error);
    res.status(500).json({ success: false, message: 'Failed to start test' });
  }
};

// Complete Test (Manual transition to COMPLETED)
export const completeTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const testIdInt = parseInt(testId);

    const existingTest = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt }
    });

    if (!existingTest) {
      res.status(404).json({
        success: false,
        message: 'Test not found'
      });
      return;
    }

    if (existingTest.status as string === 'COMPLETED') {
      res.status(400).json({
        success: false,
        message: 'Test is already completed'
      });
      return;
    }

    const now = new Date();
    const istTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    const updatedQuiz = await prisma.quiz.update({
      where: { quiz_id: testIdInt },
      data: { 
        status: 'COMPLETED' as TestStatus,
        updated_at: now
      }
    });

    // Enhanced logging for manual completion
    logger.info(`🏁 MANUAL TEST COMPLETION: "${updatedQuiz.title}" (ID: ${updatedQuiz.quiz_id}) | Status: ${existingTest.status} → COMPLETED | Completed at ${istTime} (IST)`);

    // Auto-submit incomplete attempts
    const incompleteAttempts = await prisma.quizAttempt.findMany({
      where: {
        quiz_id: testIdInt,
        is_completed: false
      },
      include: {
        user: {
          select: {
            full_name: true
          }
        }
      }
    });

    if (incompleteAttempts.length > 0) {
      logger.info(`🔄 MANUAL AUTO-SUBMIT: Processing ${incompleteAttempts.length} incomplete attempts for test "${updatedQuiz.title}" at ${istTime} (IST)`, incompleteAttempts.map(a => ({
        attempt_id: a.attempt_id,
        user: a.user?.full_name || 'Unknown'
      })));
    }

    for (const attempt of incompleteAttempts) {
      const userAnswers = await prisma.userAnswer.findMany({
        where: { attempt_id: attempt.attempt_id },
        include: {
          question: { select: { marks: true } }
        }
      });

      const score = userAnswers.reduce((total, answer) => total + (answer.marks_obtained || 0), 0);
      const correctAnswers = userAnswers.filter(answer => answer.is_correct).length;
      const wrongAnswers = userAnswers.filter(answer => !answer.is_correct).length;
      const totalQuestions = userAnswers.length;
      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      await prisma.quizAttempt.update({
        where: { attempt_id: attempt.attempt_id },
        data: {
          is_completed: true,
          submit_time: now,
          score,
          correct_answers: correctAnswers,
          wrong_answers: wrongAnswers,
          total_questions: totalQuestions,
          accuracy,
          time_taken: Math.floor((now.getTime() - attempt.start_time.getTime()) / 1000)
        }
      });

      logger.info(`✅ Manual auto-submitted attempt ${attempt.attempt_id} for user ${attempt.user?.full_name || 'Unknown'} | Score: ${score}/${totalQuestions} | Accuracy: ${accuracy.toFixed(1)}%`);
    }

    res.json({
      success: true,
      message: `Test completed successfully. Auto-submitted ${incompleteAttempts.length} incomplete attempts.`,
      data: {
        quiz_id: updatedQuiz.quiz_id,
        title: updatedQuiz.title,
        status: updatedQuiz.status,
        auto_submitted_attempts: incompleteAttempts.length,
        completed_at: istTime
      }
    });
  } catch (error) {
    logger.error('Complete test error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete test' });
  }
};

// Publish Test Results (Manual)
export const publishTestResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const testIdInt = parseInt(testId);

    const existingTest = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt }
    });

    if (!existingTest) {
      res.status(404).json({
        success: false,
        message: 'Test not found'
      });
      return;
    }

    if (existingTest.status as string !== 'COMPLETED') {
      res.status(400).json({
        success: false,
        message: 'Can only publish results for completed tests'
      });
      return;
    }

    // Check if results are already published
    if (existingTest.show_correct_answers) {
      res.status(400).json({
        success: false,
        message: 'Results for this test have already been published'
      });
      return;
    }

    const now = new Date();
    const istTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    const updatedQuiz = await prisma.quiz.update({
      where: { quiz_id: testIdInt },
      data: { 
        show_correct_answers: true,
        updated_at: now
      }
    });

    // Enhanced logging for manual result publishing
    logger.info(`📊 MANUAL RESULT PUBLISHING: "${updatedQuiz.title}" (ID: ${updatedQuiz.quiz_id}) | Results published at ${istTime} (IST)`);

    // Send notifications to students about results availability
    let studentsWithAttempts: any[] = [];
    try {
      studentsWithAttempts = await prisma.quizAttempt.findMany({
        where: { quiz_id: testIdInt },
        include: {
          user: {
            select: { user_id: true }
          }
        },
        distinct: ['user_id']
      });

      if (studentsWithAttempts.length > 0) {
        const notifications = studentsWithAttempts.map(attempt => ({
          user_id: attempt.user.user_id,
          title: 'Test Results Available',
          message: `Results for "${updatedQuiz.title}" are now available. You can view your performance and correct answers.`,
          type: 'QUIZ' as const,
          data: {
            quiz_id: testIdInt,
            action: 'results_published'
          }
        }));

        await prisma.notification.createMany({
          data: notifications
        });

        logger.info(`Sent result published notifications to ${studentsWithAttempts.length} students for test: ${updatedQuiz.title}`);
      }
    } catch (notificationError) {
      logger.error('Failed to send result published notifications:', notificationError);
      // Don't fail the result publishing if notifications fail
    }

    res.json({
      success: true,
      message: 'Test results published successfully',
      data: {
        quiz_id: updatedQuiz.quiz_id,
        title: updatedQuiz.title,
        results_published_at: istTime,
        notified_students: studentsWithAttempts.length
      }
    });
  } catch (error) {
    logger.error('Publish test results error:', error);
    res.status(500).json({ success: false, message: 'Failed to publish test results' });
  }
};

// Legacy Toggle Test Status (for backward compatibility)
export const toggleTestStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const { status } = req.body;
    const testIdInt = parseInt(testId);

    // Map legacy status to new TestStatus
    let newStatus: TestStatus;
    if (status === 'Active') {
      // Use publish endpoint for validation
      return publishTest(req, res);
    } else {
      newStatus = 'DRAFT';
    }

    // Verify test exists
    const existingTest = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt }
    });

    if (!existingTest) {
      res.status(404).json({
        success: false,
        message: 'Test not found'
      });
      return;
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { quiz_id: testIdInt },
      data: { status: newStatus }
    });

    res.json({
      success: true,
      message: `Test ${status.toLowerCase()} successfully`,
      data: {
        quiz_id: updatedQuiz.quiz_id,
        title: updatedQuiz.title,
        status: updatedQuiz.status
      }
    });
  } catch (error) {
    logger.error('Toggle test status error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle test status' });
  }
};

export const getTestDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const testIdInt = parseInt(testId);
    const test = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt },
      include: {
        questions: { include: { question: true } },
        attempts: {
          include: {
            user: { select: { user_id: true, full_name: true, email: true } }
          }
        }
      }
    }) as any;
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    const totalAttempts = test.attempts?.length || 0;
    const completedAttempts = test.attempts?.filter((a: any) => a.is_completed).length || 0;
    const unattendedAttempts = test.attempts?.filter((a: any) => a.is_unattended).length || 0;
    const attendedAttempts = test.attempts?.filter((a: any) => !a.is_unattended).length || 0;
    const averageScore = attendedAttempts > 0
      ? test.attempts.filter((a: any) => !a.is_unattended).reduce((sum: number, a: any) => sum + a.score, 0) / attendedAttempts
      : 0;
    const passPercentage = totalAttempts > 0
      ? (test.attempts.filter((a: any) => a.score != null && a.score >= (test.passing_marks ?? 0)).length / totalAttempts) * 100
      : 0;
    const questionAnalysis = test.questions?.map((q: any) => {
      const correctCount = test.attempts?.filter((attempt: any) => {
        const answer = attempt.answers as any;
        return answer && answer[q.question.question_id] === q.question.correct_answer;
      }).length || 0;
      return {
        question_id: q.question.question_id,
        question_text: q.question.question_text,
        correct_answers: correctCount,
        total_attempts: totalAttempts,
        accuracy: totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0
      };
    }) || [];
    return res.json({
      success: true,
      data: {
        test_id: test.quiz_id,
        title: test.title,
        description: test.description,
        course_id: test.course_id,
        subject_id: test.subject_id,
        batchIds: test.quiz_batches?.map((qb: any) => qb.batch.batch_id) || [],
        batches: test.quiz_batches?.map((qb: any) => qb.batch.batch_name) || [],
        time_limit_minutes: test.time_limit_minutes,
        total_marks: test.total_marks,
        passing_marks: test.passing_marks,
        has_negative_marking: test.has_negative_marking,
        negative_marks: test.negative_marks,
        status: test.status,
        scheduled_at: test.scheduled_at,
        expires_at: test.expires_at,
        start_time: test.start_time,
        end_time: test.end_time,
        created_at: test.created_at,
        updated_at: test.updated_at,
        statistics: {
          total_attempts: totalAttempts,
          completed_attempts: completedAttempts,
          unattended_attempts: unattendedAttempts,
          attended_attempts: attendedAttempts,
          average_score: averageScore,
          pass_percentage: passPercentage
        },
        question_analysis: questionAnalysis,
        attempts: test.attempts || []
      }
    });
  } catch (error) {
    logger.error('Get test details error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch test details' });
  }
};

// Student-specific test details endpoint
export const getStudentTestDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const userId = req.user?.user_id;
    const testIdInt = parseInt(testId);

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Get test with course, subject, batch info
    const test = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt },
      include: {
        quiz_batches: {
          include: {
            batch: { select: { batch_id: true, batch_name: true } }
          }
        },
        course: true,
        subject: true,
        attempts: {
          where: { user_id: userId },
          select: {
            attempt_id: true,
            score: true,
            is_completed: true,
            created_at: true,
            start_time: true,
            submit_time: true,
            time_taken: true,
            accuracy: true,
            correct_answers: true,
            wrong_answers: true,
          },
          orderBy: { created_at: 'desc' }
        },
        questions: {
          include: {
            question: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });


    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    // Check if test is archived - students should not access archived tests
    if (test.status === 'ARCHIVED') {
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    // Check if student has access to this test
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

    if (!studentProfile) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    // Check access based on batch assignment
    const studentBatchId = studentProfile.batch_id;
    const testBatchIds = test.quiz_batches?.map((qb: any) => qb.batch.batch_id) || [];
    
    if (testBatchIds.length > 0 && !testBatchIds.includes(studentBatchId)) {
      res.status(403).json({ success: false, message: 'You do not have access to this test' });
      return;
    }

    // Get question count from quiz_question table
    const questionCount = await prisma.quizQuestion.count({
      where: { quiz_id: testIdInt }
    });

    // Get overall statistics (aggregated)
    const allAttempts = await prisma.quizAttempt.findMany({
      where: { quiz_id: testIdInt, is_completed: true },
      select: { score: true, is_unattended: true } as any
    });

    const totalAttempts = allAttempts.length;
    const unattendedAttempts = allAttempts.filter((a: any) => a.is_unattended).length;
    const attendedAttempts = allAttempts.filter((a: any) => !a.is_unattended).length;
    const averageScore = attendedAttempts > 0
      ? allAttempts.filter((a: any) => !a.is_unattended).reduce((sum: number, a: any) => sum + (a.score ?? 0), 0) / attendedAttempts
      : 0;
    const passRate = attendedAttempts > 0
      ? (allAttempts.filter((a: any) => !a.is_unattended && a.score && a.score >= (test.passing_marks ?? 0)).length / attendedAttempts) * 100
      : 0;

    res.json({
      success: true,
      data: {
        quiz_id: test.quiz_id,
        title: test.title,
        description: test.description,
        type: test.type,
        time_limit_minutes: test.time_limit_minutes,
        total_marks: test.total_marks,
        passing_marks: test.passing_marks,
        has_negative_marking: test.has_negative_marking,
        negative_marks: test.negative_marks,
        status: test.status,
        marks_per_question: test.marks_per_question,
        scheduled_at: test.scheduled_at,
        course_id: test.course_id,
        subject_id: test.subject_id,
        batchIds: test.quiz_batches?.map((qb: any) => qb.batch.batch_id) || [],
        batches: test.quiz_batches?.map((qb: any) => qb.batch.batch_name) || [],
        course: test.course,
        subject: test.subject,
        question_count: questionCount,
        // Enhanced test configuration settings
        settings: {
          shuffleQuestions: test.shuffle_questions ?? true,
          shuffleOptions: test.shuffle_options ?? true,
          showImmediateResult: test.show_immediate_result ?? false,
          negativeMarks: test.has_negative_marking || false,
          negativeMarkValue: test.negative_marks || 0,
          timeLimit: true,
          allowRevisit: test.allow_revisit ?? true,
          showCorrectAnswers: test.show_correct_answers ?? true,
          allowPreviousNavigation: test.allow_previous_navigation ?? true,
          resultReleaseTime: test.result_release_time ? test.result_release_time.toISOString() : null,
          passPercentage: test.passing_marks || 40
        },
        statistics: {
          total_attempts: totalAttempts,
          completed_attempts: totalAttempts,
          unattended_attempts: unattendedAttempts,
          attended_attempts: attendedAttempts,
          average_score: averageScore,
          pass_percentage: passRate
        },
        attempts: test.attempts,
        questions: test.questions.map(q => ({
          id: q.question.question_id,
          question_text: q.question.question_text,
          type: q.question.type,
          options: q.question.options,
          marks: q.question.marks,
          left_side: q.question.left_side,
          right_side: q.question.right_side,
          order: q.order
        }))
      }
    });
  } catch (error) {
    logger.error('Get student test details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch test details' });
  }
};

export const getStudentAttempts = async (req: AuthRequest, res: Response) => {
  try {
    const { testId } = req.params;
    const { studentId } = req.query;
    const testIdInt = parseInt(testId);
    const studentIdInt = parseInt(studentId as string);
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        user_id: studentIdInt,
        quiz_id: testIdInt
      },
      include: {
        user: { select: { user_id: true, full_name: true, email: true } },
        quiz: {
          include: {
            questions: { include: { question: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    const formattedAttempts = await Promise.all(attempts.map(async (attempt: any) => {
      const questionAnalysis = attempt.quiz?.questions.map((q: any) => {
        const correct = (q.question.correct_answer).toLowerCase;
        const answer = attempt.answers as any;
        const userAnswer = answer[q.question.question_id].toLowerCase
        const isCorrect = userAnswer && userAnswer === correct;
        return {
          question_id: q.question.question_id,
          question_text: q.question.question_text,
          user_answer: userAnswer ? userAnswer : null,
          correct_answer: correct,
          is_correct: isCorrect,
          marks: isCorrect ? q.question.marks : (attempt.quiz?.has_negative_marking ? -(attempt.quiz?.negative_marks ?? 0) : 0)
        };
      }) || [];
      return {
        attempt_id: attempt.attempt_id,
        user: attempt.user,
        start_time: attempt.start_time,
        submit_time: attempt.submit_time,
        score: attempt.score,
        total_questions: attempt.total_questions,
        correct_answers: attempt.correct_answers,
        wrong_answers: attempt.wrong_answers,
        unattempted: attempt.unattempted,
        accuracy: attempt.accuracy,
        percentage: attempt.score ? (attempt.score / (attempt.quiz?.total_marks ?? 0)) * 100 : 0,
        time_taken: attempt.time_taken,
        rank: await getStudentRank(testIdInt, attempt.score ?? 0),
        question_analysis: questionAnalysis
      };
    }));
    return res.json({ success: true, data: formattedAttempts });
  } catch (error) {
    logger.error('Get student attempts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch student attempts' });
  }
};

// Update Test
export const updateTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const testIdInt = parseInt(testId);

    // Frontend sends these fields
    const {
      title,
      description,
      type,
      courseId,
      subjectId,
      batchIds,
      duration,
      maxMarks,
      scheduledDate,
      // Enhanced scheduling fields
      startTime,
      endTime,
      autoStart,
      autoEnd,
      gracePeriod,
      isCommon,
      questionSource,
      selectedQuestions,
      manualQuestions,
      settings
    } = req.body;

    // Map frontend test types to QuizType enum values
    const getQuizType = (frontendType: string): QuizType => {
      switch (frontendType) {
        case 'Mock Test': return 'MOCK';
        case 'Daily Test': return 'DAILY';
        case 'Weekly Test': return 'CUSTOM';
        case 'Monthly Test': return 'CUSTOM';
        default: return 'MOCK';
      }
    };

    // Verify test exists
    const existingTest = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt },
      include: { questions: true }
    });

    if (!existingTest) {
      res.status(404).json({
        success: false,
        message: 'Test not found'
      });
      return;
    }

    // Update the main quiz record
    await prisma.quiz.update({
      where: { quiz_id: testIdInt },
      data: {
        title,
        description,
        type: getQuizType(type),
        course_id: isCommon ? null : courseId,
        subject_id: isCommon ? null : subjectId,
        time_limit_minutes: duration,
        total_marks: maxMarks,
        passing_marks: settings?.passPercentage || 40,
        has_negative_marking: settings?.negativeMarks || false,
        negative_marks: settings?.negativeMarkValue || 0,
        scheduled_at: scheduledDate ? new Date(scheduledDate) : null,
        // Enhanced scheduling fields
        start_time: startTime ? new Date(startTime) : null,
        end_time_scheduled: endTime ? new Date(endTime) : null,
        auto_start: autoStart !== false, // Default true
        auto_end: autoEnd !== false,     // Default true
        grace_period_minutes: gracePeriod ? parseInt(gracePeriod as string) : 5,
        is_active: true,
        // Enhanced test configuration settings
        shuffle_questions: settings?.shuffleQuestions ?? true,
        shuffle_options: settings?.shuffleOptions ?? true,
        show_immediate_result: settings?.showImmediateResult ?? false,
        allow_revisit: settings?.allowRevisit ?? true,
        show_correct_answers: settings?.showCorrectAnswers ?? true,
        result_release_time: settings?.resultReleaseTime ? new Date(settings.resultReleaseTime) : null,
        allow_previous_navigation: settings?.allowPreviousNavigation ?? true
      }
    });

    // Handle batch assignments if not common test
    if (!isCommon && batchIds && batchIds.length > 0) {
      // Remove existing batch assignments
      await prisma.quizBatch.deleteMany({
        where: { quiz_id: testIdInt }
      });
      
      // Create new QuizBatch entries for all selected batches
      const quizBatchData = batchIds.map((batchId: number) => ({
        quiz_id: testIdInt,
        batch_id: batchId
      }));

      await prisma.quizBatch.createMany({
        data: quizBatchData,
        skipDuplicates: true
      });
    } else if (isCommon) {
      // Remove all batch assignments for common tests
      await prisma.quizBatch.deleteMany({
        where: { quiz_id: testIdInt }
      });
    }

    // Handle questions with proper validation and transaction safety
    if (questionSource === 'questionBank') {
      await prisma.$transaction(async (tx) => {
        // Remove all old questions first
        await tx.quizQuestion.deleteMany({ where: { quiz_id: testIdInt } });
        
        // Add selected questions if provided
      if (selectedQuestions && selectedQuestions.length > 0) {
          // Remove duplicates from selected questions and ensure they are numbers
          const uniqueQuestionIds: number[] = [...new Set(selectedQuestions.map((id: any) => parseInt(String(id))))].filter((id: any) => !isNaN(id)) as number[];
          
          // Validate that all questions exist
          const existingQuestions = await tx.question.findMany({
            where: { question_id: { in: uniqueQuestionIds } },
            select: { question_id: true, question_text: true, qp_code_id: true }
          });

          if (existingQuestions.length !== uniqueQuestionIds.length) {
            throw new Error(`Some selected questions do not exist. Expected: ${uniqueQuestionIds.length}, Found: ${existingQuestions.length}`);
          }

          // Add selected questions to the test with proper ordering
          const quizQuestions = uniqueQuestionIds.map((questionId, index) => ({
          quiz_id: testIdInt,
          question_id: questionId,
          order: index + 1
        }));

          const result = await tx.quizQuestion.createMany({
          data: quizQuestions,
          skipDuplicates: true
        });

          console.log(`✅ Updated quiz ${testIdInt} with ${result.count} questions`);
        }
      });
    } else if (questionSource === 'manual' && manualQuestions && manualQuestions.length > 0) {
      // Handle manual questions with proper creation and linking
      await prisma.$transaction(async (tx) => {
        // Remove all old questions first
        await tx.quizQuestion.deleteMany({ where: { quiz_id: testIdInt } });

        let createdCount = 0;
        let linkedCount = 0;

        for (let i = 0; i < manualQuestions.length; i++) {
          const questionData = manualQuestions[i];
          let questionId: number;

          // Check if question already exists (to avoid duplicates)
          const existingQuestion = await tx.question.findFirst({
            where: {
              question_text: questionData.question_text,
              type: questionData.type,
              correct_answer: questionData.correct_answer,
              // If qp_code_id is provided, include it in the check
              ...(questionData.qp_code_id && { qp_code_id: questionData.qp_code_id })
            },
            select: { question_id: true }
          });

          if (existingQuestion) {
            // Use existing question
            questionId = existingQuestion.question_id;
            
            // Update usage count
            await tx.question.update({
              where: { question_id: questionId },
              data: { 
                usage_count: { increment: 1 },
                last_used_date: new Date()
              }
            });
            
            console.log(`✅ Reusing existing question ID ${questionId} for quiz update`);
          } else {
            // Create new question
            const newQuestion = await tx.question.create({
              data: {
                question_text: questionData.question_text,
                type: questionData.type,
                topic: questionData.topic || null,
                difficulty: questionData.difficulty || 'MEDIUM',
                options: questionData.options || null,
                correct_answer: questionData.correct_answer,
                explanation: questionData.explanation || null,
                marks: questionData.marks || 1,
                left_side: questionData.left_side || null,
                right_side: questionData.right_side || null,
                tags: questionData.tags || [],
                qp_code_id: questionData.qp_code_id || null,
                usage_count: 1,
                last_used_date: new Date()
              }
            });
            
            questionId = newQuestion.question_id;
            createdCount++;
            console.log(`🆕 Created new question ID ${questionId} for quiz update`);
          }

          // Link question to quiz
          await tx.quizQuestion.create({
            data: {
              quiz_id: testIdInt,
              question_id: questionId,
              order: i + 1
            }
          });
          
          linkedCount++;
        }

        console.log(`📊 Quiz ${testIdInt} manual questions updated: ${createdCount} created, ${linkedCount} linked`);
      });
    }

    // Fetch updated test for response
    const quiz = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt },
      include: {
        course: { select: { course_id: true, name: true } },
        subject: { select: { subject_id: true, name: true } },
        quiz_batches: { 
          include: { 
            batch: { select: { batch_id: true, batch_name: true } } 
          } 
        },
        questions: { include: { question: true } },
        attempts: true,
        _count: { select: { questions: true, attempts: true } }
      }
    });

    // Transform data to match frontend expectations
    const transformedTest = quiz && (({
      id: quiz.quiz_id,
      title: quiz.title,
      description: quiz.description,
      type: quiz.type?.replace('_', ' ') || 'Mock Test',
      courseId: quiz.course_id,
      course: quiz.course?.name || 'All Courses',
      subjectId: quiz.subject_id,
      subject: quiz.subject?.name || 'All Subjects',
      batchIds: quiz.quiz_batches?.map((qb: any) => qb.batch.batch_id) || [],
      batches: quiz.quiz_batches?.map((qb: any) => qb.batch.batch_name) || [],
      questions: quiz._count.questions,
      duration: quiz.time_limit_minutes || 0,
      maxMarks: quiz.total_marks || 0,
      attempts: quiz._count.attempts,
      status: quiz.status as string,
      scheduledDate: quiz.scheduled_at ? quiz.scheduled_at.toISOString().split('T')[0] : '',
      // Enhanced scheduling fields
      startTime: quiz.start_time ? quiz.start_time.toISOString() : null,
      endTime: quiz.end_time_scheduled ? quiz.end_time_scheduled.toISOString() : null,
      autoStart: quiz.auto_start ?? true,
      autoEnd: quiz.auto_end ?? true,
      gracePeriod: quiz.grace_period_minutes || 5,
      isCommon: !quiz.course_id && !quiz.subject_id,
      selectedQuestions: quiz.questions,
      settings: {
        shuffleQuestions: quiz.shuffle_questions ?? true,
        shuffleOptions: quiz.shuffle_options ?? true,
        showImmediateResult: quiz.show_immediate_result ?? false,
        negativeMarks: quiz.has_negative_marking ?? false,
        negativeMarkValue: quiz.negative_marks ?? 0,
        passPercentage: quiz.passing_marks ?? 40,
        timeLimit: true,
        allowRevisit: quiz.allow_revisit ?? true,
        showCorrectAnswers: quiz.show_correct_answers ?? true,
        allowPreviousNavigation: quiz.allow_previous_navigation ?? true,
        resultReleaseTime: quiz.result_release_time ? quiz.result_release_time.toISOString() : null,
      },
      createdAt: quiz.created_at.toISOString(),
      updatedAt: quiz.updated_at.toISOString()
    }) as any);

    res.json({
      success: true,
      message: 'Test updated successfully',
      data: transformedTest
    });
  } catch (error) {
    logger.error('Update test error:', error);
    res.status(500).json({ success: false, message: 'Failed to update test' });
  }
};

// Delete Test
export const deleteTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const testIdInt = parseInt(testId);

    // Verify test exists
    const existingTest = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt }
    });

    if (!existingTest) {
      res.status(404).json({
        success: false,
        message: 'Test not found'
      });
      return;
    }

    // Delete related records first
    await prisma.quizQuestion.deleteMany({
      where: { quiz_id: testIdInt }
    });

    await prisma.quizAttempt.deleteMany({
      where: { quiz_id: testIdInt }
    });

    // Delete the test
    await prisma.quiz.delete({
      where: { quiz_id: testIdInt }
    });

    res.json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    logger.error('Delete test error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete test' });
  }
};

// Get Courses
export const getCourses = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        batches: true,
        students: true,
        subjects: true,
        _count: {
          select: {
            students: true,
            batches: true,
            videos: true,
            quizzes: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    logger.error('Get courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
};

// Get Subjects by Course
export const getSubjectsByCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const courseIdInt = parseInt(courseId);

    const subjects = await prisma.subject.findMany({
      where: {
        courses: {
          some: {
            course_id: courseIdInt
          }
        }
      },
      select: {
        subject_id: true,
        name: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    logger.error('Get subjects by course error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subjects' });
  }
};

// Get Batches by Course
export const getBatchesByCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const courseIdInt = parseInt(courseId);

    const batches = await prisma.batch.findMany({
      where: {
        course_id: courseIdInt,
        is_active: true
      },
      select: {
        batch_id: true,
        batch_name: true,
        description: true,
      },
      orderBy: { batch_name: 'asc' }
    });

    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    logger.error('Get batches by course error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch batches' });
  }
};

// Get Question Bank by Subject
export const getQuestionBankByQPCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { qpCodeId } = req.params;
    const qpCodeIdInt = parseInt(qpCodeId);

    const questions = await prisma.question.findMany({
      where: {
        qp_code_id: qpCodeIdInt
      },
      select: {
        question_id: true,
        question_text: true,
        topic: true,
        difficulty: true,
        marks: true,
        type: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    logger.error('Get question bank error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch questions' });
  }
};

// Add Multiple Questions to Test
export const addQuestionsToTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const { questionIds } = req.body;
    const testIdInt = parseInt(testId);

    // Verify test exists
    const quiz = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt }
    });

    if (!quiz) {
      res.status(404).json({
        success: false,
        message: 'Test not found'
      });
      return;
    }

    // Get the last question's order
    const lastQuestion = await prisma.quizQuestion.findFirst({
      where: { quiz_id: testIdInt },
      orderBy: { order: 'desc' }
    });

    let nextOrder = lastQuestion?.order ? lastQuestion.order + 1 : 1;

    // Add questions to test
    const quizQuestions = questionIds.map((questionId: number) => ({
      quiz_id: testIdInt,
      question_id: questionId,
      order: nextOrder++
    }));

    await prisma.quizQuestion.createMany({
      data: quizQuestions,
      skipDuplicates: true
    });

    res.json({
      success: true,
      message: 'Questions added to test successfully'
    });
  } catch (error) {
    logger.error('Add questions to test error:', error);
    res.status(500).json({ success: false, message: 'Failed to add questions to test' });
  }
};

// Get Test Attempts
export const getTestAttempts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const testIdInt = parseInt(testId);

    const attempts = await prisma.quizAttempt.findMany({
      where: { quiz_id: testIdInt },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        }
      },
      orderBy: { score: 'desc' }
    });

    res.json({
      success: true,
      data: attempts
    });
  } catch (error) {
    logger.error('Get test attempts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch test attempts' });
  }
};

// Get Student Test History
export const getStudentTestHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;
    
    console.log('User ID from request:', userId);
    
    if (!userId) {
      console.log('No user ID found in request');
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    console.log('Getting test history for user:', userId);

    // Get all test attempts for the student, excluding archived tests
    const testHistory = await prisma.quizAttempt.findMany({
      where: { 
        user_id: userId,
        quiz: {
          status: {
            not: 'ARCHIVED'
          }
        }
      },
      include: {
        quiz: {
          include: {
            course: true,
            subject: true,
            quiz_batches: {
              include: {
                batch: { select: { batch_id: true, batch_name: true } }
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const mappedData = testHistory.map(attempt => ({
      attempt_id: attempt.attempt_id,
      quiz_id: attempt.quiz.quiz_id,
      title: attempt.quiz.title,
      type: attempt.quiz.type,
      score: attempt.score,
      is_completed: attempt.is_completed,
      start_time: attempt.start_time,
      submit_time: attempt.submit_time,
      time_taken: attempt.time_taken,
      accuracy: attempt.accuracy,
      correct_answers: attempt.correct_answers,
      wrong_answers: attempt.wrong_answers,
      total_questions: attempt.total_questions,
      course: attempt.quiz.course,
      subject: attempt.quiz.subject,
      batchIds: attempt.quiz.quiz_batches?.map((qb: any) => qb.batch.batch_id) || [],
      batches: attempt.quiz.quiz_batches?.map((qb: any) => qb.batch.batch_name) || []
    }));

    
    const filtered = mappedData.filter(content =>{return content.batchIds.includes(req.user?.student_profile?.batch?.batch_id)
})
    res.json({
      success: true,
      data: filtered
    });
  } catch (error) {
    logger.error('Get student test history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch test history' });
  }
};

// Get Available Tests for Student (Improved)
export const getAvailableTestsForStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    console.log('Getting available tests for user:', userId);

    // Get student's batch information
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { user_id: userId },
      include: {
        batch: true,
        course: true
      }
    });

    if (!studentProfile) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

   

    // Get all tests that are available for the student
    const whereConditions = [];
    
    // Tests assigned to student's batch
    if (studentProfile.batch_id) {
      whereConditions.push({
        quiz_batches: {
          some: {
            batch_id: studentProfile.batch_id
          }
        }
      });
    }
    
    // Tests for student's course (common tests)
    if (studentProfile.course_id) {
      whereConditions.push({
        course_id: studentProfile.course_id
      });
    }
    
    const availableTests = await prisma.quiz.findMany({
      where: {
        status: 'IN_PROGRESS' as TestStatus,
        is_active: true,
        ...(whereConditions.length > 0 && { OR: whereConditions })
      },
      include: {
        course: true,
        subject: true,
        quiz_batches: {
          include: {
            batch: { select: { batch_id: true, batch_name: true } }
          }
        },
        attempts: {
          where: { user_id: userId },
          select: {
            attempt_id: true,
            score: true,
            is_completed: true,
            created_at: true,
            start_time: true,
            submit_time: true,
            time_taken: true,
            accuracy: true,
            correct_answers: true,
            wrong_answers: true,
            total_questions: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Filter out tests where the student has completed attempts
    const filteredTests = availableTests.filter(test => {
      const completedAttempts = test.attempts.filter(attempt => attempt.is_completed);
      return completedAttempts.length === 0; // Only show tests with no completed attempts
    });
const filterbyBatch = filteredTests.filter(test =>
  test.quiz_batches?.some(t => t.batch_id === studentProfile.batch_id)
);

   console.log(filterbyBatch)

    res.json({
      success: true,
      data: filterbyBatch
    });
  } catch (error) {
    logger.error('Get available tests for student error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available tests' });
  }
};

// Start Test Attempt
export const startTestAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const userId = req.user?.user_id;
    const testIdInt = parseInt(testId);

    console.log('Start test attempt called with:', { testId, userId, testIdInt });

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Check if test exists and is available
    const test = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt },
      select: {
        quiz_id: true,
        title: true,
        description: true,
        type: true,
        time_limit_minutes: true,
        total_marks: true,
        passing_marks: true,
        has_negative_marking: true,
        negative_marks: true,
        status: true,
        is_active: true,
        scheduled_at: true,
        marks_per_question: true,
        course: true,
        subject: true,
        // Include test settings for shuffle functionality
        shuffle_questions: true,
        shuffle_options: true,
        show_immediate_result: true,
        allow_revisit: true,
        show_correct_answers: true,
        result_release_time: true,
        allow_previous_navigation: true,
        quiz_batches: {
          include: {
            batch: { select: { batch_id: true, batch_name: true } }
          }
        },
        attempts: {
          where: { user_id: userId },
          select: {
            attempt_id: true,
            score: true,
            is_completed: true,
            created_at: true,
            start_time: true,
            submit_time: true,
            time_taken: true,
            accuracy: true,
            correct_answers: true,
            wrong_answers: true,
          },
          orderBy: { created_at: 'desc' }
        },
        questions: {
          include: {
            question: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });


   

    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    if (test.status as string !== 'IN_PROGRESS' || !test.is_active) {
      let message = 'Test is not available';
      if (test.status as string === 'NOT_STARTED') {
        message = 'Test has not started yet';
      } else if (test.status as string === 'COMPLETED') {
        message = 'Test has ended';
      } else if (test.status as string === 'DRAFT') {
        message = 'Test is not published';
      } else if (test.status as string === 'ARCHIVED') {
        message = 'Test has been archived';
      }
      
      res.status(403).json({ success: false, message });
      return;
    }

    // Check if student has access to this test
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { user_id: userId }
    });

   

    if (!studentProfile) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    // Check access based on batch assignment
    const studentBatchId = studentProfile.batch_id;
    const testBatchIds = test.quiz_batches?.map((qb: any) => qb.batch.batch_id) || [];
    
    if (testBatchIds.length > 0 && !testBatchIds.includes(studentBatchId)) {
      res.status(403).json({ success: false, message: 'You do not have access to this test' });
      return;
    }

    // Check if student has already completed this test
    const existingCompletedAttempt = test.attempts.find(attempt => attempt.is_completed);
    if (existingCompletedAttempt) {
      res.status(403).json({ 
        success: false, 
        message: 'You have already completed this test and cannot attempt it again' 
      });
      return;
    }

    // Check if there's an existing incomplete attempt to resume
    const existingIncompleteAttempt = test.attempts.find(attempt => !attempt.is_completed);
    if (existingIncompleteAttempt) {
      // Return the existing attempt for resumption
      const response = {
        success: true,
        data: {
          attempt_id: existingIncompleteAttempt.attempt_id,
          test: {
            ...test,
            questions: test.questions.map(q => ({
              id: q.question.question_id,
              text: q.question.question_text,
              type: q.question.type,
              options: q.question.options,
              marks: q.question.marks,
              left_side: q.question.left_side,
              right_side: q.question.right_side,
              order: q.order
            })),
            // Include settings for frontend shuffle functionality
            settings: {
              shuffleQuestions: test.shuffle_questions,
              shuffleOptions: test.shuffle_options,
              showImmediateResult: test.show_immediate_result,
              allowRevisit: test.allow_revisit,
              showCorrectAnswers: test.show_correct_answers,
              resultReleaseTime: test.result_release_time,
              allowPreviousNavigation: test.allow_previous_navigation
            }
          }
        }
      };

      console.log('Resuming existing attempt:', { attempt_id: existingIncompleteAttempt.attempt_id });
      res.json(response);
      return;
    }

    // Create new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quiz_id: testIdInt,
        user_id: userId,
        start_time: new Date(),
        is_completed: false
      }
    });

    console.log('Attempt created:', { attempt_id: attempt.attempt_id });

    const response = {
      success: true,
      data: {
        attempt_id: attempt.attempt_id,
        test: {
          ...test,
          questions: test.questions.map(q => ({
            id: q.question.question_id,
            text: q.question.question_text,
            type: q.question.type,
            options: q.question.options,
            marks: q.question.marks,
            left_side: q.question.left_side,
            right_side: q.question.right_side,
            order: q.order
          })),
          // Include settings for frontend shuffle functionality
          settings: {
            shuffleQuestions: test.shuffle_questions,
            shuffleOptions: test.shuffle_options,
            showImmediateResult: test.show_immediate_result,
            allowRevisit: test.allow_revisit,
            showCorrectAnswers: test.show_correct_answers,
            resultReleaseTime: test.result_release_time,
            allowPreviousNavigation: test.allow_previous_navigation
          }
        }
      }
    };


    res.json(response);
  } catch (error) {
    logger.error('Start test attempt error:', error);
    res.status(500).json({ success: false, message: 'Failed to start test attempt' });
  }
};

// Submit Test Answer
export const submitTestAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const { questionId, answer } = req.body;
    const userId = req.user?.user_id;
    const attemptIdInt = parseInt(attemptId);

    

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Verify attempt belongs to user
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        attempt_id: attemptIdInt,
        user_id: userId
      }
    });

    console.log('Attempt found for answer submission:', attempt ? {
      attempt_id: attempt.attempt_id,
      is_completed: attempt.is_completed
    } : 'Not found');

    if (!attempt) {
      res.status(404).json({ success: false, message: 'Attempt not found' });
      return;
    }

    // Get quiz and question details
    const quiz = await prisma.quiz.findUnique({
      where: { quiz_id: attempt.quiz_id }
    });

    const question = await prisma.question.findUnique({
      where: { question_id: parseInt(questionId) }
    });

    console.log('🔍 Question found:', question ? {
      question_id: question.question_id,
      type: question.type,
      correct_answer: question.correct_answer,
      options: question.options
    } : 'Not found');

    console.log('quiz found:', quiz)
    if (!question || !quiz) {
      res.status(404).json({ success: false, message: 'Question or quiz not found' });
      return;
    }

    // Check if answer is correct
    // Handle both option keys (A, B, C, D) and option values (text)
    let isCorrect = false;
    
    if (question.type === 'MCQ' || question.type === 'CHOICE_BASED') {
      // For MCQ questions, check if the answer matches the correct answer
      // or if it's an option key that maps to the correct answer
      const correctAnswer = question.correct_answer.toLowerCase();
      const userAnswer = answer.toLowerCase();
      
      // Direct match with correct answer
      if (userAnswer === correctAnswer) {
        isCorrect = true;
      } else {
        // Check if the answer is an option key that maps to the correct answer
        const options = question.options as any;
        if (options && typeof options === 'object') {
          // Find the key that has the correct answer as its value
          const correctKey = Object.keys(options).find(key => 
            options[key].toLowerCase() === correctAnswer
          );
          if (correctKey && userAnswer === correctKey.toLowerCase()) {
            isCorrect = true;
          }
        }
      }
    } else {
      // For other question types, direct comparison
      isCorrect = answer.toLowerCase() === question.correct_answer.toLowerCase();
    }

    // Calculate marks based on answer correctness and negative marking settings
    let marksObtained: number;
    if (isCorrect) {
      marksObtained = quiz.marks_per_question?quiz.marks_per_question:1;
    } else {
      // Apply negative marking only for wrong answers, not for unattempted questions
      if (quiz.has_negative_marking && answer && answer.trim() !== '') {
        marksObtained = -(quiz.negative_marks || 0);
      } else {
        marksObtained = 0; // No negative marks for unattempted questions
      }
    }

    console.log('Answer validation:', {
      question_type: question.type,
      user_answer: answer.toLowerCase(),
      correct_answer: question.correct_answer.toLowerCase(),
      question_options: question.options,
      is_correct: isCorrect,
      marks_obtained: marksObtained,
      has_negative_marking: quiz.has_negative_marking,
      negative_marks: quiz.negative_marks
    });

    // Check if answer already exists
    const existingAnswer = await prisma.userAnswer.findFirst({
      where: {
        attempt_id: attemptIdInt,
        question_id: parseInt(questionId)
      }
    });

    if (existingAnswer) {
      // Update existing answer
      await prisma.userAnswer.update({
        where: { answer_id: existingAnswer.answer_id },
        data: {
          answer_text: answer,
          is_correct: isCorrect,
          marks_obtained: marksObtained
        }
      });
      console.log('Updated existing answer');
    } else {
      // Create new answer
      await prisma.userAnswer.create({
        data: {
          attempt_id: attemptIdInt,
          question_id: parseInt(questionId),
          answer_text: answer,
          is_correct: isCorrect,
          marks_obtained: marksObtained
        }
      });
      console.log('Created new answer');
    }

    res.json({
      success: true,
      message: 'Answer submitted successfully'
    });
  } catch (error) {
    logger.error('Submit test answer error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit answer' });
  }
};

// Complete Test Attempt
// Auto-save student progress
export const autoSaveTestProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { attemptId, answers } = req.body;
    const userId = req.user?.user_id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Verify the attempt belongs to the user
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        attempt_id: parseInt(attemptId),
        user_id: userId,
        is_completed: false
      },
      include: {
        quiz: true
      }
    });

    if (!attempt) {
      res.status(404).json({ success: false, message: 'Test attempt not found or already completed' });
      return;
    }

    // Check if test has ended
    const now = new Date();
    const testEndTime = (attempt as any).quiz.end_time_scheduled;
    const timeLimitMinutes = (attempt as any).quiz.time_limit_minutes || 0;
    const attemptStartTime = attempt.start_time;
    const maxEndTime = new Date(attemptStartTime.getTime() + (timeLimitMinutes * 60 * 1000));
    
    // Determine the actual end time (whichever comes first: scheduled end or time limit)
    const actualEndTime = testEndTime && testEndTime < maxEndTime ? testEndTime : maxEndTime;

    if (now >= actualEndTime) {
      // Test has ended, force complete the attempt
      await completeTestAttempt(req, res);
      return;
    }

    // Save answers
    if (answers && Array.isArray(answers)) {
      for (const answer of answers) {
        const { questionId, selectedOption, isCorrect, marksObtained } = answer;
        
        // Create or update user answer
        await prisma.userAnswer.create({
          data: {
            attempt_id: parseInt(attemptId),
            question_id: parseInt(questionId),
            answer_text: selectedOption,
            is_correct: isCorrect,
            marks_obtained: marksObtained
          }
        });
      }
    }

    // Calculate remaining time
    const remainingTime = Math.max(0, Math.floor((actualEndTime.getTime() - now.getTime()) / 1000));
    const remainingMinutes = Math.floor(remainingTime / 60);
    const remainingSeconds = remainingTime % 60;

    // Check if we should warn about time
    const shouldWarn = remainingMinutes <= 5; // Warn when 5 minutes or less remaining

    res.json({
      success: true,
      message: 'Progress auto-saved successfully',
      data: {
        remainingTime,
        remainingMinutes,
        remainingSeconds,
        shouldWarn,
        warningMessage: shouldWarn ? `Test ends in ${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}` : null
      }
    });

  } catch (error) {
    logger.error('Error auto-saving test progress:', error);
    res.status(500).json({ success: false, message: 'Failed to auto-save progress' });
  }
};

// Get test time status and warnings
export const getTestTimeStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const userId = req.user?.user_id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        attempt_id: parseInt(attemptId),
        user_id: userId,
        is_completed: false
      },
      include: {
        quiz: true
      }
    });

    if (!attempt) {
      res.status(404).json({ success: false, message: 'Test attempt not found or completed' });
      return;
    }

    const now = new Date();
    const testEndTime = attempt.quiz.end_time_scheduled;
    const timeLimitMinutes = attempt.quiz.time_limit_minutes || 0;
    const gracePeriodMinutes = attempt.quiz.grace_period_minutes || 0;
    const attemptStartTime = attempt.start_time;
    const maxEndTime = new Date(attemptStartTime.getTime() + (timeLimitMinutes * 60 * 1000));
    
    // Determine the actual end time
    const actualEndTime = testEndTime && testEndTime < maxEndTime ? testEndTime : maxEndTime;
    const graceEndTime = new Date(actualEndTime.getTime() + (gracePeriodMinutes * 60 * 1000));

    const remainingTime = Math.max(0, Math.floor((actualEndTime.getTime() - now.getTime()) / 1000));
    const graceRemainingTime = Math.max(0, Math.floor((graceEndTime.getTime() - now.getTime()) / 1000));
    
    const remainingMinutes = Math.floor(remainingTime / 60);
    const remainingSeconds = remainingTime % 60;
    const graceRemainingMinutes = Math.floor(graceRemainingTime / 60);
    const graceRemainingSeconds = graceRemainingTime % 60;

    // Determine warning levels
    let warningLevel = 'none';
    let warningMessage = null;

    if (remainingTime <= 0) {
      warningLevel = 'ended';
      warningMessage = 'Test has ended. Submitting your answers...';
    } else if (remainingMinutes <= 2) {
      warningLevel = 'critical';
      warningMessage = `Test ends in ${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')} - Submit now!`;
    } else if (remainingMinutes <= 5) {
      warningLevel = 'warning';
      warningMessage = `Test ends in ${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else if (remainingMinutes <= 10) {
      warningLevel = 'notice';
      warningMessage = `Test ends in ${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    res.json({
      success: true,
      data: {
        remainingTime,
        remainingMinutes,
        remainingSeconds,
        graceRemainingTime,
        graceRemainingMinutes,
        graceRemainingSeconds,
        warningLevel,
        warningMessage,
        isInGracePeriod: remainingTime <= 0 && graceRemainingTime > 0,
        testEnded: remainingTime <= 0 && graceRemainingTime <= 0
      }
    });

  } catch (error) {
    logger.error('Error getting test time status:', error);
    res.status(500).json({ success: false, message: 'Failed to get time status' });
  }
};

export const completeTestAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const userId = req.user?.user_id;
    const attemptIdInt = parseInt(attemptId);

    console.log('Complete test attempt called with:', { attemptId, userId, attemptIdInt });

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Get attempt with answers
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        attempt_id: attemptIdInt,
        user_id: userId
      },
      include: {
        useranswers: {
          include: {
            question: true
          }
        },
        quiz: {
          include: {
            questions: {
              include: {
                question: true
              }
            }
          }
        }
      }
    });

    console.log('Attempt found for completion:', attempt ? {
      attempt_id: attempt.attempt_id,
      is_completed: attempt.is_completed,
      useranswers_count: attempt.useranswers.length,
      quiz_questions_count: attempt.quiz.questions.length
    } : 'Not found');

    if (!attempt) {
      res.status(404).json({ success: false, message: 'Attempt not found' });
      return;
    }

    // Calculate results
    const totalQuestions = attempt.quiz.questions.length;
    const correctAnswers = attempt.useranswers.filter(ua => ua.is_correct).length;
    const totalMarks = attempt.useranswers.reduce((sum, ua) => sum + (ua.marks_obtained || 0), 0);
    const maxMarks = attempt.quiz.questions.reduce((sum, q) => sum + q.question.marks, 0);
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const score = totalMarks||0;

    console.log('Calculated results:', {
      totalQuestions,
      correctAnswers,
      totalMarks,
      maxMarks,
      accuracy,
      score
    });

    // Update attempt
    await prisma.quizAttempt.update({
      where: { attempt_id: attemptIdInt },
      data: {
        is_completed: true,
        submit_time: new Date(),
        score: Math.round(score),
        accuracy: accuracy,
        correct_answers: correctAnswers,
        wrong_answers: totalQuestions - correctAnswers,
        total_questions: totalQuestions,
        time_taken: Math.floor((new Date().getTime() - attempt.start_time.getTime()) / 1000)
      }
    });

    console.log('Attempt completed successfully');

    res.json({
      success: true,
      data: {
        score: Math.round(score), // Raw score as percentage
        scorePercentage: Math.round(score), // Explicit percentage for clarity
        totalMarks: totalMarks, // Raw marks obtained
        maxMarks: maxMarks, // Maximum possible marks
        accuracy: Math.round(accuracy * 100) / 100, // Rounded accuracy
        correctAnswers,
        wrongAnswers: totalQuestions - correctAnswers,
        unattemptedQuestions: totalQuestions - attempt.useranswers.length,
        totalQuestions
      }
    });
  } catch (error) {
    logger.error('Complete test attempt error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete test attempt' });
  }
};

// Get Test Attempt Analysis for Student
export const getTestAttemptAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const userId = req.user?.user_id;
    const attemptIdInt = parseInt(attemptId);

    console.log('Get test attempt analysis called with:', { attemptId, userId, attemptIdInt });

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Get attempt with all details
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        attempt_id: attemptIdInt,
        user_id: userId
      },
      include: {
        useranswers: {
          include: {
            question: true
          }
        },
        quiz: {
          include: {
            course: true,
            subject: true,
            questions: {
              include: {
                question: true
              },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    console.log('Attempt found:', attempt ? {
      attempt_id: attempt.attempt_id,
      is_completed: attempt.is_completed,
      score: attempt.score,
      useranswers_count: attempt.useranswers.length,
      quiz_questions_count: attempt.quiz.questions.length
    } : 'Not found');

    if (!attempt) {
      res.status(404).json({ success: false, message: 'Attempt not found' });
      return;
    }

    if (!attempt.is_completed) {
      res.status(400).json({ success: false, message: 'Test attempt is not completed' });
      return;
    }

    // Calculate time taken
    const timeTakenMinutes = attempt.time_taken ? Math.floor(attempt.time_taken / 60) : 0;

    // Prepare questions with user answers
    const questions = attempt.quiz.questions.map(q => {
      const userAnswer = attempt.useranswers.find(ua => ua.question_id === q.question.question_id);
      
      // Debug logging for first question
      if (q.question.question_id === attempt.quiz.questions[0]?.question.question_id) {
        console.log('🔍 Backend Question Debug:', {
          question_id: q.question.question_id,
          correct_answer: q.question.correct_answer,
          userAnswer: userAnswer ? {
            answer_text: userAnswer.answer_text,
            is_correct: userAnswer.is_correct,
            marks_obtained: userAnswer.marks_obtained
          } : null,
          totalUserAnswers: attempt.useranswers.length
        });
      }
      
      return {
        question_id: q.question.question_id,
        question_text: q.question.question_text,
        type: q.question.type,
        options: q.question.options,
        correct_answer: q.question.correct_answer,
        marks: q.question.marks,
        user_answer: userAnswer?.answer_text || null,
        is_correct: userAnswer?.is_correct || false,
        marks_obtained: userAnswer?.marks_obtained || 0,
        explanation: q.question.explanation,
        topic: q.question.topic,
        difficulty: q.question.difficulty
      };
    });

    console.log('Prepared questions:', questions.length);

    // Calculate correct and wrong answers from questions
    const correctAnswers = questions.filter(q => q.is_correct).length;
    const wrongAnswers = questions.filter(q => q.user_answer && q.user_answer.trim() !== '' && !q.is_correct).length;
    const unattempted = questions.filter(q => !q.user_answer || q.user_answer.trim() === '').length;

    const response = {
      success: true,
      data: {
        attempt_id: attempt.attempt_id,
        score: attempt.score || 0,
        total_marks: attempt.quiz.questions.reduce((sum, q) => sum + q.question.marks, 0),
        time_taken_minutes: timeTakenMinutes,
        completed_at: attempt.submit_time,
        accuracy: attempt.accuracy || 0,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        unattempted: unattempted,
        total_questions: attempt.total_questions || questions.length,
        quiz: {
          quiz_id: attempt.quiz.quiz_id,
          title: attempt.quiz.title,
          type: attempt.quiz.type,
          time_limit_minutes: attempt.quiz.time_limit_minutes,
          total_marks: attempt.quiz.questions.reduce((sum, q) => sum + q.question.marks, 0),
          course: attempt.quiz.course,
          subject: attempt.quiz.subject,
          // Enhanced test configuration settings
          settings: {
            shuffleQuestions: attempt.quiz.shuffle_questions ?? true,
            shuffleOptions: attempt.quiz.shuffle_options ?? true,
            showImmediateResult: attempt.quiz.show_immediate_result ?? false,
            negativeMarks: attempt.quiz.has_negative_marking || false,
            negativeMarkValue: attempt.quiz.negative_marks || 0,
            timeLimit: true,
            allowRevisit: attempt.quiz.allow_revisit ?? true,
            showCorrectAnswers: attempt.quiz.show_correct_answers ?? true,
            allowPreviousNavigation: attempt.quiz.allow_previous_navigation ?? true,
            resultReleaseTime: attempt.quiz.result_release_time ? attempt.quiz.result_release_time.toISOString() : null,
            passPercentage: attempt.quiz.passing_marks || 40
          }
        },
        questions: questions
      }
    };

    console.log('Sending response with score:', response.data.score, 'total marks:', response.data.total_marks);

    res.json(response);
  } catch (error) {
    logger.error('Get test attempt analysis error:', error);
    res.status(500).json({ success: false, message: 'Failed to get test analysis' });
  }
};

// Get saved answers for incomplete attempt (for resuming tests)
export const getSavedAnswers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const userId = req.user?.user_id;
    const attemptIdInt = parseInt(attemptId);

    console.log('Get saved answers called with:', { attemptId, userId, attemptIdInt });

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Get attempt with user answers
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        attempt_id: attemptIdInt,
        user_id: userId,
        is_completed: false // Only get incomplete attempts
      },
      include: {
        useranswers: {
          include: {
            question: true
          }
        }
      }
    });

    if (!attempt) {
      res.status(404).json({ success: false, message: 'Incomplete attempt not found' });
      return;
    }

    // Prepare saved answers
    const savedAnswers = attempt.useranswers.map(ua => ({
      question_id: ua.question_id,
      answer_text: ua.answer_text,
      answered_at: new Date().toISOString() // Use current timestamp since UserAnswer doesn't have created_at
    }));

    console.log('Found saved answers:', savedAnswers.length);

    const response = {
      success: true,
      data: {
        attempt_id: attempt.attempt_id,
        start_time: attempt.start_time,
        saved_answers: savedAnswers
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Get saved answers error:', error);
    res.status(500).json({ success: false, message: 'Failed to get saved answers' });
  }
};

// Debug endpoint to check and fix test data
export const debugTests = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get all tests
    const allTests = await prisma.quiz.findMany({
      include: {
        course: true,
        quiz_batches: {
          include: {
            batch: { select: { batch_id: true, batch_name: true } }
          }
        },
        subject: true
      }
    });

    // Check if there are any tests that should be published
    const draftTests = allTests.filter(t => t.status === 'DRAFT');

    if (draftTests.length > 0) {
      console.log('Found draft tests:', draftTests.map(t => ({
        quiz_id: t.quiz_id,
        title: t.title,
        batchIds: t.quiz_batches?.map(qb => qb.batch.batch_id) || [],
        course_id: t.course_id
      })));

      // Publish all tests for testing (only if they have questions)
      for (const test of draftTests) {
        const questionCount = await prisma.quizQuestion.count({
          where: { quiz_id: test.quiz_id }
        });

        if (questionCount > 0) {
          await prisma.quiz.update({
            where: { quiz_id: test.quiz_id },
            data: { status: 'IN_PROGRESS' as any }
          });
        }
      }

      console.log('Published eligible tests');
    }

    // Get scheduler status
    const { schedulerService } = await import('../services/schedulerService');
    const schedulerStatus = schedulerService.getStatus();

    res.json({
      success: true,
      data: {
        totalTests: allTests.length,
        publishedTests: allTests.filter(t => t.status as string === 'IN_PROGRESS').length,
        draftTests: allTests.filter(t => t.status === 'DRAFT').length,
        archivedTests: allTests.filter(t => t.status === 'ARCHIVED').length,
        scheduler: schedulerStatus,
        tests: allTests.map(t => ({
          quiz_id: t.quiz_id,
          title: t.title,
          batchIds: t.quiz_batches?.map(qb => qb.batch.batch_id) || [],
          course_id: t.course_id,
          status: t.status,
          is_active: t.is_active,
          type: t.type
        }))
      }
    });
  } catch (error) {
    logger.error('Debug tests error:', error);
    res.status(500).json({ success: false, message: 'Failed to debug tests' });
  }
};



// Get Question Bank by Subject
export const getQuestionBankBySubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const subjectIdInt = parseInt(subjectId);
    if (isNaN(subjectIdInt)) {
      res.status(400).json({ success: false, message: 'Invalid subject ID' });
      return;
    }

    console.log('🔍 getQuestionBankBySubject called with subjectId:', subjectIdInt);

    // Get questions for the specific subject
    // Note: This assumes questions are linked to subjects through QP codes
    // You may need to adjust this based on your actual database schema
    const questions = await prisma.question.findMany({
      select: {
        question_id: true,
        question_text: true,
        topic: true,
        difficulty: true,
        marks: true,
        type: true,
        qp_code_id: true,
        qp_code: {
          select: {
            code: true,
            description: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    console.log('🔍 Found questions for subject:', {
      subjectId: subjectIdInt,
      count: questions.length,
      questionTypes: questions.map(q => q.type)
    });

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    logger.error('Get question bank by subject error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch questions for subject' });
  }
};

// Get Question Bank by Course (now returns all questions with QP codes)
export const getQuestionBankByCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const courseIdInt = parseInt(courseId);
    if (isNaN(courseIdInt)) {
      res.status(400).json({ success: false, message: 'Invalid course ID' });
      return;
    }

    console.log('🔍 getQuestionBankByCourse called with courseId:', courseIdInt);

    // Get all questions with their QP codes
    // TODO: Implement proper course filtering based on your database schema
    // This might require:
    // 1. A relationship between courses and QP codes
    // 2. A relationship between courses and subjects, then subjects to QP codes
    // 3. Or a direct relationship between courses and questions
    // 
    // For now, returning all questions to ensure functionality
    // You should implement the proper filtering based on your schema
    const questions = await prisma.question.findMany({
      select: {
        question_id: true,
        question_text: true,
        topic: true,
        difficulty: true,
        marks: true,
        type: true,
        qp_code_id: true,
        qp_code: {
          select: {
            code: true,
            description: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    console.log('🔍 Found questions for course:', {
      courseId: courseIdInt,
      count: questions.length,
      questionTypes: questions.map(q => q.type)
    });

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    logger.error('Get question bank by course error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch questions for course' });
  }
};

// Toggle leaderboard for a test
export const toggleLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const testIdInt = parseInt(testId);

    if (isNaN(testIdInt)) {
      res.status(400).json({ success: false, message: 'Invalid test ID' });
      return;
    }

    const test = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt }
    });

    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    const updatedTest = await prisma.quiz.update({
      where: { quiz_id: testIdInt },
      data: { leaderboard_enabled: !test.leaderboard_enabled }
    });

    res.json({
      success: true,
      data: {
        quiz_id: updatedTest.quiz_id,
        leaderboard_enabled: updatedTest.leaderboard_enabled
      },
      message: `Leaderboard ${updatedTest.leaderboard_enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    logger.error('Toggle leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle leaderboard' });
  }
};

// Get leaderboard for a test
export const getTestLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const testIdInt = parseInt(testId);

    if (isNaN(testIdInt)) {
      res.status(400).json({ success: false, message: 'Invalid test ID' });
      return;
    }

    const test = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt },
      include: {
        course: true,
        subject: true
      }
    });

    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    if (!test.leaderboard_enabled) {
      res.status(403).json({ success: false, message: 'Leaderboard is not enabled for this test' });
      return;
    }

    // Get all completed attempts for this test, ordered by score (highest first)
    const leaderboard = await prisma.quizAttempt.findMany({
      where: {
        quiz_id: testIdInt,
        is_completed: true
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            avatar: true
          }
        },
        quiz: {
          include: {
            questions: {
              include: {
                question: true
              }
            }
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { time_taken: 'asc' }, // Faster completion time as tiebreaker
        { created_at: 'asc' }  // Earlier submission as final tiebreaker
      ]
    });

    // Add rank to each entry
    const leaderboardWithRank = leaderboard.map((attempt, index) => ({
      rank: index + 1,
      user_id: attempt.user.user_id,
      user_name: attempt.user.full_name,
      user_avatar: attempt.user.avatar,
      score: attempt.score || 0,
      total_marks: attempt.quiz.total_marks || 0, // Use total_marks directly from quiz table
      accuracy: attempt.accuracy || 0,
      time_taken: attempt.time_taken || 0,
      correct_answers: attempt.correct_answers || 0,
      total_questions: attempt.total_questions || 0,
      completed_at: attempt.submit_time
    }));

    res.json({
      success: true,
      data: {
        test: {
          quiz_id: test.quiz_id,
          title: test.title,
          type: test.type,
          course: test.course,
          subject: test.subject
        },
        leaderboard: leaderboardWithRank
      }
    });
  } catch (error) {
    logger.error('Get test leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
};

// Get Enhanced Leaderboard for Admin (All Students with Filters)
export const getEnhancedTestLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const { status = 'all' } = req.query; // all, completed, not-started, in-progress
    const testIdInt = parseInt(testId);

    if (isNaN(testIdInt)) {
      res.status(400).json({ success: false, message: 'Invalid test ID' });
      return;
    }

    // Get the test with its batch assignments
    const test = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt },
      include: {
        course: true,
        subject: true,
        quiz_batches: {
          include: {
            batch: { select: { batch_id: true, batch_name: true } }
          }
        },
        attempts: {
          include: {
            user: {
              select: {
                user_id: true,
                full_name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    // Get all students from the assigned batches
    const batchIds = test.quiz_batches?.map(qb => qb.batch.batch_id) || [];
    
    const allStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        ...(batchIds.length > 0 && {
          student_profile: {
            batch_id: {
              in: batchIds
            }
          }
        })
      },
      select: {
        user_id: true,
        full_name: true,
        email: true,
        avatar: true,
        student_profile: {
          select: {
            batch: {
              select: {
                batch_name: true
              }
            }
          }
        }
      }
    });

    // Map students with their attempt status and scores
    let studentsWithStatus = allStudents.map(student => {
      const attempt = test.attempts.find(a => a.user_id === student.user_id && a.is_completed);
      const inProgressAttempt = test.attempts.find(a => a.user_id === student.user_id && !a.is_completed);
      
      return {
        user_id: student.user_id,
        full_name: student.full_name,
        email: student.email,
        avatar: student.avatar,
        batch_name: student.student_profile?.batch?.batch_name,
        status: attempt ? 'completed' : (inProgressAttempt ? 'in-progress' : 'not-started'),
        attempt_id: attempt?.attempt_id || inProgressAttempt?.attempt_id,
        is_completed: !!attempt,
        score: attempt?.score || 0,
        accuracy: attempt?.accuracy || 0,
        correct_answers: attempt?.correct_answers || 0,
        total_questions: attempt?.total_questions || 0,
        time_taken: attempt?.time_taken || 0,
        start_time: attempt?.start_time || inProgressAttempt?.start_time,
        submit_time: attempt?.submit_time,
        created_at: attempt?.created_at || inProgressAttempt?.created_at,
        rank: null as number | null
      };
    });

    // Apply status filter
    if (status !== 'all') {
      studentsWithStatus = studentsWithStatus.filter(student => student.status === status);
    }

    // Sort by completion status and score
    studentsWithStatus.sort((a, b) => {
      // Completed attempts first, then by score (highest to lowest)
      if (a.is_completed && !b.is_completed) return -1;
      if (!a.is_completed && b.is_completed) return 1;
      if (a.is_completed && b.is_completed) {
        if (b.score !== a.score) return b.score - a.score;
        // Tiebreaker: faster time
        return (a.time_taken || 0) - (b.time_taken || 0);
      }
      // For non-completed, sort by name
      return a.full_name.localeCompare(b.full_name);
    });

    // Add ranks for completed students
    let rank = 1;
    studentsWithStatus.forEach((student, index) => {
      if (student.is_completed) {
        if (index > 0 && studentsWithStatus[index - 1].is_completed && 
            studentsWithStatus[index - 1].score === student.score) {
          // Same score as previous student, same rank
          student.rank = studentsWithStatus[index - 1].rank;
        } else {
          student.rank = rank;
        }
        rank++;
      } else {
        student.rank = null;
      }
    });

    res.json({
      success: true,
      data: {
        test: {
          quiz_id: test.quiz_id,
          title: test.title,
          type: test.type,
                  course: test.course,
        subject: test.subject,
        batchIds: test.quiz_batches?.map((qb: any) => qb.batch.batch_id) || [],
        batches: test.quiz_batches?.map((qb: any) => qb.batch.batch_name) || []
        },
        stats: {
          total_students: allStudents.length,
          completed: studentsWithStatus.filter(s => s.is_completed).length,
          in_progress: studentsWithStatus.filter(s => s.status === 'in-progress').length,
          not_started: studentsWithStatus.filter(s => s.status === 'not-started').length
        },
        students: studentsWithStatus
      }
    });
  } catch (error) {
    logger.error('Get enhanced test leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enhanced leaderboard' });
  }
};

// Get All Test Reports for Admin Dashboard
// Get All Students for a Test
export const getTestStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const testIdInt = parseInt(testId);

    if (isNaN(testIdInt)) {
      res.status(400).json({
        success: false,
        message: 'Invalid test ID'
      });
      return;
    }

    // Get the test with its batch assignments
    const test = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt },
      include: {
        course: true,
        subject: true,
        quiz_batches: {
          include: {
            batch: { select: { batch_id: true, batch_name: true } }
          }
        },
        attempts: {
          include: {
            user: {
              select: {
                user_id: true,
                full_name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    // Get all students from the assigned batches
    const batchIds = test.quiz_batches?.map(qb => qb.batch.batch_id) || [];
    
    const allStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        ...(batchIds.length > 0 && {
          student_profile: {
            batch_id: {
              in: batchIds
            }
          }
        })
      },
      select: {
        user_id: true,
        full_name: true,
        email: true,
        avatar: true,
        student_profile: {
          select: {
            batch: {
              select: {
                batch_name: true
              }
            }
          }
        }
      }
    });

    // Map students with their attempt status
    const studentsWithStatus = await Promise.all(allStudents.map(async student => {
      const attempt = test.attempts.find(a => a.user_id === student.user_id);
      
      // Calculate correct answers from user answers if attempt exists
      let correctAnswers = attempt?.correct_answers || 0;
      let wrongAnswers = attempt?.wrong_answers || 0;
      
      if (attempt && attempt.is_completed) {
        // Get user answers for this attempt
        const userAnswers = await prisma.userAnswer.findMany({
          where: { attempt_id: attempt.attempt_id },
          include: { question: true }
        });
        
        correctAnswers = userAnswers.filter(ua => ua.is_correct).length;
        wrongAnswers = userAnswers.filter(ua => !ua.is_correct && ua.answer_text && ua.answer_text.trim() !== '').length;
      }
      
      return {
        user_id: student.user_id,
        full_name: student.full_name,
        email: student.email,
        avatar: student.avatar,
        batch_name: student.student_profile?.batch?.batch_name,
        attempt_id: attempt?.attempt_id,
        is_completed: attempt?.is_completed || false,
        score: attempt?.score,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        total_questions: attempt?.total_questions,
        time_taken: attempt?.time_taken,
        start_time: attempt?.start_time,
        submit_time: attempt?.submit_time
      };
    }));

    res.json({
      success: true,
      data: studentsWithStatus
    });
  } catch (error) {
    logger.error('Get test students error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch test students' });
  }
};

export const getAllTestReports = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tests = await prisma.quiz.findMany({
      include: {
        course: true,
        subject: true,
        quiz_batches: {
          include: {
            batch: { select: { batch_id: true, batch_name: true } }
          }
        },
        attempts: {
          include: {
            user: {
              select: {
                user_id: true,
                full_name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const testReports = tests.map((test: any) => {
      const totalAttempts = test.attempts.length;
      const completedAttempts = test.attempts.filter((a: any) => a.is_completed).length;
      const unattendedAttempts = test.attempts.filter((a: any) => a.is_unattended).length;
      const attendedAttempts = test.attempts.filter((a: any) => !a.is_unattended).length;
      const averageScore = attendedAttempts > 0
        ? test.attempts.filter((a: any) => !a.is_unattended).reduce((sum: number, a: any) => sum + a.score, 0) / attendedAttempts
        : 0;
      const passRate = attendedAttempts > 0
        ? (test.attempts.filter((a: any) => !a.is_unattended && a.score >= (test.passing_marks ?? 0)).length / attendedAttempts) * 100
        : 0;

      return {
        quiz_id: test.quiz_id,
        title: test.title,
        type: test.type,
        status: test.status,
        total_attempts: totalAttempts,
        completed_attempts: completedAttempts,
        unattended_attempts: unattendedAttempts,
        attended_attempts: attendedAttempts,
        average_score: Math.round(averageScore * 100) / 100,
        pass_percentage: Math.round(passRate * 100) / 100,
        total_questions: test._count.questions,
        total_marks: test.total_marks,
        leaderboard_enabled: test.leaderboard_enabled || false,
        course: test.course,
        subject: test.subject,
        batchIds: test.quiz_batches?.map((qb: any) => qb.batch.batch_id) || [],
        batches: test.quiz_batches?.map((qb: any) => qb.batch.batch_name) || [],
        created_at: test.created_at,
        updated_at: test.updated_at
      };
    });

    res.json({
      success: true,
      data: testReports
    });
  } catch (error) {
    logger.error('Get all test reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch test reports' });
  }
};

// Get Test Questions with Export Options
export const getTestQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    const { includeAnswers = 'false', format = 'json' } = req.query;
    const testIdInt = parseInt(testId);

    if (isNaN(testIdInt)) {
      res.status(400).json({ success: false, message: 'Invalid test ID' });
      return;
    }

    // Get test with questions
    const test = await prisma.quiz.findUnique({
      where: { quiz_id: testIdInt },
      include: {
        questions: { 
          include: { 
            question: true 
          },
          orderBy: { order: 'asc' }
        },
        course: { select: { name: true } },
        subject: { select: { name: true } }
      }
    });

    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    // Transform questions data
    const questions = test.questions.map((q: any, index: number) => {
      const questionData = {
        questionNumber: index + 1,
        questionId: q.question.question_id,
        questionText: q.question.question_text || '',
        type: q.question.type || '',
        difficulty: q.question.difficulty || '',
        topic: q.question.topic || '',
        marks: q.question.marks || q.marks || 1,
        options: q.question.options || [],
        correctAnswer: includeAnswers === 'true' ? (q.question.correct_answer || '') : '',
        explanation: includeAnswers === 'true' ? (q.question.explanation || '') : '',
        order: q.order
      };

      return questionData;
    });

    const responseData = {
      testId: test.quiz_id,
      testTitle: test.title,
      testType: test.type,
      course: test.course?.name || 'Common Test',
      subject: test.subject?.name || 'All Subjects',
      totalQuestions: questions.length,
      totalMarks: test.total_marks,
      duration: (test as any).duration || 0,
      questions: questions
    };

    // Handle different export formats
    if (format === 'csv') {
      const csvData = questions.map((q: any) => ({
        'Question Number': q.questionNumber || '',
        'Question Text': q.questionText || '',
        'Type': q.type || '',
        'Difficulty': q.difficulty || '',
        'Topic': q.topic || '',
        'Marks': q.marks || '',
        'Options': q.options ? JSON.stringify(q.options) : '',
        'Correct Answer': includeAnswers === 'true' ? (q.correctAnswer || '') : '',
        'Explanation': includeAnswers === 'true' ? (q.explanation || '') : ''
      }));

      // Convert to CSV
      const csvHeaders = Object.keys(csvData[0] || {});
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => 
          csvHeaders.map(header => {
            const value = (row as any)[header] || '';
            // Escape commas and quotes in CSV
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${test.title.replace(/[^a-zA-Z0-9]/g, '_')}_questions_${includeAnswers === 'true' ? 'with_answers' : 'without_answers'}.csv"`);
      res.send(csvContent);
      return;
    }

    if (format === 'pdf') {
      // For PDF export, we'll return JSON data that can be processed by frontend
      // Frontend can use libraries like jsPDF to generate PDF
      res.json({
        success: true,
        data: responseData,
        exportFormat: 'pdf',
        includeAnswers: includeAnswers === 'true'
      });
      return;
    }

    // Default JSON response
    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    logger.error('Get test questions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch test questions' });
  }
};
