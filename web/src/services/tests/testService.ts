import { apiClient } from '../api';

export interface Test {
  id: number;
  title: string;
  description?: string;
  type: 'Mock Test' | 'Daily Test' | 'Weekly Test' | 'Monthly Test';
  courseId: number;
  course: string;
  subjectId: number;
  subject: string;
  batchIds: number[];
  batches: string[];
  questions: number;
  duration: number;
  maxMarks: number;
  attempts: number;
  status: 'DRAFT' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  scheduledDate?: string;  // Legacy field
  startTime?: string;      // New scheduling fields
  endTime?: string;
  autoStart?: boolean;
  autoEnd?: boolean;
  gracePeriod?: number;
  // Additional display fields
  isScheduled?: boolean;
  timeRemaining?: string;
  canStart?: boolean;
  canComplete?: boolean;
  isCommon: boolean;
  settings: TestSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TestSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showImmediateResult: boolean;
  negativeMarks: boolean;
  negativeMarkValue: number | string;
  timeLimit: boolean;
  allowRevisit: boolean;
  showCorrectAnswers: boolean;
  allowPreviousNavigation: boolean;
  resultReleaseTime?: string | null;
  passPercentage: number | string;
}

export interface CreateTestData {
  title: string;
  description?: string;
  type: 'Mock Test' | 'Daily Test' | 'Weekly Test' | 'Monthly Test';
  courseId?: number;
  subjectId?: number;
  batchIds: number[];
  questions: number | string;
  duration: number | string;
  maxMarks: number | string;
  marksPerQuestion: number |string;
  scheduledDate?: string;  // Legacy field
  startTime?: string;      // New scheduling fields
  endTime?: string;
  autoStart?: boolean;
  autoEnd?: boolean;
  gracePeriod?: number;
  isCommon: boolean;
  questionSource: 'manual' | 'questionBank';
  selectedQuestions?: number[];
  manualQuestions?: string;
  settings: TestSettings;
}

export interface TestFilters {
  search?: string;
  course?: string;
  subject?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface Course {
  course_id: number;
  name: string;
  description?: string;
  // For compatibility with existing code
  id?: number;
}

export interface Subject {
  subject_id: number;
  name: string;
  description: string;
}

export interface Batch {
  batch_id: number;
  batch_name: string;
  course_id?: number;
  timing?: string;
  capacity?: number;
  description?: string;
  is_active?: boolean;
}

export interface QuestionBankItem {
  question_id: number;
  question_text: string;
  topic?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type?: string;
  marks?: number;
  question_paper_code?: string;
  qp_code_id?: number;
  qp_code?: {
    code: string;
    description?: string;
  };
  // For compatibility with existing code
  id?: number;
  question?: string;
  subject?: string;
  options?: Record<string, string>;
  correct_answer?: string;
  explanation?: string;
}

export interface TestAttempt {
  attempt_id: number;
  user_id: number;
  quiz_id: number;
  score: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unattempted: number;
  accuracy: number;
  time_taken: number;
  start_time: string;
  submit_time: string;
  is_completed: boolean;
  is_unattended: boolean;
  user: {
    user_id: number;
    full_name: string;
    email: string;
  };
}

export const testService = {
  // Get all tests with filters
  getTests: async (filters: TestFilters = {}) => {
    return await apiClient.get('/tests', { params: filters });
  },

  // Get test by ID
  getTestById: async (id: number) => {
    return await apiClient.get(`/tests/${id}`);
  },

  // Create new test
  createTest: async (data: CreateTestData) => {
    return await apiClient.post('/tests', data);
  },

  // Update test
  updateTest: async (id: number, data: Partial<CreateTestData>) => {
    return await apiClient.put(`/tests/${id}`, data);
  },

  // Delete test
  deleteTest: async (id: number) => {
    return await apiClient.delete(`/tests/${id}`);
  },

  // Toggle test status (legacy compatibility)
  toggleTestStatus: async (id: number, status: 'Active' | 'Draft' | 'Published' | 'Archived') => {
    return await apiClient.patch(`/tests/${id}/status`, { status });
  },

  // New status management methods
  publishTest: async (id: number) => {
    return await apiClient.patch(`/tests/${id}/publish`);
  },

  archiveTest: async (id: number) => {
    return await apiClient.patch(`/tests/${id}/archive`);
  },

  draftTest: async (id: number) => {
    return await apiClient.patch(`/tests/${id}/draft`);
  },

  // New status management methods
  startTest: async (id: number) => {
    return await apiClient.patch(`/tests/${id}/start`);
  },

  completeTest: async (id: number) => {
    return await apiClient.patch(`/tests/${id}/complete`);
  },

  // Publish test results
  publishTestResults: async (id: number) => {
    return await apiClient.patch(`/tests/${id}/publish-results`);
  },

  // Get courses
  getCourses: async () => {
    return await apiClient.get('/tests/courses');
  },

  // Get subjects by course
  getSubjectsByCourse: async (courseId: number) => {
    return await apiClient.get(`/tests/courses/${courseId}/subjects`);
  },

  // Get batches by course
  getBatchesByCourse: async (courseId: number) => {
    return await apiClient.get(`/tests/courses/${courseId}/batches`);
  },

  // Get question bank by subject
  getQuestionBank: async (subjectId: number) => {
    return await apiClient.get(`/tests/questions/subject/${subjectId}`);
  },

  // Get question bank by course
  getQuestionBankByCourse: async (courseId: number) => {
    return await apiClient.get(`/tests/questions/course/${courseId}`);
  },

  // Get question bank by QP Code
  getQuestionBankByQPCode: async (qpCodeId: number) => {
    return await apiClient.get(`/question-papers/qp-code/${qpCodeId}/questions`);
  },

  // Add questions to test
  addQuestionsToTest: async (testId: number, questionIds: number[]) => {
    return await apiClient.post(`/tests/${testId}/questions`, { questionIds });
  },

  // Get test report
  getTestReport: async (testId: number) => {
    return await apiClient.get(`/tests/${testId}/report`);
  },

  // Get student test report
  getStudentTestReport: async (testId: number, studentId: number) => {
    return await apiClient.get(`/tests/${testId}/students/${studentId}/report`);
  },

  // Get test attempts
  getTestAttempts: async (testId: number) => {
    return await apiClient.get(`/tests/${testId}/attempts`);
  },

  // Get detailed test info (admin)
  getTestDetails: async (id: number) => {
    return await apiClient.get(`/tests/${id}/details`);
  },
  // Get detailed test info (student)
  getStudentTestDetails: async (id: number) => {
    return await apiClient.get(`/tests/${id}/student-details`);
  },

  // Auto-save test progress
  autoSaveTestProgress: async (attemptId: number, answers: Array<{
    questionId: number;
    selectedOption: string;
    isCorrect: boolean;
    marksObtained: number;
  }>) => {
    return await apiClient.post(`/tests/attempt/${attemptId}/auto-save`, {
      attemptId,
      answers
    });
  },

  // Get test time status and warnings
  getTestTimeStatus: async (attemptId: number) => {
    return await apiClient.get(`/tests/attempt/${attemptId}/time-status`);
  },

  // Get test questions with export options
  getTestQuestions: async (testId: number, options?: { includeAnswers?: boolean; format?: 'json' | 'csv' | 'pdf' }) => {
    const params = new URLSearchParams();
    if (options?.includeAnswers !== undefined) {
      params.append('includeAnswers', options.includeAnswers.toString());
    }
    if (options?.format) {
      params.append('format', options.format);
    }
    
    const url = `/tests/${testId}/questions${params.toString() ? `?${params.toString()}` : ''}`;
    return await apiClient.get(url);
  }
};
