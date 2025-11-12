import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  bulkDisableStudents,
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
  createBatch,
  getBatches,
  updateBatch,
  deleteBatch,
  updateBatchStudents,
  createStaff,
  getStaff,
  updateStaff,
  deleteStaff,
  getAdminSettings,
  getCourse,
  getAllSessions,
  deleteSession,
  deleteAllSessions
} from '../controllers/adminController';
import {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject
} from '../controllers/subjectController';

const router = Router();

// Apply authentication and authorization middleware to all routes
router.use(authenticate);
router.use(authorize('ADMIN'));

/**
 * @swagger
 * /admin/students:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new student
 *     description: Create a new student account with course and batch assignment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, courseId, batchId]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "student@example.com"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               courseId:
 *                 type: string
 *                 example: "course-123"
 *               batchId:
 *                 type: string
 *                 example: "batch-123"
 *     responses:
 *       201:
 *         description: Student created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/students', createStudent);

/**
 * @swagger
 * /admin/students:
 *   get:
 *     tags: [Admin]
 *     summary: Get all students
 *     description: Retrieve a list of all students with optional filtering
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
 *         description: Number of students per page
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course ID
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: string
 *         description: Filter by batch ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Students retrieved successfully
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
 */
router.get('/students', getStudents);

/**
 * @swagger
 * /admin/students/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update student
 *     description: Update student information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               courseId:
 *                 type: string
 *                 example: "course-123"
 *               batchId:
 *                 type: string
 *                 example: "batch-123"
 *     responses:
 *       200:
 *         description: Student updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/students/:id', updateStudent);

/**
 * @swagger
 * /admin/students/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete student
 *     description: Delete a student account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/students/:id', deleteStudent);

/**
 * @swagger
 * /admin/students/bulk-disable:
 *   post:
 *     tags: [Admin]
 *     summary: Bulk disable students
 *     description: Disable multiple students at once by providing an array of student IDs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_ids
 *             properties:
 *               student_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of student user IDs to disable
 *     responses:
 *       200:
 *         description: Students disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     disabled_count:
 *                       type: integer
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/students/bulk-disable', authenticate, authorize('ADMIN'), bulkDisableStudents);

/**
 * @swagger
 * /admin/courses:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new course
 *     description: Create a new course with details
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, duration, fee]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Computer Science"
 *               description:
 *                 type: string
 *                 example: "Comprehensive computer science course"
 *               duration:
 *                 type: number
 *                 example: 12
 *               fee:
 *                 type: number
 *                 example: 5000
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/courses', createCourse);

/**
 * @swagger
 * /admin/courses:
 *   get:
 *     tags: [Admin]
 *     summary: Get all courses
 *     description: Retrieve a list of all courses
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
 */
router.get('/courses', getCourses);

/**
 * @swagger
 * /admin/courses/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get course by ID
 *     description: Retrieve a specific course by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/courses/:id', getCourse);

/**
 * @swagger
 * /admin/courses/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update course
 *     description: Update course information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Computer Science"
 *               description:
 *                 type: string
 *                 example: "Updated computer science course"
 *               duration:
 *                 type: number
 *                 example: 12
 *               fee:
 *                 type: number
 *                 example: 5000
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/courses/:id', updateCourse);

/**
 * @swagger
 * /admin/courses/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete course
 *     description: Delete a course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/courses/:id', deleteCourse);

/**
 * @swagger
 * /admin/batches:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new batch
 *     description: Create a new batch for a course
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, courseId, startDate, endDate, capacity]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "CS-2024-Batch-1"
 *               courseId:
 *                 type: string
 *                 example: "course-123"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *               capacity:
 *                 type: number
 *                 example: 30
 *     responses:
 *       201:
 *         description: Batch created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/batches', createBatch);

/**
 * @swagger
 * /admin/batches:
 *   get:
 *     tags: [Admin]
 *     summary: Get all batches
 *     description: Retrieve a list of all batches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by course ID
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
 */
router.get('/batches', getBatches);

/**
 * @swagger
 * /admin/batches/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update batch
 *     description: Update batch information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Batch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "CS-2024-Batch-1"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *               capacity:
 *                 type: number
 *                 example: 30
 *     responses:
 *       200:
 *         description: Batch updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/batches/:id', updateBatch);

/**
 * @swagger
 * /admin/batches/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete batch
 *     description: Delete a batch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Batch ID
 *     responses:
 *       200:
 *         description: Batch deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/batches/:id', deleteBatch);

/**
 * @swagger
 * /admin/batches/{id}/students:
 *   put:
 *     tags: [Admin]
 *     summary: Update batch students
 *     description: Assign or remove students from a batch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Batch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentIds]
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["student-1", "student-2", "student-3"]
 *     responses:
 *       200:
 *         description: Batch students updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/batches/:id/students', updateBatchStudents);

/**
 * @swagger
 * /admin/staff:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new staff member
 *     description: Create a new staff account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "teacher@example.com"
 *               name:
 *                 type: string
 *                 example: "Jane Smith"
 *               role:
 *                 type: string
 *                 enum: [TEACHER, ADMIN]
 *                 example: "TEACHER"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       201:
 *         description: Staff member created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/staff', createStaff);

/**
 * @swagger
 * /admin/staff:
 *   get:
 *     tags: [Admin]
 *     summary: Get all staff members
 *     description: Retrieve a list of all staff members
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff members retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 */
router.get('/staff', getStaff);

/**
 * @swagger
 * /admin/staff/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update staff member
 *     description: Update staff member information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Smith"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               role:
 *                 type: string
 *                 enum: [TEACHER, ADMIN]
 *                 example: "TEACHER"
 *     responses:
 *       200:
 *         description: Staff member updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/staff/:id', updateStaff);

/**
 * @swagger
 * /admin/staff/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete staff member
 *     description: Delete a staff member account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff member ID
 *     responses:
 *       200:
 *         description: Staff member deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/staff/:id', deleteStaff);

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin settings
 *     description: Retrieve admin dashboard settings and statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
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
 *                     totalStudents:
 *                       type: number
 *                       example: 150
 *                     totalCourses:
 *                       type: number
 *                       example: 10
 *                     totalBatches:
 *                       type: number
 *                       example: 25
 *                     totalStaff:
 *                       type: number
 *                       example: 15
 */
router.get('/settings', getAdminSettings);

// Subject Management
/**
 * @swagger
 * /admin/subjects:
 *   get:
 *     tags: [Admin]
 *     summary: Get all subjects
 *     description: Retrieve a list of all subjects
 *     security:
 *       - bearerAuth: []
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
 */
router.get('/subjects', getSubjects);

/**
 * @swagger
 * /admin/subjects/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get subject by ID
 *     description: Retrieve a specific subject by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subject'
 */
router.get('/subjects/:id', getSubject);

/**
 * @swagger
 * /admin/subjects:
 *   post:
 *     tags: [Admin]
 *     summary: Create a new subject
 *     description: Create a new subject for a course
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, courseId]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Mathematics"
 *               description:
 *                 type: string
 *                 example: "Advanced mathematics concepts"
 *               courseId:
 *                 type: string
 *                 example: "course-123"
 *     responses:
 *       201:
 *         description: Subject created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post('/subjects', createSubject);

/**
 * @swagger
 * /admin/subjects/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update subject
 *     description: Update subject information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Mathematics"
 *               description:
 *                 type: string
 *                 example: "Updated mathematics concepts"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.put('/subjects/:id', updateSubject);

/**
 * @swagger
 * /admin/subjects/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete subject
 *     description: Delete a subject
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/subjects/:id', deleteSubject);

/**
 * @swagger
 * /admin/sessions:
 *   get:
 *     tags: [Admin]
 *     summary: Get all sessions
 *     description: Retrieve all user sessions with user information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get('/sessions', getAllSessions);

/**
 * @swagger
 * /admin/sessions/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a specific session
 *     description: Terminate a specific user session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/sessions/:id', deleteSession);

/**
 * @swagger
 * /admin/sessions:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete all sessions
 *     description: Terminate all user sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.delete('/sessions', deleteAllSessions);

export default router;
