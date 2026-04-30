import { Task } from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, forbidden, notFound } from '../utils/ApiError.js';

function isProjectParticipant(project, userId) {
  if (String(project.owner) === String(userId)) return true;
  return project.members.some((m) => String(m.user) === String(userId));
}

export const listTasks = asyncHandler(async (req, res) => {
  const { status, assignee, overdue } = req.query;
  const filter = { project: req.project._id };
  if (status) filter.status = status;
  if (assignee) filter.assignee = assignee;
  if (overdue === 'true') {
    filter.dueDate = { $lt: new Date() };
    filter.status = filter.status || { $ne: 'done' };
  }

  const tasks = await Task.find(filter)
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.json({ tasks });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, project: req.project._id })
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email');
  if (!task) throw notFound('Task not found');
  res.json({ task });
});

export const createTask = asyncHandler(async (req, res) => {
  const payload = req.body;

  if (payload.assignee && !isProjectParticipant(req.project, payload.assignee)) {
    throw badRequest('Assignee must be a member of this project');
  }

  const task = await Task.create({
    ...payload,
    project: req.project._id,
    createdBy: req.user.id,
  });

  const populated = await task.populate([
    { path: 'assignee', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
  ]);

  res.status(201).json({ task: populated });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, project: req.project._id });
  if (!task) throw notFound('Task not found');

  const isAdmin = req.user.role === 'admin';
  const isOwnerOfProject = req.projectRole === 'owner';
  const isAssignee = String(task.assignee || '') === req.user.id;
  const isCreator = String(task.createdBy) === req.user.id;

  const fullAccess = isAdmin || isOwnerOfProject || isCreator;
  const statusOnlyAllowed = isAssignee;

  const bodyKeys = Object.keys(req.body);
  const isStatusOnly = bodyKeys.length === 1 && bodyKeys[0] === 'status';

  if (!fullAccess && !(statusOnlyAllowed && isStatusOnly)) {
    throw forbidden(
      'You may only change status of your own assigned task, unless you are the creator, project owner, or admin'
    );
  }

  if (
    req.body.assignee &&
    !isProjectParticipant(req.project, req.body.assignee)
  ) {
    throw badRequest('Assignee must be a member of this project');
  }

  Object.assign(task, req.body);
  await task.save();

  const populated = await task.populate([
    { path: 'assignee', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
  ]);

  res.json({ task: populated });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, project: req.project._id });
  if (!task) throw notFound('Task not found');

  const isAdmin = req.user.role === 'admin';
  const isOwnerOfProject = req.projectRole === 'owner';
  const isCreator = String(task.createdBy) === req.user.id;

  if (!isAdmin && !isOwnerOfProject && !isCreator) {
    throw forbidden('Only task creator, project owner, or admin may delete a task');
  }

  await task.deleteOne();
  res.json({ ok: true });
});
