import { Project } from '../models/Project.js';
import { forbidden, notFound } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const loadProject = asyncHandler(async (req, _res, next) => {
  const projectId = req.params.projectId || req.params.id;
  const project = await Project.findById(projectId);
  if (!project) throw notFound('Project not found');

  req.project = project;
  req.projectRole = project.getUserRole(req.user.id);
  next();
});

export function requireProjectAccess() {
  return (req, _res, next) => {
    if (req.user.role === 'admin') return next();
    if (req.projectRole) return next();
    return next(forbidden('You do not have access to this project'));
  };
}

export function requireProjectRole(...allowed) {
  return (req, _res, next) => {
    if (req.user.role === 'admin') return next();
    if (req.projectRole && allowed.includes(req.projectRole)) return next();
    return next(
      forbidden(`Requires project role: ${allowed.join(' or ')} (or global admin)`)
    );
  };
}
