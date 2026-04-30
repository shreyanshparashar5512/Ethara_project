import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import { formatDate } from '../lib/date.js';
import { RoleBadge } from '../components/Badges.jsx';

export default function Projects() {
  const { user } = useAuth();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    api
      .get('/projects')
      .then(({ projects }) => setProjects(projects))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created');
      setCreating(false);
      setForm({ name: '', description: '' });
      setLoading(true);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const myRole = (p) => {
    if (user.role === 'admin') return 'admin';
    if (String(p.owner?._id || p.owner) === user.id) return 'owner';
    const m = p.members?.find(
      (m) => String(m.user?._id || m.user) === user.id
    );
    return m?.role || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-1">Organize work into projects</p>
        </div>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          + New project
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-slate-400 mb-2 text-4xl">📋</div>
          <div className="text-slate-900 font-medium">No projects yet</div>
          <p className="text-slate-500 text-sm mt-1">
            Create your first project to start assigning tasks.
          </p>
          <button className="btn-primary mt-4" onClick={() => setCreating(true)}>
            Create a project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const role = myRole(p);
            return (
              <Link
                key={p._id}
                to={`/projects/${p._id}`}
                className="card p-5 hover:shadow-md transition hover:border-brand-300 block"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                  {role && <RoleBadge role={role} />}
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 min-h-[2.5rem]">
                  {p.description || <span className="text-slate-400 italic">No description</span>}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{p.members?.length || 0} members</span>
                  <span>Updated {formatDate(p.updatedAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Create project"
      >
        <form onSubmit={onCreate} className="space-y-4">
          <div>
            <label className="label" htmlFor="p-name">Name</label>
            <input
              id="p-name"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={120}
            />
          </div>
          <div>
            <label className="label" htmlFor="p-desc">Description</label>
            <textarea
              id="p-desc"
              className="input min-h-[100px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={2000}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
