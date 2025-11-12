import express from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  createQuestionPaper,
  getQuestionPapers,
  getQuestionPaper,
  getQuestionPaperQuestions,
  updateQuestionPaper,
  deleteQuestionPaper,
  addQuestionsToPaper,
  removeQuestionFromPaper,
  getQuestionPapersForDropdown,
  getQuestionsByQPCode,
  getAllQuestions,
  importQuestionsFromCSV,
  getQPCodeUsageHistory
} from '../controllers/questionPaperController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Question Paper CRUD operations
router.post('/', authorize('ADMIN', 'TEACHER'), createQuestionPaper);
router.get('/', getQuestionPapers);
router.get('/dropdown', getQuestionPapersForDropdown);
router.get('/:id', getQuestionPaper);
router.put('/:id', authorize('ADMIN', 'TEACHER'), updateQuestionPaper);
router.delete('/:id', authorize('ADMIN', 'TEACHER'), deleteQuestionPaper);

// Question management within papers
router.post('/:id/questions', authorize('ADMIN', 'TEACHER'), addQuestionsToPaper);
router.get('/:id/questions', getQuestionPaperQuestions); // Get questions for a specific question paper
router.delete('/:id/questions/:qid', authorize('ADMIN', 'TEACHER'), removeQuestionFromPaper);

// QP Code based operations
router.get('/qp-code/:qp_code_id/questions', getQuestionsByQPCode);
router.get('/questions/all', getAllQuestions);
router.post('/:id/import-csv', authorize('ADMIN', 'TEACHER'), importQuestionsFromCSV);

// QP Code usage history
router.get('/qp-code/:qp_code_id/history', getQPCodeUsageHistory);

export default router;
