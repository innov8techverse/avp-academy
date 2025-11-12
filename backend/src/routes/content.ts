import express from 'express';
import {
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  getContentStream,
  uploadStudyMaterial,
  assignMaterialToBatches,
  getMaterialBatchAssignments,
  getBatchesForMaterialAssignment,
  upload
} from '../controllers/contentController';
import { authenticate, authorize } from '../middlewares/auth';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /content:
 *   post:
 *     tags: [Content]
 *     summary: Upload study material
 *     description: Upload a new study material with file attachment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, subjectId, file]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Mathematics Notes"
 *               description:
 *                 type: string
 *                 example: "Comprehensive notes on mathematics"
 *               subjectId:
 *                 type: string
 *                 example: "subject-123"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Study material file (PDF, DOC, etc.)
 *               isPublished:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Study material uploaded successfully
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
router.post('/', authenticate, authorize('ADMIN', 'TEACHER'), upload.single('file'), uploadStudyMaterial);

/**
 * @swagger
 * /content:
 *   get:
 *     tags: [Content]
 *     summary: Get all study materials
 *     description: Retrieve a list of all study materials
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
 *         description: Number of materials per page
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *         description: Filter by subject ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or description
 *       - in: query
 *         name: fileType
 *         schema:
 *           type: string
 *         description: Filter by file type
 *     responses:
 *       200:
 *         description: Study materials retrieved successfully
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
 *                     $ref: '#/components/schemas/StudyMaterial'
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
router.get('/', authenticate, getMaterials);

/**
 * @swagger
 * /content/debug/list:
 *   get:
 *     tags: [Content]
 *     summary: Debug materials list
 *     description: Debug endpoint to list all materials (for development)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Debug materials list retrieved successfully
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
 *                       material_id:
 *                         type: string
 *                         example: "material-123"
 *                       title:
 *                         type: string
 *                         example: "Mathematics Notes"
 *                       file_url:
 *                         type: string
 *                         example: "https://example.com/materials/notes.pdf"
 *                       file_type:
 *                         type: string
 *                         example: "pdf"
 *                       is_published:
 *                         type: boolean
 *                         example: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/debug/list', authenticate, async (_, res) => {
  try {
    const materials = await prisma.studyMaterial.findMany({
      select: {
        material_id: true,
        title: true,
        file_url: true,
        file_type: true,
        is_published: true
      }
    });
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching materials' });
  }
});

/**
 * @swagger
 * /content/view/{id}:
 *   get:
 *     tags: [Content]
 *     summary: View study material
 *     description: Stream study material content securely
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Material ID
 *     responses:
 *       200:
 *         description: Material content streamed successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Material not found
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
router.get('/view/:id', authenticate, authorize('STUDENT', 'ADMIN', 'TEACHER'), getContentStream);

/**
 * @swagger
 * /content/{id}:
 *   get:
 *     tags: [Content]
 *     summary: Get study material by ID
 *     description: Retrieve a specific study material by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Material ID
 *     responses:
 *       200:
 *         description: Study material retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudyMaterial'
 *       404:
 *         description: Material not found
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
router.get('/:id', authenticate, getMaterialById);

/**
 * @swagger
 * /content/{id}:
 *   put:
 *     tags: [Content]
 *     summary: Update study material
 *     description: Update study material information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Material ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Mathematics Notes"
 *               description:
 *                 type: string
 *                 example: "Updated comprehensive notes on mathematics"
 *               isPublished:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Study material updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Material not found
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
router.put('/:id', authenticate, authorize('ADMIN', 'TEACHER'), updateMaterial);

/**
 * @swagger
 * /content/{id}:
 *   delete:
 *     tags: [Content]
 *     summary: Delete study material
 *     description: Delete a study material permanently
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Material ID
 *     responses:
 *       200:
 *         description: Study material deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Material not found
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
router.delete('/:id', authenticate, authorize('ADMIN', 'TEACHER'), deleteMaterial);

/**
 * @swagger
 * /content/{materialId}/assign-batches:
 *   post:
 *     tags: [Content]
 *     summary: Assign material to batches
 *     description: Assign a study material to specific batches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *         description: Material ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [batchIds]
 *             properties:
 *               batchIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["batch-1", "batch-2", "batch-3"]
 *     responses:
 *       200:
 *         description: Material assigned to batches successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Material not found
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
router.post('/:materialId/assign-batches', authenticate, authorize('ADMIN', 'TEACHER'), assignMaterialToBatches);

/**
 * @swagger
 * /content/{materialId}/batch-assignments:
 *   get:
 *     tags: [Content]
 *     summary: Get material batch assignments
 *     description: Retrieve batch assignments for a specific material
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *         description: Material ID
 *     responses:
 *       200:
 *         description: Batch assignments retrieved successfully
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
 *         description: Material not found
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
router.get('/:materialId/batch-assignments', authenticate, getMaterialBatchAssignments);

/**
 * @swagger
 * /content/batches/for-assignment:
 *   get:
 *     tags: [Content]
 *     summary: Get batches for material assignment
 *     description: Retrieve all batches available for material assignment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Batches for assignment retrieved successfully
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/batches/for-assignment', authenticate, getBatchesForMaterialAssignment);

export default router;
