import express from 'express';
import { authenticate } from '../middlewares/auth';
import { 
  getQPCodes, 
  getQPCodeById, 
  createQPCode, 
  updateQPCode, 
  deleteQPCode 
} from '../controllers/qpCodeController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// QP Code routes
router.get('/', getQPCodes);
router.get('/:id', getQPCodeById);
router.post('/', createQPCode);
router.put('/:id', updateQPCode);
router.delete('/:id', deleteQPCode);

export default router;
