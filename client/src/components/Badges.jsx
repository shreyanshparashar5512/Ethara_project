export function StatusBadge({ status }) {
  const map = {
    todo: { cls: 'badge-todo', label: 'To Do' },
    in_progress: { cls: 'badge-progress', label: 'In Progress' },
    done: { cls: 'badge-done', label: 'Done' },
  };
  const s = map[status] || map.todo;
  return <span className={s.cls}>{s.label}</span>;
}

export function PriorityBadge({ priority }) {
  const map = {
    low: 'badge-low',
    medium: 'badge-medium',
    high: 'badge-high',
  };
  return <span className={map[priority] || 'badge-low'}>{priority}</span>;
}

export function RoleBadge({ role }) {
  const map = {
    admin: 'badge-admin',
    owner: 'badge-owner',
    member: 'badge-member',
  };
  return <span className={map[role] || 'badge-member'}>{role}</span>;
}
