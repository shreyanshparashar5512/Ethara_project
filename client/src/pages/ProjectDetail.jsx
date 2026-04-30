import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import Modal from '../components/Modal.jsx';
import {
  StatusBadge,
  PriorityBadge,
  RoleBadge,
} from '../components/Badges.jsx';
import {
  formatDate,
  toDateInput,
  fromDateInput,
  isOverdue,
} from '../lib/date.js';

const STATUSES = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [taskModal, setTaskModal] = useState(null);
  const [memberModal, setMemberModal] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [{ project }, { tasks }] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
      ]);
      setProject(project);
      setTasks(tasks);
    } catch (err) {
      toast.error(err.message);
      if (err.status === 404 || err.status === 403) navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, toast, navigate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const myProjectRole = useMemo(() => {
    if (!project) return null;
    if (user.role === 'admin') return 'admin';
    if (String(project.owner?._id || project.owner) === user.id) return 'owner';
    const m = project.members?.find(
      (m) => String(m.user?._id || m.user) === user.id
    );
    return m?.role || null;
  }, [project, user]);

  const canManageProject = myProjectRole === 'owner' || myProjectRole === 'admin';

  const tasksByStatus = useMemo(() => {
    const grouped = { todo: [], in_progress: [], done: [] };
    for (const t of tasks) grouped[t.status]?.push(t);
    return grouped;
  }, [tasks]);

  const onStatusChange = async (task, newStatus) => {
    try {
      await api.patch(`/projects/${id}/tasks/${task._id}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onDeleteTask = async (task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      await api.delete(`/projects/${id}/tasks/${task._id}`);
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onDeleteProject = async () => {
    if (!confirm(`Delete project "${project.name}" and all its tasks?`)) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="text-slate-500">Loading…</div>;
  if (!project) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="text-sm text-brand-600 hover:underline">
          ← All projects
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            {myProjectRole && <RoleBadge role={myProjectRole} />}
          </div>
          {project.description && (
            <p className="text-slate-600 mt-2 max-w-3xl">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => setMemberModal(true)}>
            Members ({project.members.length})
          </button>
          <button className="btn-primary" onClick={() => setTaskModal({ mode: 'create' })}>
            + New task
          </button>
          {canManageProject && (
            <button className="btn-danger" onClick={onDeleteProject}>
              Delete project
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUSES.map((col) => (
          <div key={col.key} className="card p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-700">{col.label}</h2>
              <span className="badge bg-white border border-slate-200 text-slate-600">
                {tasksByStatus[col.key].length}
              </span>
            </div>
            <div className="space-y-2">
              {tasksByStatus[col.key].length === 0 && (
                <div className="text-center text-xs text-slate-400 py-8">
                  No tasks
                </div>
              )}
              {tasksByStatus[col.key].map((t) => (
                <TaskCard
                  key={t._id}
                  task={t}
                  onEdit={() => setTaskModal({ mode: 'edit', task: t })}
                  onStatusChange={onStatusChange}
                  onDelete={() => onDeleteTask(t)}
                  currentUserId={user.id}
                  myProjectRole={myProjectRole}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {taskModal && (
        <TaskFormModal
          mode={taskModal.mode}
          task={taskModal.task}
          project={project}
          onClose={() => setTaskModal(null)}
          onSaved={async () => {
            setTaskModal(null);
            await loadAll();
          }}
        />
      )}

      {memberModal && (
        <MembersModal
          project={project}
          canManage={canManageProject}
          onClose={() => setMemberModal(false)}
          onUpdated={async () => {
            await loadAll();
          }}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onEdit, onStatusChange, onDelete, currentUserId, myProjectRole }) {
  const overdue = isOverdue(task);
  const isAssignee = String(task.assignee?._id || '') === currentUserId;
  const isCreator = String(task.createdBy?._id || '') === currentUserId;
  const canFullEdit = myProjectRole === 'admin' || myProjectRole === 'owner' || isCreator;

  return (
    <div
      className={`bg-white rounded-lg p-3 shadow-sm border hover:shadow transition ${
        overdue ? 'border-red-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onEdit}
          className="text-left font-medium text-slate-900 hover:text-brand-600 text-sm flex-1 min-w-0"
        >
          {task.title}
        </button>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{task.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {task.assignee ? (
            <span className="text-slate-600 truncate">👤 {task.assignee.name}</span>
          ) : (
            <span className="text-slate-400 italic">Unassigned</span>
          )}
        </div>
        {task.dueDate && (
          <span className={overdue ? 'text-red-600 font-medium' : 'text-slate-500'}>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <select
          className="text-xs border-0 bg-transparent focus:ring-0 cursor-pointer text-slate-600 font-medium disabled:cursor-not-allowed"
          value={task.status}
          onChange={(e) => onStatusChange(task, e.target.value)}
          disabled={!canFullEdit && !isAssignee}
          title={
            !canFullEdit && !isAssignee
              ? 'Only the assignee, creator, project owner, or admin can change status'
              : 'Change status'
          }
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        {canFullEdit && (
          <button
            className="text-xs text-red-600 hover:text-red-700"
            onClick={onDelete}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function TaskFormModal({ mode, task, project, onClose, onSaved }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const participants = useMemo(() => {
    const all = [];
    if (project.owner) all.push(project.owner);
    for (const m of project.members) {
      if (m.user && !all.find((u) => String(u._id) === String(m.user._id))) {
        all.push(m.user);
      }
    }
    return all;
  }, [project]);

  const [form, setForm] = useState(() => ({
    title: task?.title || '',
    description: task?.description || '',
    assignee: task?.assignee?._id || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: toDateInput(task?.dueDate),
  }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        assignee: form.assignee || null,
        status: form.status,
        priority: form.priority,
        dueDate: fromDateInput(form.dueDate),
      };

      if (mode === 'create') {
        await api.post(`/projects/${project._id}/tasks`, payload);
        toast.success('Task created');
      } else {
        await api.patch(`/projects/${project._id}/tasks/${task._id}`, payload);
        toast.success('Task updated');
      }
      await onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'create' ? 'Create task' : 'Edit task'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            maxLength={200}
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[100px]"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={5000}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Assignee</label>
            <select
              className="input"
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            >
              <option value="">Unassigned</option>
              {participants.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Due date</label>
            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select
              className="input"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MembersModal({ project, canManage, onClose, onUpdated }) {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);

  const search = async (q) => {
    setSearching(true);
    try {
      const { users } = await api.get('/users', { q });
      setUsers(users);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (canManage) search('');
  }, [canManage]);

  useEffect(() => {
    if (!canManage) return;
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, canManage]);

  const currentMemberIds = new Set(
    project.members.map((m) => String(m.user?._id || m.user))
  );

  const addMember = async (userId) => {
    setBusy(true);
    try {
      await api.post(`/projects/${project._id}/members`, { userId, role: 'member' });
      toast.success('Member added');
      await onUpdated();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const updateRole = async (userId, role) => {
    setBusy(true);
    try {
      await api.patch(`/projects/${project._id}/members/${userId}`, { role });
      toast.success('Role updated');
      await onUpdated();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member from the project?')) return;
    setBusy(true);
    try {
      await api.delete(`/projects/${project._id}/members/${userId}`);
      toast.success('Member removed');
      await onUpdated();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Project members" size="lg">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Current members</h3>
          <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {project.members.map((m) => {
              const u = m.user;
              const isOwnerRow = String(project.owner?._id || project.owner) === String(u._id);
              return (
                <li key={u._id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">{u.name}</div>
                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && !isOwnerRow ? (
                      <>
                        <select
                          className="input !py-1 !text-xs !w-auto"
                          value={m.role}
                          onChange={(e) => updateRole(u._id, e.target.value)}
                          disabled={busy}
                        >
                          <option value="member">member</option>
                          <option value="owner">owner</option>
                        </select>
                        <button
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => removeMember(u._id)}
                          disabled={busy}
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <RoleBadge role={m.role} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {canManage && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Add members</h3>
            <input
              type="text"
              className="input"
              placeholder="Search users by name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ul className="mt-2 max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {searching && <li className="p-3 text-xs text-slate-500">Searching…</li>}
              {!searching && users.length === 0 && (
                <li className="p-3 text-xs text-slate-500">No users found</li>
              )}
              {users
                .filter((u) => !currentMemberIds.has(String(u._id)))
                .map((u) => (
                  <li key={u._id} className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 text-sm truncate">
                        {u.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{u.email}</div>
                    </div>
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => addMember(u._id)}
                      disabled={busy}
                    >
                      Add
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
