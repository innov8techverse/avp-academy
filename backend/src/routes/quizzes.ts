
import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import {
  getQuizzes,
  getQuizById,
  submitQuiz,
  getQuizAttempts,
  getQuizzesValidation,
  submitQuizValidation
} from '../controllers/quizController';

const router = Router();

/**
 * @swagger
 * /quizzes:
 *   get:
 *     tags: [Quizzes]
 *     summary: Get all quizzes
 *     description: Retrieve a list of all available quizzes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of quizzes per page
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *         description: Filter by subject ID
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [EASY, MEDIUM, HARD]
 *         description: Filter by difficulty level
 *     responses:
 *       200:
 *         description: Quizzes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "quiz-123"
 *                       title:
 *                         type: string
 *                         example: "Mathematics Quiz"
 *                       description:
 *                         type: string
 *                         example: "Test your mathematics knowledge"
 *                       subjectId:
 *                         type: string
 *                         example: "subject-123"
 *                       difficulty:
 *                         type: string
 *                         enum: [EASY, MEDIUM, HARD]
 *                         example: "MEDIUM"
 *                       totalQuestions:
 *                         type: number
 *                         example: 20
 *                       timeLimit:
 *                         type: number
 *                         example: 1800
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticate, getQuizzesValidation, validateRequest, getQuizzes);

/**
 * @swagger
 * /quizzes/attempts:
 *   get:
 *     tags: [Quizzes]
 *     summary: Get quiz attempts
 *     description: Retrieve quiz attempts for the current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of attempts per page
 *     responses:
 *       200:
 *         description: Quiz attempts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "attempt-123"
 *                       quizId:
 *                         type: string
 *                         example: "quiz-123"
 *                       quizTitle:
 *                         type: string
 *                         example: "Mathematics Quiz"
 *                       score:
 *                         type: number
 *                         example: 85
 *                       maxScore:
 *                         type: number
 *                         example: 100
 *                       percentage:
 *                         type: number
 *                         example: 85.0
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     pages:
 *                       type: integer
 *                       example: 2
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/attempts', authenticate, getQuizAttempts);

/**
 * @swagger
 * /quizzes/{id}:
 *   get:
 *     tags: [Quizzes]
 *     summary: Get quiz by ID
 *     description: Retrieve a specific quiz by ID with questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *     responses:
 *       200:
 *         description: Quiz retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "quiz-123"
 *                     title:
 *                       type: string
 *                       example: "Mathematics Quiz"
 *                     description:
 *                       type: string
 *                       example: "Test your mathematics knowledge"
 *                     subjectId:
 *                       type: string
 *                       example: "subject-123"
 *                     difficulty:
 *                       type: string
 *                       enum: [EASY, MEDIUM, HARD]
 *                       example: "MEDIUM"
 *                     totalQuestions:
 *                       type: number
 *                       example: 20
 *                     timeLimit:
 *                       type: number
 *                       example: 1800
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "question-123"
 *                           question_text:
 *                             type: string
 *                             example: "What is 2 + 2?"
 *                           type:
 *                             type: string
 *                             enum: [MCQ, FILL_IN_THE_BLANK, TRUE_FALSE]
 *                             example: "MCQ"
 *                           options:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["3", "4", "5", "6"]
 *                           topic:
 *                             type: string
 *                             example: "Basic Arithmetic"
 *                           difficulty:
 *                             type: string
 *                             enum: [EASY, MEDIUM, HARD]
 *                             example: "EASY"
 *       404:
 *         description: Quiz not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, getQuizById);

/**
 * @swagger
 * /quizzes/submit:
 *   post:
 *     tags: [Quizzes]
 *     summary: Submit quiz
 *     description: Submit a completed quiz and get results
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quizId, answers]
 *             properties:
 *               quizId:
 *                 type: string
 *                 example: "quiz-123"
 *               answers:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 example:
 *                   "question-1": "4"
 *                   "question-2": "Paris"
 *                   "question-3": "true"
 *               timeSpent:
 *                 type: number
 *                 example: 900
 *     responses:
 *       200:
 *         description: Quiz submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     score:
 *                       type: number
 *                       example: 85
 *                     maxScore:
 *                       type: number
 *                       example: 100
 *                     percentage:
 *                       type: number
 *                       example: 85.0
 *                     correctAnswers:
 *                       type: number
 *                       example: 17
 *                     totalQuestions:
 *                       type: number
 *                       example: 20
 *                     timeSpent:
 *                       type: number
 *                       example: 900
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                     answers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: string
 *                             example: "question-123"
 *                           studentAnswer:
 *                             type: string
 *                             example: "4"
 *                           correctAnswer:
 *                             type: string
 *                             example: "4"
 *                           isCorrect:
 *                             type: boolean
 *                             example: true
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Quiz not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/submit', authenticate, submitQuizValidation, validateRequest, submitQuiz);

export default router;
