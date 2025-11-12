import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { body } from 'express-validator';
import {
  createTest,
  getTests,
  updateTest,
  deleteTest,
  addQuestionToTest,
  addQuestionsToTest,
  getTestReport,
  getStudentTestReport,
  toggleTestStatus,
  publishTest,
  archiveTest,
  draftTest,
  startTest,
  completeTest,
  getTestAttempts,
  getCourses,
  getSubjectsByCourse,
  getBatchesByCourse,
  getQuestionBankByQPCode,
  getQuestionBankBySubject,
  getQuestionBankByCourse,
  getAvailableTestsForStudent,
  getStudentTestHistory,
  startTestAttempt,
  submitTestAnswer,
  completeTestAttempt,
  getTestAttemptAnalysis,
  getSavedAnswers,
  autoSaveTestProgress,
  getTestTimeStatus,
  debugTests,
  getTestDetails,
  getStudentTestDetails,
  toggleLeaderboard,
  getTestLeaderboard,
  getEnhancedTestLeaderboard,
  getAllTestReports,
  getTestStudents,
  publishTestResults,
  getTestQuestions
} from '../controllers/testController';

const router = Router();

/**
 * @swagger
 * /tests:
 *   post:
 *     tags: [Tests]
 *     summary: Create a new test
 *     description: Create a new test with questions, duration, and settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type, questions, duration, maxMarks]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Mathematics Mock Test"
 *               type:
 *                 type: string
 *                 enum: [Mock Test, Daily Test, Weekly Test, Monthly Test]
 *                 example: "Mock Test"
 *               questions:
 *                 type: number
 *                 example: 50
 *               duration:
 *                 type: number
 *                 example: 120
 *               maxMarks:
 *                 type: number
 *                 example: 100
 *               courseId:
 *                 type: string
 *                 example: "course-123"
 *               subjectId:
 *                 type: string
 *                 example: "subject-123"
 *               batchId:
 *                 type: string
 *                 example: "batch-123"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T12:00:00Z"
 *               instructions:
 *                 type: string
 *                 example: "Read all questions carefully before answering"
 *     responses:
 *       201:
 *         description: Test created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request - validation error
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
router.post('/',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  [
    body('title').notEmpty().withMessage('Test title is required'),
    body('type').isIn(['Mock Test', 'Daily Test', 'Weekly Test', 'Monthly Test']).withMessage('Valid test type is required'),
    body('questions').isNumeric().withMessage('Valid number of questions is required'),
    body('duration').isNumeric().withMessage('Valid duration is required'),
    body('maxMarks').isNumeric().withMessage('Valid max marks is required')
  ],
  validateRequest,
  createTest
);

/**
 * @swagger
 * /tests:
 *   get:
 *     tags: [Tests]
 *     summary: Get all tests
 *     description: Retrieve a list of all tests with optional filtering
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
 *         description: Number of tests per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Mock Test, Daily Test, Weekly Test, Monthly Test, Practice Test]
 *         description: Filter by test type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Draft, Archived]
 *         description: Filter by test status
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course ID
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *         description: Filter by subject ID
 *     responses:
 *       200:
 *         description: Tests retrieved successfully
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
 *                     $ref: '#/components/schemas/Test'
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
 *                       example: 50
 *                     pages:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticate, authorize('ADMIN', 'TEACHER'), getTests);

/**
 * @swagger
 * /tests/{testId}:
 *   get:
 *     tags: [Tests]
 *     summary: Get test by ID
 *     description: Retrieve a specific test by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Test'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:testId', authenticate, authorize('ADMIN', 'TEACHER'), getTests);

/**
 * @swagger
 * /tests/{testId}:
 *   put:
 *     tags: [Tests]
 *     summary: Update test
 *     description: Update test information and settings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Mathematics Mock Test"
 *               type:
 *                 type: string
 *                 enum: [Mock Test, Daily Test, Weekly Test, Monthly Test]
 *                 example: "Mock Test"
 *               questions:
 *                 type: number
 *                 example: 50
 *               duration:
 *                 type: number
 *                 example: 120
 *               maxMarks:
 *                 type: number
 *                 example: 100
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T12:00:00Z"
 *               instructions:
 *                 type: string
 *                 example: "Updated instructions"
 *     responses:
 *       200:
 *         description: Test updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:testId',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  [
    body('title').notEmpty().withMessage('Test title is required'),
    body('type').isIn(['Mock Test', 'Daily Test', 'Weekly Test', 'Monthly Test']).withMessage('Valid test type is required'),
    body('questions').isNumeric().withMessage('Valid number of questions is required'),
    body('duration').isNumeric().withMessage('Valid duration is required'),
    body('maxMarks').isNumeric().withMessage('Valid max marks is required')
  ],
  validateRequest,
  updateTest
);

/**
 * @swagger
 * /tests/{testId}:
 *   delete:
 *     tags: [Tests]
 *     summary: Delete test
 *     description: Delete a test permanently
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:testId', authenticate, authorize('ADMIN', 'TEACHER'), deleteTest);

/**
 * @swagger
 * /tests/{testId}/questions:
 *   post:
 *     tags: [Tests]
 *     summary: Add question to test
 *     description: Add a single question to a test
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionId]
 *             properties:
 *               questionId:
 *                 type: string
 *                 example: "question-123"
 *     responses:
 *       200:
 *         description: Question added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/:testId/questions',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  addQuestionToTest
);

/**
 * @swagger
 * /tests/{testId}/questions/bulk:
 *   post:
 *     tags: [Tests]
 *     summary: Add multiple questions to test
 *     description: Add multiple questions to a test in bulk
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionIds]
 *             properties:
 *               questionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["question-1", "question-2", "question-3"]
 *     responses:
 *       200:
 *         description: Questions added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/:testId/questions/bulk',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  [
    body('questionIds').isArray().withMessage('Question IDs must be an array')
  ],
  validateRequest,
  addQuestionsToTest
);

/**
 * @swagger
 * /tests/{testId}/questions:
 *   get:
 *     tags: [Tests]
 *     summary: Get test questions
 *     description: Retrieve all questions for a specific test with export options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *       - in: query
 *         name: includeAnswers
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include correct answers and explanations
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, pdf]
 *           default: json
 *         description: Export format
 *     responses:
 *       200:
 *         description: Test questions retrieved successfully
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
 *                     testId:
 *                       type: string
 *                       example: "test-123"
 *                     testTitle:
 *                       type: string
 *                       example: "Mathematics Mock Test"
 *                     totalQuestions:
 *                       type: number
 *                       example: 50
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionNumber:
 *                             type: number
 *                             example: 1
 *                           questionText:
 *                             type: string
 *                             example: "What is 2 + 2?"
 *                           type:
 *                             type: string
 *                             example: "MCQ"
 *                           options:
 *                             type: object
 *                             example: {"A": "3", "B": "4", "C": "5", "D": "6"}
 *                           correctAnswer:
 *                             type: string
 *                             example: "B"
 *                           explanation:
 *                             type: string
 *                             example: "2 + 2 = 4"
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:testId/questions', authenticate, authorize('ADMIN', 'TEACHER'), getTestQuestions);

/**
 * @swagger
 * /tests/reports:
 *   get:
 *     tags: [Tests]
 *     summary: Get all test reports
 *     description: Retrieve comprehensive reports for all tests
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
 *         description: Number of reports per page
 *     responses:
 *       200:
 *         description: Test reports retrieved successfully
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
 *                       testId:
 *                         type: string
 *                         example: "test-123"
 *                       title:
 *                         type: string
 *                         example: "Mathematics Mock Test"
 *                       totalStudents:
 *                         type: number
 *                         example: 25
 *                       completedAttempts:
 *                         type: number
 *                         example: 20
 *                       averageScore:
 *                         type: number
 *                         example: 85.5
 *                       highestScore:
 *                         type: number
 *                         example: 98
 *                       lowestScore:
 *                         type: number
 *                         example: 45
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/reports', authenticate, authorize('ADMIN', 'TEACHER'), getAllTestReports);

/**
 * @swagger
 * /tests/{testId}/report:
 *   get:
 *     tags: [Tests]
 *     summary: Get test report
 *     description: Retrieve detailed report for a specific test
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test report retrieved successfully
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
 *                     test:
 *                       $ref: '#/components/schemas/Test'
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalStudents:
 *                           type: number
 *                           example: 25
 *                         completedAttempts:
 *                           type: number
 *                           example: 20
 *                         averageScore:
 *                           type: number
 *                           example: 85.5
 *                         highestScore:
 *                           type: number
 *                           example: 98
 *                         lowestScore:
 *                           type: number
 *                           example: 45
 *                         passRate:
 *                           type: number
 *                           example: 80.0
 *                     attempts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TestAttempt'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:testId/report', authenticate, authorize('ADMIN', 'TEACHER'), getTestReport);

/**
 * @swagger
 * /tests/{testId}/students:
 *   get:
 *     tags: [Tests]
 *     summary: Get test students
 *     description: Retrieve list of students assigned to a test
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test students retrieved successfully
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
 *                     $ref: '#/components/schemas/Student'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:testId/students', authenticate, authorize('ADMIN', 'TEACHER'), getTestStudents);

/**
 * @swagger
 * /tests/{testId}/students/{studentId}/report:
 *   get:
 *     tags: [Tests]
 *     summary: Get student test report
 *     description: Retrieve detailed report for a specific student's test attempt
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student test report retrieved successfully
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
 *                     student:
 *                       $ref: '#/components/schemas/Student'
 *                     test:
 *                       $ref: '#/components/schemas/Test'
 *                     attempt:
 *                       $ref: '#/components/schemas/TestAttempt'
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
 *                             example: "Paris"
 *                           correctAnswer:
 *                             type: string
 *                             example: "Paris"
 *                           isCorrect:
 *                             type: boolean
 *                             example: true
 *                           timeSpent:
 *                             type: number
 *                             example: 45
 *       404:
 *         description: Test or student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:testId/students/:studentId/report', authenticate, authorize('ADMIN', 'TEACHER'), getStudentTestReport);

/**
 * @swagger
 * /tests/{testId}/attempts:
 *   get:
 *     tags: [Tests]
 *     summary: Get test attempts
 *     description: Retrieve all attempts for a specific test
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test attempts retrieved successfully
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
 *                     $ref: '#/components/schemas/TestAttempt'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:testId/attempts', authenticate, authorize('ADMIN', 'TEACHER'), getTestAttempts);

/**
 * @swagger
 * /tests/{testId}/status:
 *   patch:
 *     tags: [Tests]
 *     summary: Toggle test status
 *     description: Change the status of a test (Active/Draft)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Active, Draft]
 *                 example: "Active"
 *     responses:
 *       200:
 *         description: Test status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request - invalid status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:testId/status',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  [
    body('status').isIn(['Active', 'Draft']).withMessage('Status must be Active or Draft')
  ],
  validateRequest,
  toggleTestStatus
);

/**
 * @swagger
 * /tests/courses:
 *   get:
 *     tags: [Tests]
 *     summary: Get courses for test creation
 *     description: Retrieve all courses available for test creation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
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
 *                     $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/courses', authenticate, authorize('ADMIN', 'TEACHER'), getCourses);

/**
 * @swagger
 * /tests/courses/{courseId}/subjects:
 *   get:
 *     tags: [Tests]
 *     summary: Get subjects by course
 *     description: Retrieve all subjects for a specific course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Subjects retrieved successfully
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
 *                     $ref: '#/components/schemas/Subject'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/courses/:courseId/subjects', authenticate, authorize('ADMIN', 'TEACHER'), getSubjectsByCourse);

/**
 * @swagger
 * /tests/courses/{courseId}/batches:
 *   get:
 *     tags: [Tests]
 *     summary: Get batches by course
 *     description: Retrieve all batches for a specific course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Batches retrieved successfully
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
 *                     $ref: '#/components/schemas/Batch'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/courses/:courseId/batches', authenticate, authorize('ADMIN', 'TEACHER'), getBatchesByCourse);

/**
 * @swagger
 * /tests/questions/subject/{subjectId}:
 *   get:
 *     tags: [Tests]
 *     summary: Get questions by subject
 *     description: Retrieve all questions for a specific subject
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
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
 *       404:
 *         description: Subject not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/questions/qp-code/:qpCodeId', authenticate, authorize('ADMIN', 'TEACHER'), getQuestionBankByQPCode);
router.get('/questions/subject/:subjectId', authenticate, authorize('ADMIN', 'TEACHER'), getQuestionBankBySubject);

/**
 * @swagger
 * /tests/questions/course/{courseId}:
 *   get:
 *     tags: [Tests]
 *     summary: Get questions by course
 *     description: Retrieve all questions for all subjects in a course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
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
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/questions/course/:courseId', authenticate, authorize('ADMIN', 'TEACHER'), getQuestionBankByCourse);

/**
 * @swagger
 * /tests/debug:
 *   get:
 *     tags: [Tests]
 *     summary: Debug tests (Admin only)
 *     description: Debug endpoint for test management (remove in production)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Debug information retrieved successfully
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
 *                     tests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Test'
 *                     attempts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TestAttempt'
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/debug', authenticate, authorize('ADMIN'), debugTests);

/**
 * @swagger
 * /tests/{testId}/publish:
 *   patch:
 *     tags: [Tests]
 *     summary: Publish test
 *     description: Publish a test to make it available to students
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test published successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:testId/publish', authenticate, authorize('ADMIN', 'TEACHER'), publishTest);

/**
 * @swagger
 * /tests/{testId}/archive:
 *   patch:
 *     tags: [Tests]
 *     summary: Archive test
 *     description: Archive a test to hide it from students
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:testId/archive', authenticate, authorize('ADMIN', 'TEACHER'), archiveTest);

/**
 * @swagger
 * /tests/{testId}/draft:
 *   patch:
 *     tags: [Tests]
 *     summary: Save test as draft
 *     description: Save a test as draft for later editing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test saved as draft successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:testId/draft', authenticate, authorize('ADMIN', 'TEACHER'), draftTest);

/**
 * @swagger
 * /tests/{testId}/start:
 *   patch:
 *     tags: [Tests]
 *     summary: Start test
 *     description: Start a test to make it active for students
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:testId/start', authenticate, authorize('ADMIN', 'TEACHER'), startTest);

/**
 * @swagger
 * /tests/{testId}/complete:
 *   patch:
 *     tags: [Tests]
 *     summary: Complete test
 *     description: Mark a test as completed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:testId/complete', authenticate, authorize('ADMIN', 'TEACHER'), completeTest);

/**
 * @swagger
 * /tests/{testId}/publish-results:
 *   patch:
 *     tags: [Tests]
 *     summary: Publish test results
 *     description: Publish results for a completed test to make them visible to students
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test results published successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:testId/publish-results', authenticate, authorize('ADMIN', 'TEACHER'), publishTestResults);

/**
 * @swagger
 * /tests/{testId}/details:
 *   get:
 *     tags: [Tests]
 *     summary: Get detailed test info
 *     description: Retrieve detailed information about a test including questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test details retrieved successfully
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
 *                     test:
 *                       $ref: '#/components/schemas/Test'
 *                     questions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Question'
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalQuestions:
 *                           type: number
 *                           example: 50
 *                         totalAttempts:
 *                           type: number
 *                           example: 25
 *                         averageScore:
 *                           type: number
 *                           example: 85.5
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:testId/details', authenticate, authorize('ADMIN', 'TEACHER'), getTestDetails);

/**
 * @swagger
 * /tests/{testId}/student-details:
 *   get:
 *     tags: [Tests]
 *     summary: Get student test details
 *     description: Retrieve test details for a student (without answers)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Student test details retrieved successfully
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
 *                     test:
 *                       $ref: '#/components/schemas/Test'
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
 *                             example: "What is the capital of France?"
 *                           type:
 *                             type: string
 *                             example: "MCQ"
 *                           options:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["London", "Paris", "Berlin", "Madrid"]
 *                           topic:
 *                             type: string
 *                             example: "Geography"
 *                           difficulty:
 *                             type: string
 *                             example: "MEDIUM"
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:testId/student-details', authenticate, authorize('STUDENT'), getStudentTestDetails);

/**
 * @swagger
 * /tests/student/available:
 *   get:
 *     tags: [Tests]
 *     summary: Get available tests for student
 *     description: Retrieve all tests available to the current student
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
 *         description: Number of tests per page
 *     responses:
 *       200:
 *         description: Available tests retrieved successfully
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
 *                     $ref: '#/components/schemas/Test'
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
router.get('/student/available', authenticate, authorize('STUDENT'), getAvailableTestsForStudent);

/**
 * @swagger
 * /tests/student/history:
 *   get:
 *     tags: [Tests]
 *     summary: Get student test history
 *     description: Retrieve test history for the current student
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
 *         description: Number of tests per page
 *     responses:
 *       200:
 *         description: Test history retrieved successfully
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
 *                       test:
 *                         $ref: '#/components/schemas/Test'
 *                       attempt:
 *                         $ref: '#/components/schemas/TestAttempt'
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/student/history', authenticate, authorize('STUDENT'), getStudentTestHistory);

/**
 * @swagger
 * /tests/{testId}/start:
 *   post:
 *     tags: [Tests]
 *     summary: Start test attempt
 *     description: Start a new test attempt for a student
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test attempt started successfully
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
 *                     attemptId:
 *                       type: string
 *                       example: "attempt-123"
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                     duration:
 *                       type: number
 *                       example: 7200
 *       400:
 *         description: Test not available or already attempted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:testId/start', authenticate, authorize('STUDENT'), startTestAttempt);

/**
 * @swagger
 * /tests/attempt/{attemptId}/answer:
 *   post:
 *     tags: [Tests]
 *     summary: Submit test answer
 *     description: Submit an answer for a specific question in a test attempt
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test attempt ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionId, answer]
 *             properties:
 *               questionId:
 *                 type: string
 *                 example: "question-123"
 *               answer:
 *                 type: string
 *                 example: "Paris"
 *               timeSpent:
 *                 type: number
 *                 example: 45
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid attempt or test completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Attempt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/attempt/:attemptId/answer', authenticate, authorize('STUDENT'), submitTestAnswer);

/**
 * @swagger
 * /tests/attempt/{attemptId}/complete:
 *   post:
 *     tags: [Tests]
 *     summary: Complete test attempt
 *     description: Complete a test attempt and calculate final score
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test attempt ID
 *     responses:
 *       200:
 *         description: Test attempt completed successfully
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
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Attempt already completed or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Attempt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/attempt/:attemptId/complete', authenticate, authorize('STUDENT'), completeTestAttempt);

/**
 * @swagger
 * /tests/attempt/{attemptId}/auto-save:
 *   post:
 *     tags: [Tests]
 *     summary: Auto-save test progress
 *     description: Auto-save test progress without completing the attempt
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test attempt ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 example:
 *                   "question-1": "Paris"
 *                   "question-2": "London"
 *     responses:
 *       200:
 *         description: Progress auto-saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Attempt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/attempt/:attemptId/auto-save', authenticate, authorize('STUDENT'), autoSaveTestProgress);

/**
 * @swagger
 * /tests/attempt/{attemptId}/time-status:
 *   get:
 *     tags: [Tests]
 *     summary: Get test time status
 *     description: Get remaining time and status for a test attempt
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test attempt ID
 *     responses:
 *       200:
 *         description: Time status retrieved successfully
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
 *                     remainingTime:
 *                       type: number
 *                       example: 1800
 *                     elapsedTime:
 *                       type: number
 *                       example: 5400
 *                     totalTime:
 *                       type: number
 *                       example: 7200
 *                     isExpired:
 *                       type: boolean
 *                       example: false
 *       404:
 *         description: Attempt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/attempt/:attemptId/time-status', authenticate, authorize('STUDENT'), getTestTimeStatus);

/**
 * @swagger
 * /tests/attempt/{attemptId}/analysis:
 *   get:
 *     tags: [Tests]
 *     summary: Get test attempt analysis
 *     description: Get detailed analysis of a completed test attempt
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test attempt ID
 *     responses:
 *       200:
 *         description: Test analysis retrieved successfully
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
 *                       example: 42
 *                     totalQuestions:
 *                       type: number
 *                       example: 50
 *                     timeSpent:
 *                       type: number
 *                       example: 5400
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
 *                             example: "Paris"
 *                           correctAnswer:
 *                             type: string
 *                             example: "Paris"
 *                           isCorrect:
 *                             type: boolean
 *                             example: true
 *                           timeSpent:
 *                             type: number
 *                             example: 45
 *       404:
 *         description: Attempt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/attempt/:attemptId/analysis', authenticate, authorize('STUDENT'), getTestAttemptAnalysis);

/**
 * @swagger
 * /tests/attempt/{attemptId}/saved-answers:
 *   get:
 *     tags: [Tests]
 *     summary: Get saved answers for incomplete attempt
 *     description: Retrieve saved answers for resuming an incomplete test attempt
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attempt ID
 *     responses:
 *       200:
 *         description: Saved answers retrieved successfully
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
 *                     attempt_id:
 *                       type: number
 *                       example: 123
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                     saved_answers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           question_id:
 *                             type: number
 *                           answer_text:
 *                             type: string
 *                           answered_at:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Incomplete attempt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/attempt/:attemptId/saved-answers', authenticate, authorize('STUDENT'), getSavedAnswers);

/**
 * @swagger
 * /tests/{testId}/leaderboard/toggle:
 *   patch:
 *     tags: [Tests]
 *     summary: Toggle leaderboard visibility
 *     description: Toggle the visibility of leaderboard for a test
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Leaderboard visibility toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:testId/leaderboard/toggle', authenticate, authorize('ADMIN', 'TEACHER'), toggleLeaderboard);

/**
 * @swagger
 * /tests/{testId}/leaderboard:
 *   get:
 *     tags: [Tests]
 *     summary: Get test leaderboard
 *     description: Retrieve leaderboard for a specific test
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top performers to return
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
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
 *                       rank:
 *                         type: number
 *                         example: 1
 *                       student:
 *                         $ref: '#/components/schemas/Student'
 *                       score:
 *                         type: number
 *                         example: 95
 *                       maxScore:
 *                         type: number
 *                         example: 100
 *                       percentage:
 *                         type: number
 *                         example: 95.0
 *                       timeSpent:
 *                         type: number
 *                         example: 5400
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:testId/leaderboard', authenticate, getTestLeaderboard);

/**
 * @swagger
 * /tests/{testId}/leaderboard/enhanced:
 *   get:
 *     tags: [Tests]
 *     summary: Get enhanced test leaderboard
 *     description: Retrieve enhanced leaderboard with detailed statistics (Admin/Teacher only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top performers to return
 *     responses:
 *       200:
 *         description: Enhanced leaderboard retrieved successfully
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
 *                     leaderboard:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: number
 *                             example: 1
 *                           student:
 *                             $ref: '#/components/schemas/Student'
 *                           score:
 *                             type: number
 *                             example: 95
 *                           maxScore:
 *                             type: number
 *                             example: 100
 *                           percentage:
 *                             type: number
 *                             example: 95.0
 *                           timeSpent:
 *                             type: number
 *                             example: 5400
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                           answers:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 questionId:
 *                                   type: string
 *                                   example: "question-123"
 *                                 isCorrect:
 *                                   type: boolean
 *                                   example: true
 *                                 timeSpent:
 *                                   type: number
 *                                   example: 45
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalParticipants:
 *                           type: number
 *                           example: 25
 *                         averageScore:
 *                           type: number
 *                           example: 85.5
 *                         highestScore:
 *                           type: number
 *                           example: 98
 *                         lowestScore:
 *                           type: number
 *                           example: 45
 *                         passRate:
 *                           type: number
 *                           example: 80.0
 *       404:
 *         description: Test not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Admin/Teacher access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:testId/leaderboard/enhanced', authenticate, authorize('ADMIN', 'TEACHER'), getEnhancedTestLeaderboard);

export default router;
