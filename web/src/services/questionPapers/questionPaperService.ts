import { apiClient } from '../api';

export interface QuestionPaper {
  paper_id: number;
  paper_code: string;
  paper_name: string;
  qp_code_id: number;
  total_marks: number;
  total_questions: number;
  duration_minutes: number | null;
  description: string | null;
  difficulty_distribution: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  qp_code?: {
    qp_code_id: number;
    code: string;
    description: string;
  };
  question_paper_questions?: QuestionPaperQuestion[];
  _count?: {
    question_paper_questions: number;
  };
}

export interface QuestionPaperQuestion {
  id: number;
  paper_id: number;
  question_id: number;
  question_number: number;
  marks: number;
  questions?: {
    question_id: number;
    question_text: string;
    type: string;
    subject_id: number;
    topic: string;
    difficulty: string;
    correct_answer: string;
    explanation: string | null;
    marks: number;
    subject?: {
      subject_id: number;
      name: string;
    };
  };
}

export interface CreateQuestionPaperData {
  paper_name: string;
  qp_code_id: number;
  total_marks?: number;
  total_questions?: number;
  duration_minutes?: number;
  description?: string;
  difficulty_distribution?: string;
  questions?: any[];
}

export interface UpdateQuestionPaperData extends Partial<CreateQuestionPaperData> {}

export interface QuestionPaperQuery {
  page?: number;
  limit?: number;
  search?: string;
  qp_code_id?: number;
  is_active?: boolean;
}

export interface AddQuestionsToPaperData {
  questions: Array<{
    question_id: number;
    question_number?: number;
    marks?: number;
  }>;
}

export const questionPaperService = {
  // Get all question papers with filtering and pagination
  getQuestionPapers: async (params: QuestionPaperQuery = {}) => {
    const response = await apiClient.get('/question-papers', { params });
    return response;
  },

  // Get a specific question paper with questions
  getQuestionPaper: async (id: string) => {
    return await apiClient.get(`/question-papers/${id}`);
  },

  // Create a new question paper
  createQuestionPaper: async (data: CreateQuestionPaperData) => {
    return await apiClient.post('/question-papers', data);
  },

  // Update a question paper
  updateQuestionPaper: async (id: string, data: UpdateQuestionPaperData) => {
    return await apiClient.put(`/question-papers/${id}`, data);
  },

  // Delete a question paper
  deleteQuestionPaper: async (id: string) => {
    return await apiClient.delete(`/question-papers/${id}`);
  },

  // Add questions to a question paper
  addQuestionsToPaper: async (id: string, data: AddQuestionsToPaperData) => {
    return await apiClient.post(`/question-papers/${id}/questions`, data);
  },

  // Remove a question from a question paper
  removeQuestionFromPaper: async (paperId: string, questionId: string) => {
    return await apiClient.delete(`/question-papers/${paperId}/questions/${questionId}`);
  },

  // Get question papers for dropdown (simplified list)
  getQuestionPapersForDropdown: async (params: { qp_code_id?: number } = {}) => {
    return await apiClient.get('/question-papers/dropdown', { params });
  },

  // Get questions by QP Code
  getQuestionsByQPCode: async (qpCodeId: string, params: { page?: number; limit?: number; search?: string; type?: string; difficulty?: string } = {}) => {
    try {
      const response = await apiClient.get(`/question-papers/qp-code/${qpCodeId}/questions`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get questions for a specific question paper (only questions linked to that paper)
  getQuestionPaperQuestions: async (paperId: string, params: { page?: number; limit?: number } = {}) => {
    try {
      const response = await apiClient.get(`/question-papers/${paperId}/questions`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get all questions (for Question Bank)
  getAllQuestions: async (params: { page?: number; limit?: number; search?: string; type?: string; difficulty?: string; qp_code_id?: string } = {}) => {
    const response = await apiClient.get('/question-papers/questions/all', { params });
    return response;
  },

  // Import questions from CSV
  importQuestionsFromCSV: async (paperId: string, questions: any[]) => {
    return await apiClient.post(`/question-papers/${paperId}/import-csv`, { questions });
  },

  // Get QP Code usage history
  getQPCodeUsageHistory: async (qpCodeId: string, params: { page?: number; limit?: number } = {}) => {
    return await apiClient.get(`/question-papers/qp-code/${qpCodeId}/history`, { params });
  }
};
