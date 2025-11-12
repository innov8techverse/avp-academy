import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { logger } from '../config/logger';
import { hashPassword } from '../utils/password';

// Student Dashboard
export const getStudentDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;

    const student = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        student_profile: {
          include: {
            batch: true,
            course: true
          }
        }
      }
    });

    // Get student stats
    const [videosWatched, testsCompleted, totalVideos, activeTests] = await Promise.all([
      prisma.videoDownload.count({ where: { user_id: userId } }),
      prisma.quizAttempt.count({ where: { user_id: userId, is_completed: true } }),
      prisma.video.count({ 
        where: { 
          course_id: student?.student_profile?.course_id || undefined,
          is_published: true 
        } 
      }),
      prisma.quiz.count({ 
        where: { 
          course_id: student?.student_profile?.course_id || undefined,
          status: 'IN_PROGRESS' as any,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } }
          ]
        } 
      })
    ]);

    // Get recent activities
    const recentVideos = await prisma.video.findMany({
      where: { 
        course_id: student?.student_profile?.course_id || undefined,
        is_published: true 
      },
      take: 5,
      orderBy: { created_at: 'desc' }
    });

    const upcomingTests = await prisma.quiz.findMany({
      where: {
        course_id: student?.student_profile?.course_id || undefined,
        status: 'NOT_STARTED' as any,
        scheduled_at: { gt: new Date() }
      },
      take: 5,
      orderBy: { scheduled_at: 'asc' }
    });

    res.json({
      success: true,
      data: {
        student,
        stats: {
          videosWatched,
          testsCompleted,
          totalVideos,
          activeTests
        },
        recentVideos,
        upcomingTests
      }
    });
  } catch (error) {
    logger.error('Get student dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
};

// Get Student Profile
export const getStudentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;

    const student = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        student_profile: {
          include: {
            batch: true,
            course: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    logger.error('Get student profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// Update Student Profile
export const updateStudentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const { full_name, phone_number, address, emergency_contact, bio } = req.body;

    const student = await prisma.user.update({
      where: { user_id: userId },
      data: {
        full_name,
        phone_number,
        student_profile: {
          update: {
            address,
            emergency_contact,
            bio
          }
        }
      },
      include: {
        student_profile: {
          include: {
            batch: true,
            course: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: student
    });
  } catch (error) {
    logger.error('Update student profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// Change Password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { user_id: userId }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { user_id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

// Get Student Videos (based on batch/course)
export const getStudentVideos = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const { subject, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const student = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        student_profile: true
      }
    });

    const where: any = {
      course_id: student?.student_profile?.course_id || undefined,
      is_published: true
    };

    if (subject) {
      where.subject_id = subject;
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' }
      }),
      prisma.video.count({ where })
    ]);

    res.json({
      success: true,
      data: videos,
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Get student videos error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch videos' });
  }
};

// Get Student Materials
export const getStudentMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;
    const { subject } = req.query;

    const student = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        student_profile: true
      }
    });

    const batchId = student?.student_profile?.batch_id;
    const courseId = student?.student_profile?.course_id;

    // Build where clause for batch-specific or course-wide materials
    const where: any = {
      is_published: true
    };
    if (courseId) {
      where.course_id = courseId;
    }
    if (subject) {
      where.subject_id = subject;
    }
    if (batchId) {
      // Only materials assigned to this batch
      where.batch_materials = {
        some: {
          batch_id: batchId
        }
      };
    } else if (courseId) {
      // If no batch, show course-wide materials not assigned to any batch
      where.batch_materials = {
        none: {}
      };
    }

    const [materials, motivational] = await Promise.all([
      prisma.studyMaterial.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          subject: true,
          course: true,
          batch_materials: {
            include: { batch: true }
          }
        }
      }),
      prisma.studyMaterial.findFirst({
        where: { file_type: 'MOTIVATIONAL' },
        include: {
          course: true,
          subject: true,
          batch_materials: {
            include: {
              batch: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      })
    ]);

    res.json({
      success: true,
      data: [...materials, motivational].filter(item => item !== null)
    });
  } catch (error) {
    logger.error('Get student materials error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch materials' });
  }
};
