import { apiClient } from '../api';

export interface Question {
  question_id: number;
  question_text: string;
  type: 'MCQ' | 'FILL_IN_THE_BLANK' | 'TRUE_FALSE' | 'MATCH' | 'CHOICE_BASED';
  qp_code_id?: number;
  topic?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options?: any;
  correct_answer: string;
  explanation?: string;
  marks: number;
  left_side?: string;
  right_side?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  qp_code?: {
    qp_code_id: number;
    code: string;
    description: string;
  };
}

export interface CreateQuestionData {
  question_text: string;
  type: 'MCQ' | 'FILL_IN_THE_BLANK' | 'TRUE_FALSE' | 'MATCH' | 'CHOICE_BASED';
  qp_code_id?: number;
  topic?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options?: any;
  correct_answer: string;
  explanation?: string;
  marks?: number;
  left_side?: string;
  right_side?: string;
  tags?: string[];
}

export interface UpdateQuestionData extends Partial<CreateQuestionData> {}

export interface QuestionQuery {
  page?: number;
  limit?: number;
  search?: string;
  qp_code_id?: number;
  topic?: string;
  difficulty?: string;
  type?: string;
}

export const questionBankService = {
  // Get all questions with filtering and pagination
  getQuestions: async (params: QuestionQuery = {}) => {
    const response = await apiClient.get('/question-bank', { params });
    return response;
  },

  // Get a specific question
  getQuestion: async (id: string) => {
    return await apiClient.get(`/question-bank/${id}`);
  },

  // Create a new question
  createQuestion: async (data: CreateQuestionData) => {
    return await apiClient.post('/question-bank', data);
  },

  // Update a question
  updateQuestion: async (id: string, data: UpdateQuestionData) => {
    const response = await apiClient.put(`/question-bank/${id}`, data);
    return response;
  },

  // Delete a question
  deleteQuestion: async (id: string) => {
    return await apiClient.delete(`/question-bank/${id}`);
  },

  // Get question count statistics
  getQuestionsCount: async (params: QuestionQuery = {}) => {
    return await apiClient.get('/question-bank/count', { params });
  },

  // Bulk import questions
  bulkImportQuestions: async (questions: CreateQuestionData[]) => {
    return await apiClient.post('/question-bank/bulk-import', { questions });
  }
};