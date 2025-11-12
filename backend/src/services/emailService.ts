import forgotpasswordmailer from '../mailers/forgotpasswordmailer';
import otpPasswordResetMailer from '../mailers/otpPasswordReset';
import usercreationmail from '../mailers/usercraetionmail';
// @ts-ignore - JavaScript file without type definitions
import quizcreationalert from '../mailers/newquizaltertr';
import { logger } from '../config/logger';

export interface EmailData {
  to: string;
  subject?: string;
  data?: any;
}

export interface UserData {
  email: string;
  full_name: string;
  [key: string]: any;
}

export interface QuizData {
  title: string;
  end_time_scheduled?: Date;
  endtime?: Date; // For backward compatibility with existing email templates
  [key: string]: any;
}

export class EmailService {
  /**
   * Send forgot password email
   */
  static async sendForgotPasswordEmail(user: UserData, resetLink: string): Promise<boolean> {
    try {
      forgotpasswordmailer(resetLink, user);
      logger.info(`Forgot password email sent to: ${user.email}`);
      return true;
    } catch (error) {
      logger.error('Failed to send forgot password email:', error);
      return false;
    }
  }

  /**
   * Send OTP password reset email
   */
  static async sendOTPPasswordResetEmail(user: UserData, otp: string): Promise<boolean> {
    try {
      otpPasswordResetMailer(otp, user);
      logger.info(`OTP password reset email sent to: ${user.email}`);
      return true;
    } catch (error) {
      logger.error('Failed to send OTP password reset email:', error);
      return false;
    }
  }

  /**
   * Send user onboarding/welcome email
   */
  static async sendUserOnboardingEmail(user: UserData): Promise<boolean> {
    try {
      // The usercreationmail function handles its own promise internally
      // We just need to call it and let it handle the email sending
      usercreationmail(user);
      
      logger.info(`User onboarding email sent to: ${user.email}`);
      return true;
    } catch (error) {
      logger.error('Failed to send user onboarding email:', error);
      return false;
    }
  }

  /**
   * Send quiz creation alert email
   */
static async sendQuizCreationAlert(quiz: QuizData, user: UserData): Promise<boolean> {
  try {
    // Format endtime to string if it's a Date
    const endtime = quiz.end_time_scheduled
      ? quiz.end_time_scheduled.toISOString()
      : quiz.endtime?.toString() || "";

    const quizForEmail = {
      ...quiz,
      endtime, // always a string now
    };

    quizcreationalert(quizForEmail, user);
    logger.info(`Quiz creation alert sent to: ${user.email} for quiz: ${quiz.title}`);
    return true;
  } catch (error) {
    logger.error("Failed to send quiz creation alert:", error);
    return false;
  }
}

  /**
   * Send quiz notification to students in specific batches
   */
  static async sendQuizNotificationToBatches(
    quiz: QuizData, 
    batchIds: number[]
  ): Promise<{ success: boolean; sentTo: number; errors: string[] }> {
    try {
      const { prisma } = await import('../config/database');
      
      // Get students in the specified batches
      const students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          is_active: true,
          student_profile: {
            batch_id: {
              in: batchIds
            }
          }
        },
        select: {
          user_id: true,
          email: true,
          full_name: true
        }
      });

      if (students.length === 0) {
        logger.warn(`No students found in batches: ${batchIds.join(', ')}`);
        return { success: false, sentTo: 0, errors: ['No students found in specified batches'] };
      }

      const errors: string[] = [];
      let sentCount = 0;

      // Send emails to all students in batches
      for (const student of students) {
        try {
          const success = await this.sendQuizCreationAlert(quiz, student);
          if (success) {
            sentCount++;
          } else {
            errors.push(`Failed to send email to ${student.email}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Error sending email to ${student.email}: ${errorMessage}`);
        }
      }

      logger.info(`Quiz notification sent to ${sentCount}/${students.length} students in batches: ${batchIds.join(', ')}`);
      
      return {
        success: sentCount > 0,
        sentTo: sentCount,
        errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to send quiz notifications to batches:', error);
      return { success: false, sentTo: 0, errors: [errorMessage] };
    }
  }

  /**
   * Send quiz notification to all students (for common tests)
   */
  static async sendQuizNotificationToAllStudents(
    quiz: QuizData
  ): Promise<{ success: boolean; sentTo: number; errors: string[] }> {
    try {
      const { prisma } = await import('../config/database');
      
      // Get all active students
      const students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          is_active: true
        },
        select: {
          user_id: true,
          email: true,
          full_name: true
        }
      });

      if (students.length === 0) {
        logger.warn('No active students found');
        return { success: false, sentTo: 0, errors: ['No active students found'] };
      }

      const errors: string[] = [];
      let sentCount = 0;

      // Send emails to all students
      for (const student of students) {
        try {
          const success = await this.sendQuizCreationAlert(quiz, student);
          if (success) {
            sentCount++;
          } else {
            errors.push(`Failed to send email to ${student.email}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Error sending email to ${student.email}: ${errorMessage}`);
        }
      }

      logger.info(`Quiz notification sent to ${sentCount}/${students.length} students`);
      
      return {
        success: sentCount > 0,
        sentTo: sentCount,
        errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to send quiz notifications to all students:', error);
      return { success: false, sentTo: 0, errors: [errorMessage] };
    }
  }

  /**
   * Send bulk email notifications
   */
  static async sendBulkEmails(
    emails: string[],
    subject: string,
    htmlContent: string
  ): Promise<{ success: boolean; sentTo: number; errors: string[] }> {
    try {
      const mailBoiler = require('../mailers/mailconfig');
      const errors: string[] = [];
      let sentCount = 0;

      for (const email of emails) {
        try {
          mailBoiler(email, htmlContent, subject);
          sentCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to send email to ${email}: ${errorMessage}`);
        }
      }

      logger.info(`Bulk emails sent to ${sentCount}/${emails.length} recipients`);
      
      return {
        success: sentCount > 0,
        sentTo: sentCount,
        errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to send bulk emails:', error);
      return { success: false, sentTo: 0, errors: [errorMessage] };
    }
  }
}

export default EmailService;
