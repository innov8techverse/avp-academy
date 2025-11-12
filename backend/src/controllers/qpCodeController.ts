import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../types';
import { logger } from '../config/logger';
import type { Prisma } from '@prisma/client';

// Get all QP Codes
export const getQPCodes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search 
    } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Prisma.QPCodeWhereInput = {};
    
    if (search) {
      where.OR = [
        { code: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [qpCodes, total] = await Promise.all([
      prisma.qPCode.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: { questions: true }
          },
          question_papers: {
            include: {
              _count: {
                select: { question_paper_questions: true }
              }
            }
          }
        }
      }),
      prisma.qPCode.count({ where })
    ]);

    res.json({
      success: true,
      data: qpCodes,
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    logger.error('Get QP codes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch QP codes' });
  }
};

// Get QP Code by ID
export const getQPCodeById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const qpCode = await prisma.qPCode.findUnique({
      where: { qp_code_id: parseInt(id) },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!qpCode) {
      res.status(404).json({ success: false, message: 'QP code not found' });
      return;
    }

    res.json({ success: true, data: qpCode });
  } catch (error) {
    logger.error('Get QP code by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch QP code' });
  }
};

// Create QP Code
export const createQPCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, description } = req.body;

    if (!code?.trim()) {
      res.status(400).json({ success: false, message: 'QP code is required' });
      return;
    }

    // Check if code already exists
    const existingCode = await prisma.qPCode.findUnique({
      where: { code: code.trim() }
    });

    if (existingCode) {
      res.status(400).json({ success: false, message: 'QP code already exists' });
      return;
    }

    const qpCode = await prisma.qPCode.create({
      data: {
        code: code.trim(),
        description: description?.trim() || null
      }
    });

    res.status(201).json({ success: true, data: qpCode });
  } catch (error) {
    logger.error('Create QP code error:', error);
    res.status(500).json({ success: false, message: 'Failed to create QP code' });
  }
};

// Update QP Code
export const updateQPCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { code, description } = req.body;

    if (!code?.trim()) {
      res.status(400).json({ success: false, message: 'QP code is required' });
      return;
    }

    // Check if code already exists (excluding current record)
    const existingCode = await prisma.qPCode.findFirst({
      where: { 
        code: code.trim(),
        qp_code_id: { not: parseInt(id) }
      }
    });

    if (existingCode) {
      res.status(400).json({ success: false, message: 'QP code already exists' });
      return;
    }

    const qpCode = await prisma.qPCode.update({
      where: { qp_code_id: parseInt(id) },
      data: {
        code: code.trim(),
        description: description?.trim() || null
      }
    });

    res.json({ success: true, data: qpCode });
  } catch (error: any) {
    logger.error('Update QP code error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'QP code not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update QP code' });
  }
};

// Delete QP Code
export const deleteQPCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if QP code has associated questions
    const questionsCount = await prisma.question.count({
      where: { qp_code_id: parseInt(id) }
    });

    if (questionsCount > 0) {
      res.status(400).json({ 
        success: false, 
        message: `Cannot delete QP code. It has ${questionsCount} associated questions.` 
      });
      return;
    }

    await prisma.qPCode.delete({
      where: { qp_code_id: parseInt(id) }
    });

    res.json({ success: true, message: 'QP code deleted successfully' });
  } catch (error: any) {
    logger.error('Delete QP code error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'QP code not found' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to delete QP code' });
  }
};
