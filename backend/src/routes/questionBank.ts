
import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { body } from 'express-validator';
import {
  getQuestions,
  getQuestionsCount,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionById,
  bulkImportQuestions
} from '../controllers/questionBankController';

const router = Router();

/**
 * @swagger
 * /questionBank:
 *   get:
 *     summary: Get all questions from question bank
 *     description: Retrieve all questions from the question bank with optional filtering. Accessible by admin and teacher users.
 *     tags: [Question Bank]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of questions per page
 *       - in: query
 *         name: subject_id
 *         schema:
 *           type: string
 *         description: Filter by subject ID
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: Filter by topic
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [EASY, MEDIUM, HARD]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [MCQ, FILL_IN_THE_BLANK, TRUE_FALSE, MATCH, CHOICE_BASED]
 *         description: Filter by question type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in question text
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
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
 *                     $ref: '#/components/schemas/Question'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin or Teacher access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticate, authorize('ADMIN', 'TEACHER'), getQuestions);

/**
 * @swagger
 * /questionBank/count:
 *   get:
 *     summary: Get question count statistics
 *     description: Get total count of questions with optional filtering. Accessible by admin and teacher users.
 *     tags: [Question Bank]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subject_id
 *         schema:
 *           type: string
 *         description: Filter by subject ID
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: Filter by topic
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [EASY, MEDIUM, HARD]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [MCQ, FILL_IN_THE_BLANK, TRUE_FALSE, MATCH, CHOICE_BASED]
 *         description: Filter by question type
 *     responses:
 *       200:
 *         description: Question count retrieved successfully
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
 *                     total:
 *                       type: number
 *                       description: Total number of questions
 *                       example: 1250
 *                     byDifficulty:
 *                       type: object
 *                       properties:
 *                         EASY:
 *                           type: number
 *                           example: 500
 *                         MEDIUM:
 *                           type: number
 *                           example: 450
 *                         HARD:
 *                           type: number
 *                           example: 300
 *                     byType:
 *                       type: object
 *                       properties:
 *                         MCQ:
 *                           type: number
 *                           example: 800
 *                         FILL_IN_THE_BLANK:
 *                           type: number
 *                           example: 200
 *                         TRUE_FALSE:
 *                           type: number
 *                           example: 150
 *                         MATCH:
 *                           type: number
 *                           example: 50
 *                         CHOICE_BASED:
 *                           type: number
 *                           example: 50
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin or Teacher access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/count', authenticate, authorize('ADMIN', 'TEACHER'), getQuestionsCount);

/**
 * @swagger
 * /questionBank:
 *   post:
 *     summary: Create a new question
 *     description: Create a new question in the question bank. Accessible by admin and teacher users.
 *     tags: [Question Bank]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question_text
 *               - type
 *               - subject_id
 *               - topic
 *               - difficulty
 *               - correct_answer
 *             properties:
 *               question_text:
 *                 type: string
 *                 description: The question text
 *                 example: "What is the capital of France?"
 *               type:
 *                 type: string
 *                 enum: [MCQ, FILL_IN_THE_BLANK, TRUE_FALSE, MATCH, CHOICE_BASED]
 *                 description: Type of question
 *                 example: "MCQ"
 *               subject_id:
 *                 type: string
 *                 description: ID of the subject this question belongs to
 *                 example: "subj-123"
 *               topic:
 *                 type: string
 *                 description: Topic or chapter of the question
 *                 example: "Geography"
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *                 description: Difficulty level of the question
 *                 example: "EASY"
 *               correct_answer:
 *                 type: string
 *                 description: The correct answer to the question
 *                 example: "Paris"
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of options for MCQ questions
 *                 example: ["London", "Paris", "Berlin", "Madrid"]
 *               explanation:
 *                 type: string
 *                 description: Explanation for the correct answer
 *                 example: "Paris is the capital and largest city of France."
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tags for categorization
 *                 example: ["capital", "europe", "france"]
 *     responses:
 *       201:
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Question'
 *                 message:
 *                   type: string
 *                   example: "Question created successfully"
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin or Teacher access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  [
    body('question_text').notEmpty().withMessage('Question text is required'),
    body('type').isIn(['MCQ', 'FILL_IN_THE_BLANK', 'TRUE_FALSE', 'MATCH', 'CHOICE_BASED']).withMessage('Valid question type is required'),
    body('subject_id').notEmpty().withMessage('Subject is required'),
    body('topic').notEmpty().withMessage('Topic is required'),
    body('difficulty').isIn(['EASY', 'MEDIUM', 'HARD']).withMessage('Valid difficulty is required'),
    body('correct_answer').notEmpty().withMessage('Correct answer is required')
  ],
  validateRequest,
  createQuestion
);

/**
 * @swagger
 * /questionBank/{id}:
 *   get:
 *     summary: Get question by ID
 *     description: Retrieve a specific question by its ID. Accessible by admin and teacher users.
 *     tags: [Question Bank]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *         example: "q-123"
 *     responses:
 *       200:
 *         description: Question retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Question'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin or Teacher access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, authorize('ADMIN', 'TEACHER'), getQuestionById);

/**
 * @swagger
 * /questionBank/{id}:
 *   put:
 *     summary: Update a question
 *     description: Update an existing question in the question bank. Accessible by admin and teacher users.
 *     tags: [Question Bank]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *         example: "q-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question_text:
 *                 type: string
 *                 description: The question text
 *                 example: "What is the capital of France?"
 *               type:
 *                 type: string
 *                 enum: [MCQ, FILL_IN_THE_BLANK, TRUE_FALSE, MATCH, CHOICE_BASED]
 *                 description: Type of question
 *                 example: "MCQ"
 *               subject_id:
 *                 type: string
 *                 description: ID of the subject this question belongs to
 *                 example: "subj-123"
 *               topic:
 *                 type: string
 *                 description: Topic or chapter of the question
 *                 example: "Geography"
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *                 description: Difficulty level of the question
 *                 example: "EASY"
 *               correct_answer:
 *                 type: string
 *                 description: The correct answer to the question
 *                 example: "Paris"
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of options for MCQ questions
 *                 example: ["London", "Paris", "Berlin", "Madrid"]
 *               explanation:
 *                 type: string
 *                 description: Explanation for the correct answer
 *                 example: "Paris is the capital and largest city of France."
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tags for categorization
 *                 example: ["capital", "europe", "france"]
 *     responses:
 *       200:
 *         description: Question updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Question'
 *                 message:
 *                   type: string
 *                   example: "Question updated successfully"
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin or Teacher access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticate, authorize('ADMIN', 'TEACHER'), updateQuestion);

/**
 * @swagger
 * /questionBank/{id}:
 *   delete:
 *     summary: Delete a question
 *     description: Delete a specific question from the question bank. Accessible by admin and teacher users.
 *     tags: [Question Bank]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *         example: "q-123"
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Question deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin or Teacher access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticate, authorize('ADMIN', 'TEACHER'), deleteQuestion);

/**
 * @swagger
 * /questionBank/bulk-import:
 *   post:
 *     summary: Bulk import questions
 *     description: Import multiple questions at once from a JSON array. Accessible by admin and teacher users.
 *     tags: [Question Bank]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questions
 *             properties:
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - question_text
 *                     - type
 *                     - subject_id
 *                     - topic
 *                     - difficulty
 *                     - correct_answer
 *                   properties:
 *                     question_text:
 *                       type: string
 *                       description: The question text
 *                       example: "What is the capital of France?"
 *                     type:
 *                       type: string
 *                       enum: [MCQ, FILL_IN_THE_BLANK, TRUE_FALSE, MATCH, CHOICE_BASED]
 *                       description: Type of question
 *                       example: "MCQ"
 *                     subject_id:
 *                       type: string
 *                       description: ID of the subject this question belongs to
 *                       example: "subj-123"
 *                     topic:
 *                       type: string
 *                       description: Topic or chapter of the question
 *                       example: "Geography"
 *                     difficulty:
 *                       type: string
 *                       enum: [EASY, MEDIUM, HARD]
 *                       description: Difficulty level of the question
 *                       example: "EASY"
 *                     correct_answer:
 *                       type: string
 *                       description: The correct answer to the question
 *                       example: "Paris"
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Array of options for MCQ questions
 *                       example: ["London", "Paris", "Berlin", "Madrid"]
 *                     explanation:
 *                       type: string
 *                       description: Explanation for the correct answer
 *                       example: "Paris is the capital and largest city of France."
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Array of tags for categorization
 *                       example: ["capital", "europe", "france"]
 *                 description: Array of questions to import
 *                 example: [
 *                   {
 *                     "question_text": "What is the capital of France?",
 *                     "type": "MCQ",
 *                     "subject_id": "subj-123",
 *                     "topic": "Geography",
 *                     "difficulty": "EASY",
 *                     "correct_answer": "Paris",
 *                     "options": ["London", "Paris", "Berlin", "Madrid"],
 *                     "explanation": "Paris is the capital and largest city of France.",
 *                     "tags": ["capital", "europe", "france"]
 *                   }
 *                 ]
 *     responses:
 *       201:
 *         description: Questions imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Questions imported successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     imported:
 *                       type: number
 *                       description: Number of questions successfully imported
 *                       example: 50
 *                     failed:
 *                       type: number
 *                       description: Number of questions that failed to import
 *                       example: 2
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           index:
 *                             type: number
 *                             description: Index of the failed question
 *                           error:
 *                             type: string
 *                             description: Error message
 *                       description: Array of import errors
 *                       example: [
 *                         {
 *                           "index": 25,
 *                           "error": "Invalid question type"
 *                         }
 *                       ]
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin or Teacher access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/bulk-import',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  [
    body('questions').isArray().withMessage('Questions array is required')
  ],
  validateRequest,
  bulkImportQuestions
);

export default router;
