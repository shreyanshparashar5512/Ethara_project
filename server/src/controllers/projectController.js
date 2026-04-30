import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/ApiError.js';

export const listProjects = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === 'admin'
      ? {}
      : { $or: [{ owner: req.user.id }, { 'members.user': req.user.id }] };

  const projects = await Project.find(filter)
    .populate('owner', 'name email role')
    .populate('members.user', 'name email role')
    .sort({ updatedAt: -1 });

  res.json({ projects });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.project._id)
    .populate('owner', 'name email role')
    .populate('members.user', 'name email role');
  res.json({ project });
});

export const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const project = await Project.create({
    name,
    description,
    owner: req.user.id,
    members: [{ user: req.user.id, role: 'owner' }],
  });

  const populated = await project.populate([
    { path: 'owner', select: 'name email role' },
    { path: 'members.user', select: 'name email role' },
  ]);

  res.status(201).json({ project: populated });
});

export const updateProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (name !== undefined) req.project.name = name;
  if (description !== undefined) req.project.description = description;
  await req.project.save();

  const populated = await req.project.populate([
    { path: 'owner', select: 'name email role' },
    { path: 'members.user', select: 'name email role' },
  ]);

  res.json({ project: populated });
});

export const deleteProject = asyncHandler(async (req, res) => {
  await Task.deleteMany({ project: req.project._id });
  await req.project.deleteOne();
  res.json({ ok: true });
});

export const addMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;

  const user = await User.findById(userId);
  if (!user) throw notFound('User not found');

  if (req.project.members.some((m) => String(m.user) === String(userId))) {
    throw conflict('User is already a project member');
  }

  req.project.members.push({ user: userId, role });
  await req.project.save();

  const populated = await req.project.populate([
    { path: 'owner', select: 'name email role' },
    { path: 'members.user', select: 'name email role' },
  ]);

  res.status(201).json({ project: populated });
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (String(req.project.owner) === String(userId)) {
    throw badRequest('Cannot change role of project owner');
  }

  const member = req.project.members.find((m) => String(m.user) === String(userId));
  if (!member) throw notFound('Member not found');

  member.role = role;
  await req.project.save();

  const populated = await req.project.populate([
    { path: 'owner', select: 'name email role' },
    { path: 'members.user', select: 'name email role' },
  ]);

  res.json({ project: populated });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (String(req.project.owner) === String(userId)) {
    throw forbidden('Cannot remove project owner');
  }

  const before = req.project.members.length;
  req.project.members = req.project.members.filter(
    (m) => String(m.user) !== String(userId)
  );
  if (req.project.members.length === before) throw notFound('Member not found');

  await req.project.save();
  await Task.updateMany(
    { project: req.project._id, assignee: userId },
    { $set: { assignee: null } }
  );

  const populated = await req.project.populate([
    { path: 'owner', select: 'name email role' },
    { path: 'members.user', select: 'name email role' },
  ]);

  res.json({ project: populated });
});
