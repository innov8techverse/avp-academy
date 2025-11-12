import { Request, Response } from 'express';
import { body } from 'express-validator';
import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { logger } from '../config/logger';
import { AuthRequest, ApiResponse } from '../types';
import EmailService from '../services/emailService';
import { validateSessionAndTimeout } from '../utils/sessionUtils';

// Generate a 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('role').optional().isIn(['STUDENT', 'ADMIN']).withMessage('Invalid role')
];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('Valid email is required')
];

export const verifyOTPValidation = [
  body('email')
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: false })
    .withMessage('Valid email is required'),
  body('otp').notEmpty().withMessage('OTP is required')
];

const onboardmailer = async(user :any)=>{
  try {
    await EmailService.sendUserOnboardingEmail(user);
  } catch (error) {
    logger.error('Failed to send onboarding email:', error);
    // Don't fail the registration if email fails
  }
}
// const passwordrestmailer = async (user :any,link:string)=>{
// forgotpasswowrdmailer(link,user)
// }

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, phone_number, role = 'STUDENT' } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone_number: phone_number || undefined }
        ]
      }
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone'
      });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        full_name,
        phone_number,
        role,
        student_profile: role === 'STUDENT' ? {
          create: {}
        } : undefined
      },
      include: {
        student_profile: true
      }
    });

    const token = generateToken(user);

    const response: ApiResponse = {
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          avatar: user.avatar
        },
        token
      }
    };

    logger.info(`User registered: ${user.email}`);
     onboardmailer(user)
    res.status(201).json(response);
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student_profile: {
          include: {
            batch: true,
            course: true
          }
        }
      }
    });

    if (!user || !user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials or inactive account'
      });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // ✅ Upsert session: ensures only one session per user
    const session = await prisma.session.upsert({
      where: { user_id: user.user_id },
      update: {
        is_active: true,
        last_active: new Date()
      },
      create: {
        user_id: user.user_id,
        is_active: true,
        last_active: new Date()
      }
    });

    const token = generateToken(user);

    const response: ApiResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          avatar: user.avatar,
          student_profile: user.student_profile
        },
        token,
        session_id: session.id
      }
    };

    logger.info(`User logged in: ${user.email}`);
    res.json(response);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset OTP has been sent.'
      });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await prisma.user.update({
      where: { email },
      data: {
        otp,
        otpExpiry
      }
    });

    // Send email using the email service
    try {
      await EmailService.sendOTPPasswordResetEmail(user, otp);
      logger.info(`Password reset OTP sent to: ${email}`);
    } catch (emailError) {
      logger.error('Failed to send password reset OTP email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset OTP has been sent.'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
export const resetPasswordValidation = [ body('otp').notEmpty().withMessage('OTP is required'), body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters') ];
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { otp, password } = req.body;

    // Find user by OTP
    const user = await prisma.user.findFirst({
      where: {
        otp: otp,
        otpExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password and clear OTP
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiry: null
      }
    });

    logger.info(`Password reset successful for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email: email,
        otp: otp,
        otpExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
      return;
    }

    res.json({
      success: true,
      message: 'OTP is valid',
      data: {
        email: user.email
      }
    });
  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const verifyResetToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Reset token is valid'
    });
  } catch (error) {
    logger.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user!.user_id },
      include: {
        student_profile: {
          include: {
            batch: true,
            course: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user_id: user!.user_id,
        email: user!.email,
        full_name: user!.full_name,
        phone_number: user!.phone_number,
        role: user!.role,
        avatar: user!.avatar,
        student_profile: user!.student_profile
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id } = req.body; // or extract from JWT in headers

    if (!user_id) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { user_id }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid user'
      });
      return;
    }

    // ✅ Set session inactive instead of deleting
    const updated = await prisma.session.updateMany({
      where: { user_id },
      data: { is_active: false }
    });

    logger.info(`User logged out: ${user.email}, sessions deactivated: ${updated.count}`);
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


// Session validation endpoint
export const validateSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Check if session exists, is active, and hasn't timed out
    const sessionValidation = await validateSessionAndTimeout(req.user.user_id);

    if (!sessionValidation.isValid) {
      res.status(401).json({
        success: false,
        message: sessionValidation.reason || 'Session expired or invalid',
        code: 'SESSION_EXPIRED'
      });
      return;
    }

    // Update last_active timestamp
    await prisma.session.update({
      where: { id: sessionValidation.session.id },
      data: { last_active: new Date() }
    });

    res.json({
      success: true,
      message: 'Session is valid',
      data: {
        session_id: sessionValidation.session.id,
        last_active: sessionValidation.session.last_active
      }
    });
  } catch (error) {
    logger.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};