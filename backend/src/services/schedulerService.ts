import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';
import * as cron from 'node-cron';
import { cleanupExpiredSessions } from '../utils/sessionUtils';

const prisma = new PrismaClient();

export class SchedulerService {
  private cronJob: cron.ScheduledTask | null = null;
  private lastRunTime: Date | null = null;

  /**
   * Start the scheduler service
   */
  start(): void {
    if (this.cronJob) {
      logger.warn('Scheduler service is already running');
      return;
    }

    logger.info('🔧 Starting test scheduler service...');
    
    // Run immediately on start
    this.processScheduledTests();
    this.cleanupExpiredSessions();
    
    // Set up CRON job to run every minute
    this.cronJob = cron.schedule('* * * * *', () => {
      // const now = new Date();
      // const istTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      // logger.info(`⏰ CRON JOB RUNNING at ${istTime} (IST) - Checking scheduled tests...`);
      this.processScheduledTests();
      this.cleanupExpiredSessions();
    });

    this.cronJob.start();
    // logger.info('✅ Test scheduler service started with CRON job (runs every minute)');
  }

  /**
   * Stop the scheduler service
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('🛑 Test scheduler service stopped');
    }
  }

  /**
   * Process all scheduled tests and update their statuses
   */
  private async processScheduledTests(): Promise<void> {
    try {
      const now = new Date();
      this.lastRunTime = now;
      // const istTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      
      // logger.info(`🔍 PROCESSING SCHEDULED TESTS at ${istTime} (IST) | Current UTC: ${now.toISOString()}`);
      
      // Process tests that should start
      await this.processTestStarts(now);
      
      // Process tests that should end
      await this.processTestEnds(now);
      
      // Process grace period completions
      await this.processGracePeriodEnds(now);
      
      // Process unattended tests
      await this.processUnattendedTests(now);
      
      // Process result publishing
      await this.processResultPublishing(now);
      
    } catch (error) {
      logger.error('Error processing scheduled tests:', error);
    }
  }

  /**
   * Process tests that should transition from NOT_STARTED to IN_PROGRESS
   */
  private async processTestStarts(now: Date): Promise<void> {
    try {
      const testsToStart = await prisma.quiz.findMany({
        where: {
          status: 'NOT_STARTED',
          start_time: {
            lte: now
          },
          auto_start: true,
          is_active: true
        },
        select: {
          quiz_id: true,
          title: true,
          start_time: true
        }
      });

      if (testsToStart.length > 0) {
        const istTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        logger.info(`🚀 STARTING ${testsToStart.length} TESTS at ${istTime} (IST)`, testsToStart.map(t => ({
          id: t.quiz_id,
          title: t.title,
          start_time: t.start_time?.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          status: 'NOT_STARTED → IN_PROGRESS'
        })));

        const updatedTests = await prisma.quiz.updateMany({
          where: {
            quiz_id: {
              in: testsToStart.map(t => t.quiz_id)
            }
          },
          data: {
            status: 'IN_PROGRESS',
            updated_at: now
          }
        });

        logger.info(`✅ Successfully started ${updatedTests.count} tests at ${istTime} (IST)`);

        // Send notifications to students about test availability
        for (const test of testsToStart) {
          await this.notifyTestStart(test);
        }
      }
    } catch (error) {
      logger.error('Error processing test starts:', error);
    }
  }

  /**
   * Process tests that should transition from IN_PROGRESS to COMPLETED
   */
  private async processTestEnds(now: Date): Promise<void> {
    try {
      const testsToEnd = await prisma.quiz.findMany({
        where: {
          status: 'IN_PROGRESS',
          end_time_scheduled: {
            lte: now
          },
          auto_end: true,
          is_active: true
        },
        select: {
          quiz_id: true,
          title: true,
          end_time_scheduled: true,
          grace_period_minutes: true
        }
      });

      if (testsToEnd.length > 0) {
        const istTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        logger.info(`🏁 ENDING ${testsToEnd.length} TESTS at ${istTime} (IST)`, testsToEnd.map(t => ({
          id: t.quiz_id,
          title: t.title,
          end_time: t.end_time_scheduled?.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          grace_period: (t.grace_period_minutes ?? 0) + ' minutes',
          status: 'IN_PROGRESS → COMPLETED'
        })));

        const updatedTests = await prisma.quiz.updateMany({
          where: {
            quiz_id: {
              in: testsToEnd.map(t => t.quiz_id)
            }
          },
          data: {
            status: 'COMPLETED',
            updated_at: now
          }
        });

        logger.info(`✅ Successfully ended ${updatedTests.count} tests at ${istTime} (IST)`);

        // Auto-submit incomplete attempts for ended tests
        for (const test of testsToEnd) {
          await this.autoSubmitIncompleteAttempts(test.quiz_id, now);
          await this.notifyTestEnd(test);
        }
      }
    } catch (error) {
      logger.error('Error processing test ends:', error);
    }
  }

  /**
   * Process grace period completions
   */
  private async processGracePeriodEnds(now: Date): Promise<void> {
    try {
      const testsWithGracePeriod = await prisma.quiz.findMany({
        where: {
          status: 'IN_PROGRESS',
          end_time_scheduled: {
            not: null
          },
          grace_period_minutes: {
            gt: 0
          },
          is_active: true
        },
        select: {
          quiz_id: true,
          title: true,
          end_time_scheduled: true,
          grace_period_minutes: true
        }
      });

      for (const test of testsWithGracePeriod) {
        if (test.end_time_scheduled && test.grace_period_minutes !== null) {
          const graceEndTime = new Date(test.end_time_scheduled.getTime() + (test.grace_period_minutes * 60 * 1000));
          
          if (now >= graceEndTime) {
            const istTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            logger.info(`⏰ GRACE PERIOD ENDED for test ${test.quiz_id} (${test.title}) at ${istTime} (IST)`);
            
            await this.forceSubmitRemainingAttempts(test.quiz_id, graceEndTime);
            await this.updateTestStatus(test.quiz_id, 'COMPLETED');
          }
        }
      }
    } catch (error) {
      logger.error('Error processing grace period ends:', error);
    }
  }

  /**
   * Process unattended tests - mark students who didn't attend as unattended
   */
  private async processUnattendedTests(now: Date): Promise<void> {
    try {
      // Find completed tests that ended recently (within last 5 minutes)
      const recentEndTime = new Date(now.getTime() - (5 * 60 * 1000)); // 5 minutes ago
      
      const completedTests = await prisma.quiz.findMany({
        where: {
          status: 'COMPLETED',
          end_time_scheduled: {
            gte: recentEndTime,
            lte: now
          },
          is_active: true
        },
        select: {
          quiz_id: true,
          title: true,
          end_time_scheduled: true,
          grace_period_minutes: true
        }
      });

      for (const test of completedTests) {
        if (test.end_time_scheduled && test.grace_period_minutes !== null) {
          const graceEndTime = new Date(test.end_time_scheduled.getTime() + (test.grace_period_minutes * 60 * 1000));
          
          // Find students who didn't attempt this test
          const eligibleStudents = await this.getEligibleStudents(test.quiz_id);
          const attemptedStudents = await prisma.quizAttempt.findMany({
            where: {
              quiz_id: test.quiz_id
            },
            select: {
              user_id: true
            }
          });

          const attemptedUserIds = new Set(attemptedStudents.map(a => a.user_id));
          const unattendedStudents = eligibleStudents.filter(student => !attemptedUserIds.has(student.user_id));

          if (unattendedStudents.length > 0) {
            const istTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            logger.info(`🚫 MARKING ${unattendedStudents.length} UNATTENDED STUDENTS for test ${test.quiz_id} (${test.title}) at ${istTime} (IST)`, unattendedStudents.map(s => ({ user_id: s.user_id })));

            // Create unattended attempts for students who didn't attend
            for (const student of unattendedStudents) {
              await prisma.quizAttempt.create({
                data: {
                  user_id: student.user_id,
                  quiz_id: test.quiz_id,
                  score: 0,
                  total_questions: 0,
                  correct_answers: 0,
                  wrong_answers: 0,
                  unattempted: 0,
                  accuracy: 0,
                  is_completed: true,
                  is_unattended: true,
                  start_time: test.end_time_scheduled,
                  submit_time: graceEndTime,
                  time_taken: 0,
                  created_at: graceEndTime,
                  updated_at: graceEndTime
                }
              });

              logger.info(`✅ Created unattended attempt for user ${student.user_id} in test ${test.quiz_id}`);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error processing unattended tests:', error);
    }
  }

  /**
   * Auto-submit incomplete attempts when test ends
   */
  private async autoSubmitIncompleteAttempts(quizId: number, endTime: Date): Promise<void> {
    try {
      const incompleteAttempts = await prisma.quizAttempt.findMany({
        where: {
          quiz_id: quizId,
          is_completed: false
        },
        include: {
          user: {
            select: {
              user_id: true,
              full_name: true
            }
          }
        }
      });

      if (incompleteAttempts.length > 0) {
        const istTime = endTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        logger.info(`🔄 AUTO-SUBMITTING ${incompleteAttempts.length} incomplete attempts for quiz ${quizId} at ${istTime} (IST)`, incompleteAttempts.map(a => ({
          attempt_id: a.attempt_id,
          user: a.user?.full_name || 'Unknown',
          started_at: a.start_time.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          time_elapsed: Math.floor((endTime.getTime() - a.start_time.getTime()) / 1000 / 60) + ' minutes'
        })));

        for (const attempt of incompleteAttempts) {
          // Calculate score based on answered questions
          const userAnswers = await prisma.userAnswer.findMany({
            where: { attempt_id: attempt.attempt_id },
            include: {
              question: {
                select: { marks: true }
              }
            }
          });

          const score = userAnswers.reduce((total, answer) => {
            return total + (answer.marks_obtained || 0);
          }, 0);

          const correctAnswers = userAnswers.filter(answer => answer.is_correct).length;
          const wrongAnswers = userAnswers.filter(answer => !answer.is_correct).length;
          const totalQuestions = userAnswers.length;
          const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

          // Calculate time taken (even if student started late)
          const timeTaken = Math.floor((endTime.getTime() - attempt.start_time.getTime()) / 1000);

          // Update attempt
          await prisma.quizAttempt.update({
            where: { attempt_id: attempt.attempt_id },
            data: {
              is_completed: true,
              submit_time: endTime,
              score,
              correct_answers: correctAnswers,
              wrong_answers: wrongAnswers,
              total_questions: totalQuestions,
              accuracy,
              time_taken: timeTaken,
              updated_at: endTime
            }
          });

          logger.info(`✅ Auto-submitted attempt ${attempt.attempt_id} for user ${attempt.user?.full_name || 'Unknown'} | Score: ${score}/${totalQuestions} | Accuracy: ${accuracy.toFixed(1)}% | Time: ${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`);
        }
      }
    } catch (error) {
      logger.error(`Error auto-submitting attempts for quiz ${quizId}:`, error);
    }
  }

  /**
   * Force submit remaining attempts after grace period
   */
  private async forceSubmitRemainingAttempts(quizId: number, forceTime: Date): Promise<void> {
    try {
      const remainingAttempts = await prisma.quizAttempt.updateMany({
        where: {
          quiz_id: quizId,
          is_completed: false
        },
        data: {
          is_completed: true,
          submit_time: forceTime,
          updated_at: forceTime
        }
      });

      if (remainingAttempts.count > 0) {
        logger.info(`Force-submitted ${remainingAttempts.count} remaining attempts for quiz ${quizId}`);
      }
    } catch (error) {
      logger.error(`Error force-submitting attempts for quiz ${quizId}:`, error);
    }
  }

  /**
   * Send notification when test starts
   */
  private async notifyTestStart(test: { quiz_id: number; title: string; start_time: Date | null }): Promise<void> {
    try {
      // Get all eligible students for this test
      const eligibleStudents = await this.getEligibleStudents(test.quiz_id);

      if (eligibleStudents.length > 0) {
        const notifications = eligibleStudents.map(student => ({
          user_id: student.user_id,
          title: 'Test Available',
          message: `"${test.title}" is now available for you to attempt.`,
          type: 'QUIZ' as const,
          data: {
            quiz_id: test.quiz_id,
            action: 'test_started'
          }
        }));

        await prisma.notification.createMany({
          data: notifications
        });

        logger.info(`Sent test start notifications to ${eligibleStudents.length} students for test: ${test.title}`);
      }
    } catch (error) {
      logger.error(`Error sending test start notifications for test ${test.quiz_id}:`, error);
    }
  }

  /**
   * Send notification when test ends
   */
  private async notifyTestEnd(test: { quiz_id: number; title: string; end_time_scheduled: Date | null }): Promise<void> {
    try {
      // Get students who have attempted the test
      const studentsWithAttempts = await prisma.quizAttempt.findMany({
        where: { quiz_id: test.quiz_id },
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
          title: 'Test Completed',
          message: `"${test.title}" has ended. Your responses have been submitted.`,
          type: 'QUIZ' as const,
          data: {
            quiz_id: test.quiz_id,
            action: 'test_ended'
          }
        }));

        await prisma.notification.createMany({
          data: notifications
        });

        logger.info(`Sent test end notifications to ${studentsWithAttempts.length} students for test: ${test.title}`);
      }
    } catch (error) {
      logger.error(`Error sending test end notifications for test ${test.quiz_id}:`, error);
    }
  }

  /**
   * Process result publishing based on result_release_time
   */
  private async processResultPublishing(now: Date): Promise<void> {
    try {
      const testsToPublishResults = await prisma.quiz.findMany({
        where: {
          status: 'COMPLETED',
          result_release_time: {
            lte: now
          },
          show_correct_answers: false, // Only publish if results haven't been published yet
          is_active: true
        },
        select: {
          quiz_id: true,
          title: true,
          result_release_time: true,
          show_correct_answers: true
        }
      });

      if (testsToPublishResults.length > 0) {
        const istTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        logger.info(`📊 PUBLISHING RESULTS for ${testsToPublishResults.length} TESTS at ${istTime} (IST)`, testsToPublishResults.map(t => ({
          id: t.quiz_id,
          title: t.title,
          result_release_time: t.result_release_time?.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          show_correct_answers: t.show_correct_answers
        })));

        for (const test of testsToPublishResults) {
          await this.publishTestResults(test.quiz_id, now);
          await this.notifyResultPublished(test);
        }

        logger.info(`✅ Successfully published results for ${testsToPublishResults.length} tests at ${istTime} (IST)`);
      }
    } catch (error) {
      logger.error('Error processing result publishing:', error);
    }
  }

  /**
   * Publish test results by updating show_correct_answers to true
   */
  private async publishTestResults(quizId: number, publishTime: Date): Promise<void> {
    try {
      // First check if results are already published
      const existingTest = await prisma.quiz.findUnique({
        where: { quiz_id: quizId },
        select: { show_correct_answers: true, title: true }
      });

      if (!existingTest) {
        logger.error(`Test ${quizId} not found for result publishing`);
        return;
      }

      if (existingTest.show_correct_answers) {
        logger.info(`📋 Results already published for test "${existingTest.title}" (ID: ${quizId}) - skipping`);
        return;
      }

      await prisma.quiz.update({
        where: { quiz_id: quizId },
        data: {
          show_correct_answers: true,
          updated_at: publishTime
        }
      });

      logger.info(`✅ Published results for test "${existingTest.title}" (ID: ${quizId})`);
    } catch (error) {
      logger.error(`Error publishing results for test ${quizId}:`, error);
    }
  }

  /**
   * Send notification when results are published
   */
  private async notifyResultPublished(test: { quiz_id: number; title: string; result_release_time: Date | null }): Promise<void> {
    try {
      // Check if results are actually published before sending notifications
      const currentTest = await prisma.quiz.findUnique({
        where: { quiz_id: test.quiz_id },
        select: { show_correct_answers: true }
      });

      if (!currentTest || !currentTest.show_correct_answers) {
        logger.info(`📋 Skipping notifications for test "${test.title}" (ID: ${test.quiz_id}) - results not yet published`);
        return;
      }

      // Get students who have attempted the test
      const studentsWithAttempts = await prisma.quizAttempt.findMany({
        where: { quiz_id: test.quiz_id },
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
          message: `Results for "${test.title}" are now available. You can view your performance and correct answers.`,
          type: 'QUIZ' as const,
          data: {
            quiz_id: test.quiz_id,
            action: 'results_published'
          }
        }));

        await prisma.notification.createMany({
          data: notifications
        });

        logger.info(`Sent result published notifications to ${studentsWithAttempts.length} students for test: ${test.title}`);
      }
    } catch (error) {
      logger.error(`Error sending result published notifications for test ${test.quiz_id}:`, error);
    }
  }

  /**
   * Get eligible students for a test
   */
  private async getEligibleStudents(quizId: number): Promise<Array<{ user_id: number }>> {
    try {
      const quiz = await prisma.quiz.findUnique({
        where: { quiz_id: quizId },
        select: {
          quiz_batches: {
            include: {
              batch: { select: { batch_id: true } }
            }
          },
          course_id: true
        }
      });

      if (!quiz) return [];

      let whereConditions = [];

      // Check if test is assigned to specific batches
      if (quiz.quiz_batches && quiz.quiz_batches.length > 0) {
        const batchIds = quiz.quiz_batches.map(qb => qb.batch.batch_id);
        whereConditions.push({ batch_id: { in: batchIds } });
      }

      if (quiz.course_id) {
        whereConditions.push({ course_id: quiz.course_id });
      }

      if (whereConditions.length === 0) return [];

      const students = await prisma.studentProfile.findMany({
        where: {
          OR: whereConditions
        },
        select: {
          user_id: true
        }
      });

      return students;
    } catch (error) {
      logger.error(`Error getting eligible students for quiz ${quizId}:`, error);
      return [];
    }
  }

  /**
   * Manual test status update (for immediate transitions)
   */
  async updateTestStatus(quizId: number, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED'): Promise<boolean> {
    try {
      const now = new Date();
      
      await prisma.quiz.update({
        where: { quiz_id: quizId },
        data: {
          status,
          updated_at: now
        }
      });

      logger.info(`Manually updated test ${quizId} status to ${status}`);
      return true;
    } catch (error) {
      logger.error(`Error manually updating test ${quizId} status:`, error);
      return false;
    }
  }

  /**
   * Clean up expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const cleanedCount = await cleanupExpiredSessions();
      if (cleanedCount > 0) {
        logger.info(`🧹 Cleaned up ${cleanedCount} expired sessions`);
      }
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { running: boolean; cronExpression: string; lastRun?: Date } {
    return {
      running: this.cronJob !== null,
      cronExpression: '* * * * *', // Every minute
      lastRun: this.lastRunTime || undefined
    };
  }

  /**
   * Manual trigger for testing purposes
   */
  async manualTrigger(): Promise<void> {
    logger.info('🔧 MANUAL TRIGGER: Running scheduler manually for testing...');
    await this.processScheduledTests();
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();