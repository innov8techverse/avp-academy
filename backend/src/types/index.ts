import { Request } from 'express';
import { User, StudentProfile, Batch, Course } from '@prisma/client';

// Extended User type with optional relations - make it consistent
export interface UserWithRelations extends User {
  student_profile?: (StudentProfile & {
    batch?: Batch;
    course?: Course;
  });
}

export interface AuthRequest extends Request {
  user?: UserWithRelations;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchQuery extends PaginationQuery {
  subject?: string;
  search?: string;
}

export interface QuizQuery extends PaginationQuery {
  subject?: string;
  type?: string;
  difficulty?: string;
}

export interface VideoQuery extends PaginationQuery {
  subject?: string;
  courseId?: string;
}

export interface QuizAnswer {
  questionId: string;
  answer: string;
  timeTaken: number;
}

export interface QuizSubmission {
  quizId: string;
  answers: QuizAnswer[];
  totalTimeTaken: number;
}

