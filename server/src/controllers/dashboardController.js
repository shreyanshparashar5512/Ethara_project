import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';

  const projectFilter = isAdmin
    ? {}
    : { $or: [{ owner: req.user.id }, { 'members.user': req.user.id }] };

  const visibleProjects = await Project.find(projectFilter).select('_id name').lean();
  const projectIds = visibleProjects.map((p) => p._id);

  const baseTaskFilter = { project: { $in: projectIds } };

  const now = new Date();

  const [statusAgg, assignedToMe, createdByMe, overdueTasks, recentTasks] =
    await Promise.all([
      Task.aggregate([
        { $match: baseTaskFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({ ...baseTaskFilter, assignee: req.user.id }),
      Task.countDocuments({ ...baseTaskFilter, createdBy: req.user.id }),
      Task.find({
        ...baseTaskFilter,
        dueDate: { $lt: now },
        status: { $ne: 'done' },
      })
        .populate('assignee', 'name email')
        .populate('project', 'name')
        .sort({ dueDate: 1 })
        .limit(20),
      Task.find(baseTaskFilter)
        .populate('assignee', 'name email')
        .populate('project', 'name')
        .sort({ updatedAt: -1 })
        .limit(10),
    ]);

  const statusCounts = { todo: 0, in_progress: 0, done: 0 };
  for (const row of statusAgg) statusCounts[row._id] = row.count;

  const totalTasks =
    statusCounts.todo + statusCounts.in_progress + statusCounts.done;

  res.json({
    totals: {
      projects: projectIds.length,
      tasks: totalTasks,
      overdue: overdueTasks.length,
      assignedToMe,
      createdByMe,
    },
    statusCounts,
    overdueTasks,
    recentTasks,
    projects: visibleProjects,
  });
});
