import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { StatusBadge, PriorityBadge } from '../components/Badges.jsx';
import { formatDate, isOverdue } from '../lib/date.js';

function StatCard({ label, value, color = 'brand', sub }) {
  const colors = {
    brand: 'from-brand-500 to-brand-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    slate: 'from-slate-500 to-slate-600',
  };
  return (
    <div className="card p-5">
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <div
          className={`text-3xl font-bold bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent`}
        >
          {value}
        </div>
        {sub && <div className="text-xs text-slate-500 pb-1">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    api
      .get('/dashboard')
      .then(setData)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <div className="text-slate-500">Loading dashboard…</div>;
  if (!data) return <div className="text-slate-500">No data.</div>;

  const { totals, statusCounts, overdueTasks, recentTasks } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Your work at a glance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Projects" value={totals.projects} color="brand" />
        <StatCard label="Total tasks" value={totals.tasks} color="slate" />
        <StatCard label="Assigned to me" value={totals.assignedToMe} color="emerald" />
        <StatCard label="Created by me" value={totals.createdByMe} color="amber" />
        <StatCard label="Overdue" value={totals.overdue} color="red" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-sm text-slate-500">To Do</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{statusCounts.todo}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">In Progress</div>
          <div className="text-3xl font-bold text-blue-700 mt-1">{statusCounts.in_progress}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">Done</div>
          <div className="text-3xl font-bold text-emerald-700 mt-1">{statusCounts.done}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Overdue tasks</h2>
            <span className="badge bg-red-100 text-red-700">{overdueTasks.length}</span>
          </div>
          {overdueTasks.length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center">
              Nothing overdue. 🎉
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {overdueTasks.map((t) => (
                <li key={t._id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${t.project._id}`}
                      className="font-medium text-slate-900 hover:text-brand-600 truncate block"
                    >
                      {t.title}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {t.project.name}
                      {t.assignee && <> · {t.assignee.name}</>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="text-xs text-red-600 font-medium">
                      {formatDate(t.dueDate)}
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center">
              No tasks yet. Create a project to get started.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentTasks.map((t) => (
                <li key={t._id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${t.project._id}`}
                      className="font-medium text-slate-900 hover:text-brand-600 truncate block"
                    >
                      {t.title}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{t.project.name}</span>
                      {t.assignee && <span>· {t.assignee.name}</span>}
                      {isOverdue(t) && (
                        <span className="text-red-600 font-medium">· overdue</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
