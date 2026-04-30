import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  loadProject,
  requireProjectAccess,
  requireProjectRole,
} from '../middleware/projectAccess.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberRoleSchema,
} from '../validators/projectValidators.js';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
} from '../controllers/projectController.js';
import tasksRouter from './tasks.js';

const router = Router();

router.use(requireAuth);

router.get('/', listProjects);
router.post('/', validate(createProjectSchema), createProject);

router.get('/:id', loadProject, requireProjectAccess(), getProject);
router.patch(
  '/:id',
  validate(updateProjectSchema),
  loadProject,
  requireProjectRole('owner'),
  updateProject
);
router.delete('/:id', loadProject, requireProjectRole('owner'), deleteProject);

router.post(
  '/:id/members',
  validate(addMemberSchema),
  loadProject,
  requireProjectRole('owner'),
  addMember
);
router.patch(
  '/:id/members/:userId',
  validate(updateMemberRoleSchema),
  loadProject,
  requireProjectRole('owner'),
  updateMemberRole
);
router.delete(
  '/:id/members/:userId',
  loadProject,
  requireProjectRole('owner'),
  removeMember
);

router.use('/:projectId/tasks', tasksRouter);

export default router;
