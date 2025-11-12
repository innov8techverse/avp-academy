import { apiClient } from '../api';

export interface QuestionPaper {
  paper_id: number;
  paper_code: string;
  paper_name: string;
  total_questions: number;
  total_marks: number;
  duration_minutes?: number;
  difficulty_distribution?: any;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  qp_code_id: number;
  _count?: {
    question_paper_questions: number;
  };
}

export interface QPCode {
  qp_code_id: number;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
  _count?: {
    questions: number;
  };
  question_papers?: QuestionPaper[];
}

export interface CreateQPCodeData {
  code: string;
  description?: string;
}

export interface QPCodeQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export const qpCodeService = {
  getQPCodes: async (params: QPCodeQuery = {}) => {
    const response = await apiClient.get('/qp-codes', { params });
    return response;
  },

  getQPCodeById: async (id: string) => {
    return await apiClient.get(`/qp-codes/${id}`);
  },

  createQPCode: async (data: CreateQPCodeData) => {
    return await apiClient.post('/qp-codes', data);
  },

  updateQPCode: async (id: string, data: Partial<CreateQPCodeData>) => {
    return await apiClient.put(`/qp-codes/${id}`, data);
  },

  deleteQPCode: async (id: string) => {
    return await apiClient.delete(`/qp-codes/${id}`);
  }
};
