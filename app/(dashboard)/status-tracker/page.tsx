'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './status-tracker.css';
import CommentsSection from '@/components/CommentsSection';
import AttachmentsSection from '@/components/AttachmentsSection';
import { exportToExcel, parseExcelFile } from '@/lib/excel';

type Task = {
  id: string;
  title: string;
  clientName: string | null;
  manager: string | null;
  teamMember: string | null;
  priority: string;
  status: string;
  notes: string | null;
  blockers: string | null;
  actionPoints: string | null;
  dueDate: string | null;
  updatedAt: string;
  createdBy: { name: string; email: string };
};

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not Started',
  pending: 'Not Started',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  on_hold: 'On Hold',
  completed: 'Completed'
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  not_started: 'st-badge-status-pending',
  pending: 'st-badge-status-pending',
  in_progress: 'st-badge-status-inprogress',
  blocked: 'st-badge-status-overdue',
  on_hold: 'st-badge-status-pending',
  completed: 'st-badge-status-completed'
};

const PRIORITY_LABEL: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };
const PRIORITY_BADGE_CLASS: Record<string, string> = {
  low: 'st-badge-priority-low',
  medium: 'st-badge-priority-medium',
  high: 'st-badge-priority-high'
};

const EMPTY_FORM = {
  title: '',
  clientName: '',
  manager: '',
  teamMember: '',
  priority: 'medium',
  dueDate: '',
  notes: '',
  blockers: '',
  actionPoints: ''
};

function normStatus(s: string) {
  return s === 'pending' ? 'not_started' : s;
}

function shortId(id: string) {
  return `TSK-${id.slice(-6).toUpperCase()}`;
}

export default function StatusTrackerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/status-tracker');
    setTasks(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch('/api/status-tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, dueDate: form.dueDate || null })
    });
    setForm(EMPTY_FORM);
    setSaving(false);
    setShowAddModal(false);
    load();
  }

  async function updateField(id: string, field: string, value: string) {
    await fetch(`/api/status-tracker/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value })
    });
    load();
  }

  async function removeTask(id: string) {
    await fetch(`/api/status-tracker/${id}`, { method: 'DELETE' });
    setDetailsId(null);
    load();
  }

  function exportTasks() {
    exportToExcel(
      tasks.map((t) => ({
        'Task ID': shortId(t.id),
        'Task Name': t.title,
        Client: t.clientName ?? '',
        Manager: t.manager ?? '',
        'Team Member': t.teamMember ?? '',
        Priority: PRIORITY_LABEL[t.priority] ?? t.priority,
        Status: STATUS_LABEL[normStatus(t.status)] ?? t.status,
        'Due Date': t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
        'Task Description': t.notes ?? '',
        Blockers: t.blockers ?? '',
        'Action Points': t.actionPoints ?? '',
        'Last Updated': new Date(t.updatedAt).toLocaleDateString()
      })),
      'status-tracker-export.xlsx'
    );
  }

  async function importTasks(file: File) {
    setImporting(true);
    setImportMsg('');
    try {
      const rows = await parseExcelFile(file);
      let count = 0;
      for (const row of rows) {
        const title = row['Task Name'] || row['Task name'] || row.title;
        if (!title) continue;
        await fetch('/api/status-tracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            clientName: row['Client'] || row['Client Name'] || '',
            manager: row['Manager'] || '',
            teamMember: row['Team Member'] || '',
            priority: (row['Priority'] || 'medium').toString().toLowerCase(),
            notes: row['Task Description'] || row['Description'] || '',
            blockers: row['Blockers'] || '',
            actionPoints: row['Action Points'] || '',
            dueDate: row['Due Date'] ? new Date(row['Due Date']).toISOString() : null
          })
        });
        count++;
      }
      setImportMsg(`Imported ${count} task${count === 1 ? '' : 's'}.`);
      load();
    } catch {
      setImportMsg('Could not read that file — make sure it is a valid .xlsx or .csv export.');
    }
    setImporting(false);
  }

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && normStatus(t.status) !== statusFilter) return false;
      const q = search.toLowerCase();
      if (
        search &&
        !t.title.toLowerCase().includes(q) &&
        !(t.clientName ?? '').toLowerCase().includes(q) &&
        !(t.teamMember ?? '').toLowerCase().includes(q) &&
        !(t.manager ?? '').toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [tasks, search, statusFilter]);

  const counts = useMemo(() => {
    const now = Date.now();
    return {
      total: tasks.length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      overdue: tasks.filter(
        (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate).getTime() < now
      ).length
    };
  }, [tasks]);

  const detailsTask = tasks.find((t) => t.id === detailsId) ?? null;

  return (
    <div className="st-scope">
      <div className="st-toolbar">
        <div>
          <h1 className="st-page-title">Manager Task Tracker</h1>
          <p className="st-page-sub">
            Client, owner, priority, blockers, and action points — stored in the firm&apos;s own database.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <button className="st-btn st-btn-ghost" onClick={exportTasks}>
            Export
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importTasks(file);
              e.target.value = '';
            }}
          />
          <button className="st-btn st-btn-secondary" disabled={importing} onClick={() => fileInputRef.current?.click()}>
            {importing ? 'Importing…' : 'Import'}
          </button>
          <button className="st-btn st-btn-primary st-btn-add" onClick={() => setShowAddModal(true)}>
            + Add Task
          </button>
        </div>
      </div>
      {importMsg && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -12, marginBottom: 12 }}>{importMsg}</p>
      )}

      <div className="st-summary-grid">
        <div className="st-summary-card">
          <span className="st-summary-card-icon tone-total" />
          <div>
            <p className="st-summary-card-value">{counts.total}</p>
            <p className="st-summary-card-label">Total tasks</p>
          </div>
        </div>
        <div className="st-summary-card">
          <span className="st-summary-card-icon tone-inprogress" />
          <div>
            <p className="st-summary-card-value">{counts.in_progress}</p>
            <p className="st-summary-card-label">In progress</p>
          </div>
        </div>
        <div className="st-summary-card">
          <span className="st-summary-card-icon tone-completed" />
          <div>
            <p className="st-summary-card-value">{counts.completed}</p>
            <p className="st-summary-card-label">Completed</p>
          </div>
        </div>
        <div className="st-summary-card">
          <span className="st-summary-card-icon tone-overdue" />
          <div>
            <p className="st-summary-card-value">{counts.overdue}</p>
            <p className="st-summary-card-label">Overdue</p>
          </div>
        </div>
      </div>

      <div className="st-filter-bar" style={{ marginBottom: 20 }}>
        <div className="st-filter-search">
          <svg className="st-filter-search-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by task, client, or owner…"
          />
        </div>
        <div className="st-filter-selects">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
          </select>
          <span className="st-filter-count">{filtered.length} of {tasks.length} tasks</span>
        </div>
      </div>

      <div className="st-card st-table-card">
        {loading ? (
          <div style={{ padding: 20 }}>
            <div className="st-table-empty">Loading…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="st-table-empty">
            {tasks.length === 0 ? 'No tasks yet — add one above.' : 'No tasks match your search.'}
          </div>
        ) : (
          <div className="st-table-scroll">
            <table className="st-task-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Task Name</th>
                  <th>Client</th>
                  <th>Manager</th>
                  <th>Team Member</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Last Updated</th>
                  <th className="st-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr key={task.id}>
                    <td className="st-cell-id">{shortId(task.id)}</td>
                    <td className="st-cell-name">
                      <button className="st-link-button" onClick={() => setDetailsId(task.id)}>
                        {task.title}
                      </button>
                    </td>
                    <td>{task.clientName || '—'}</td>
                    <td>{task.manager || '—'}</td>
                    <td>{task.teamMember || '—'}</td>
                    <td>
                      <span className={`st-badge-priority ${PRIORITY_BADGE_CLASS[task.priority] ?? ''}`}>
                        {PRIORITY_LABEL[task.priority] ?? task.priority}
                      </span>
                    </td>
                    <td>
                      <select
                        value={task.status}
                        onChange={(e) => updateField(task.id, 'status', e.target.value)}
                        className={`st-badge-status ${STATUS_BADGE_CLASS[normStatus(task.status)] ?? ''}`}
                        style={{ border: 'none', appearance: 'none' }}
                      >
                        <option value="not_started">Not started</option>
                        <option value="in_progress">In progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="on_hold">On hold</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</td>
                    <td className="st-cell-updated">{new Date(task.updatedAt).toLocaleDateString()}</td>
                    <td className="st-col-actions">
                      <div className="st-row-actions">
                        <button className="st-icon-btn" onClick={() => setDetailsId(task.id)}>
                          View
                        </button>
                        <button className="st-icon-btn st-icon-btn-danger" onClick={() => removeTask(task.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="st-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="st-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="st-modal-header">
              <h2>Add Task</h2>
              <button className="st-modal-close" onClick={() => setShowAddModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={addTask}>
              <div className="st-modal-body">
                <div className="st-form-grid">
                  <div className="st-form-field" style={{ gridColumn: '1 / -1' }}>
                    <label>Task name</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                      placeholder="e.g. Follow up with client on GST filing"
                    />
                  </div>
                  <div className="st-form-field">
                    <label>Client</label>
                    <input
                      value={form.clientName}
                      onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    />
                  </div>
                  <div className="st-form-field">
                    <label>Manager</label>
                    <input
                      value={form.manager}
                      onChange={(e) => setForm({ ...form, manager: e.target.value })}
                    />
                  </div>
                  <div className="st-form-field">
                    <label>Team member</label>
                    <input
                      value={form.teamMember}
                      onChange={(e) => setForm({ ...form, teamMember: e.target.value })}
                    />
                  </div>
                  <div className="st-form-field">
                    <label>Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="st-form-field">
                    <label>Due date</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="st-form-field" style={{ gridColumn: '1 / -1' }}>
                    <label>Task description</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="st-form-field">
                    <label>Blockers</label>
                    <input
                      value={form.blockers}
                      onChange={(e) => setForm({ ...form, blockers: e.target.value })}
                    />
                  </div>
                  <div className="st-form-field">
                    <label>Action points</label>
                    <input
                      value={form.actionPoints}
                      onChange={(e) => setForm({ ...form, actionPoints: e.target.value })}
                    />
                  </div>
                </div>
                <div className="st-modal-footer">
                  <button type="button" className="st-btn st-btn-ghost" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="st-btn st-btn-primary">
                    {saving ? 'Adding…' : 'Add task'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsTask && (
        <div className="st-modal-overlay" onClick={() => setDetailsId(null)}>
          <div className="st-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="st-modal-header">
              <h2>Task Details</h2>
              <button className="st-modal-close" onClick={() => setDetailsId(null)}>
                ×
              </button>
            </div>
            <div className="st-modal-body">
              <div className="st-details-meta">
                <span className="st-details-meta-id">{shortId(detailsTask.id)}</span>
                <span className={`st-badge-status ${STATUS_BADGE_CLASS[normStatus(detailsTask.status)] ?? ''}`}>
                  {STATUS_LABEL[normStatus(detailsTask.status)] ?? detailsTask.status}
                </span>
                <span className={`st-badge-priority ${PRIORITY_BADGE_CLASS[detailsTask.priority] ?? ''}`}>
                  {PRIORITY_LABEL[detailsTask.priority] ?? detailsTask.priority}
                </span>
              </div>
              <div className="st-details-grid">
                <div className="st-details-field">
                  <span className="st-details-label">Client</span>
                  <span>{detailsTask.clientName || '—'}</span>
                </div>
                <div className="st-details-field">
                  <span className="st-details-label">Manager</span>
                  <span>{detailsTask.manager || '—'}</span>
                </div>
                <div className="st-details-field">
                  <span className="st-details-label">Team member</span>
                  <span>{detailsTask.teamMember || '—'}</span>
                </div>
                <div className="st-details-field">
                  <span className="st-details-label">Due date</span>
                  <span>{detailsTask.dueDate ? new Date(detailsTask.dueDate).toLocaleDateString() : '—'}</span>
                </div>
              </div>
              {detailsTask.notes && (
                <div className="st-details-section">
                  <h3>Task Description</h3>
                  <p className="st-details-text">{detailsTask.notes}</p>
                </div>
              )}
              {detailsTask.blockers && (
                <div className="st-details-section">
                  <h3>Blockers</h3>
                  <p className="st-details-text">{detailsTask.blockers}</p>
                </div>
              )}
              {detailsTask.actionPoints && (
                <div className="st-details-section">
                  <h3>Action Points</h3>
                  <p className="st-details-text">{detailsTask.actionPoints}</p>
                </div>
              )}
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Added by {detailsTask.createdBy?.name ?? detailsTask.createdBy?.email} · Last updated{' '}
                {new Date(detailsTask.updatedAt).toLocaleString()}
              </p>

              <div className="st-details-section">
                <AttachmentsSection entityType="status_task" entityId={detailsTask.id} accentClass="st-btn st-btn-secondary" />
              </div>
              <div className="st-details-section">
                <CommentsSection entityType="status_task" entityId={detailsTask.id} accentClass="st-btn st-btn-primary" />
              </div>

              <div className="st-modal-footer">
                <button className="st-btn st-btn-danger" onClick={() => removeTask(detailsTask.id)}>
                  Delete task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
