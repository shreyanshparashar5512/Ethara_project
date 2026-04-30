import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  loadProject,
  requireProjectAccess,
} from '../middleware/projectAccess.js';
import { validate } from '../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
} from '../validators/taskValidators.js';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';

const router = Router({ mergeParams: true });

router.use(requireAuth, loadProject, requireProjectAccess());

router.get('/', listTasks);
router.post('/', validate(createTaskSchema), createTask);
router.get('/:taskId', getTask);
router.patch('/:taskId', validate(updateTaskSchema), updateTask);
router.delete('/:taskId', deleteTask);

export default router;
