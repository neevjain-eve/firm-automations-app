'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import './el-tracker.css';
import CommentsSection from '@/components/CommentsSection';
import AttachmentsSection from '@/components/AttachmentsSection';
import { exportToExcel, parseExcelFile } from '@/lib/excel';

type Agreement = {
  id: string;
  name: string;
  clientName: string;
  agreementType: string | null;
  city: string | null;
  areaLocality: string | null;
  startDate: string;
  endDate: string;
  amount: number | null;
  notes: string | null;
  createdBy: { name: string; email: string };
  renewedFrom: { id: string; name: string; endDate: string } | null;
  renewals: { id: string; name: string; startDate: string; endDate: string }[];
};

const AGREEMENT_TYPES = [
  'Advisory Services Agreement',
  'CS Retainer Services Agreement',
  'Tax Services Agreement',
  'Accounting Retainer Services Agreement',
  'Other'
];

function computeStatus(endDate: string) {
  const daysLeft = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { key: 'expired', label: 'Expired', days: daysLeft };
  if (daysLeft <= 30) return { key: 'expiring', label: 'Expiring soon', days: daysLeft };
  return { key: 'active', label: 'Active', days: daysLeft };
}

const EMPTY_FORM = {
  name: '',
  clientName: '',
  agreementType: AGREEMENT_TYPES[0],
  city: '',
  areaLocality: '',
  startDate: '',
  endDate: '',
  amount: '',
  notes: ''
};

export default function ElTrackerPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [view, setView] = useState<'list' | 'client'>('list');
  const [showForm, setShowForm] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [renewForm, setRenewForm] = useState({ startDate: '', endDate: '', amount: '', notes: '' });
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/el-tracker');
    setAgreements(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addAgreement(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.clientName || !form.startDate || !form.endDate) return;
    setSaving(true);
    await fetch('/api/el-tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setForm(EMPTY_FORM);
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function removeAgreement(id: string) {
    await fetch(`/api/el-tracker/${id}`, { method: 'DELETE' });
    load();
  }

  async function renewAgreement(id: string) {
    if (!renewForm.startDate || !renewForm.endDate) return;
    setRenewing(true);
    const res = await fetch(`/api/el-tracker/${id}/renew`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renewForm)
    });
    const data = await res.json();
    setRenewing(false);
    if (res.ok) {
      setRenewForm({ startDate: '', endDate: '', amount: '', notes: '' });
      setDetailsId(data.id);
      load();
    }
  }

  const withStatus = useMemo(
    () => agreements.map((a) => ({ ...a, _status: computeStatus(a.endDate) })),
    [agreements]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return withStatus.filter((a) => {
      if (statusFilter !== 'all' && a._status.key !== statusFilter) return false;
      if (
        search &&
        !a.name.toLowerCase().includes(q) &&
        !a.clientName.toLowerCase().includes(q) &&
        !(a.city ?? '').toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [withStatus, search, statusFilter]);

  const counts = useMemo(
    () => ({
      active: withStatus.filter((a) => a._status.key === 'active').length,
      expiring: withStatus.filter((a) => a._status.key === 'expiring').length,
      expired: withStatus.filter((a) => a._status.key === 'expired').length
    }),
    [withStatus]
  );

  const byClient = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const a of filtered) (groups[a.clientName] ??= []).push(a);
    return Object.entries(groups).sort((x, y) => x[0].localeCompare(y[0]));
  }, [filtered]);

  const detailsAgreement = agreements.find((a) => a.id === detailsId) ?? null;

  function exportAgreements() {
    exportToExcel(
      withStatus.map((a) => ({
        'Agreement Name': a.name,
        Client: a.clientName,
        Type: a.agreementType ?? '',
        City: a.city ?? '',
        'Area/Locality': a.areaLocality ?? '',
        'Start Date': new Date(a.startDate).toLocaleDateString(),
        'End Date': new Date(a.endDate).toLocaleDateString(),
        'Value (₹)': a.amount ?? '',
        Status: a._status.label,
        Notes: a.notes ?? ''
      })),
      'el-tracker-export.xlsx'
    );
  }

  async function importAgreements(file: File) {
    setImporting(true);
    setImportMsg('');
    try {
      const rows = await parseExcelFile(file);
      let count = 0;
      for (const row of rows) {
        const name = row['Agreement Name'] || row.name;
        const clientName = row['Client'] || row['Client Name'];
        const startDate = row['Start Date'];
        const endDate = row['End Date'];
        if (!name || !clientName || !startDate || !endDate) continue;
        await fetch('/api/el-tracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            clientName,
            agreementType: row['Type'] || row['Agreement Type'] || AGREEMENT_TYPES[0],
            city: row['City'] || '',
            areaLocality: row['Area/Locality'] || row['Area / Locality'] || '',
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            amount: row['Value (₹)'] || row['Amount'] || '',
            notes: row['Notes'] || ''
          })
        });
        count++;
      }
      setImportMsg(`Imported ${count} agreement${count === 1 ? '' : 's'}.`);
      load();
    } catch {
      setImportMsg('Could not read that file — make sure it is a valid .xlsx or .csv export.');
    }
    setImporting(false);
  }

  function AgreementCard({ a }: { a: (typeof filtered)[number] }) {
    return (
      <div className={`el-card status-${a._status.key}`}>
        <div className="el-card-top">
          <p className="el-card-title" style={{ cursor: 'pointer' }} onClick={() => setDetailsId(a.id)}>
            {a.name}
            {a.renewals.length > 0 && <span style={{ fontSize: '.65rem', color: 'var(--renewed)', marginLeft: 6 }}>↻ renewed</span>}
          </p>
          <span className={`el-status-badge el-badge-${a._status.key}`}>{a._status.label}</span>
        </div>
        <p className="el-card-client">
          {a.clientName}
          {a.agreementType ? ` · ${a.agreementType}` : ''}
        </p>
        <div className="el-card-details">
          <div className="el-detail-item">
            <div className="el-detail-label">Start Date</div>
            <div className="el-detail-value">{new Date(a.startDate).toLocaleDateString()}</div>
          </div>
          <div className="el-detail-item">
            <div className="el-detail-label">End Date</div>
            <div className="el-detail-value">{new Date(a.endDate).toLocaleDateString()}</div>
          </div>
          <div className="el-detail-item">
            <div className="el-detail-label">Location</div>
            <div className="el-detail-value">{[a.areaLocality, a.city].filter(Boolean).join(', ') || '—'}</div>
          </div>
          <div className="el-detail-item">
            <div className="el-detail-label">Value</div>
            <div className="el-detail-value">{a.amount ? `₹${a.amount.toLocaleString()}` : '—'}</div>
          </div>
        </div>
        <span className={`el-days-left el-days-${a._status.key}`}>
          {a._status.days >= 0 ? `${a._status.days} days left` : `Expired ${Math.abs(a._status.days)} days ago`}
        </span>
        {a.notes && <p style={{ fontSize: '.8rem', color: '#374151', marginTop: 8 }}>{a.notes}</p>}
        <p style={{ fontSize: '.68rem', color: '#9ca3af', marginTop: 6 }}>
          Added by {a.createdBy?.name ?? a.createdBy?.email}
        </p>
        <div className="el-card-actions">
          <button className="el-btn-delete" onClick={() => removeAgreement(a.id)}>
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="el-scope">
      <div className="el-header">
        <div>
          <h1>Agreement Tracker</h1>
          <p>Engagement letters &amp; client agreements</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="el-header-btn" onClick={exportAgreements}>Export</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importAgreements(file);
              e.target.value = '';
            }}
          />
          <button className="el-header-btn" disabled={importing} onClick={() => fileInputRef.current?.click()}>
            {importing ? '…' : 'Import'}
          </button>
          <button className="el-header-btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Close' : '+ New'}
          </button>
        </div>
      </div>
      {importMsg && <p style={{ fontSize: 12, color: '#6b7280', padding: '0 20px 8px' }}>{importMsg}</p>}

      <div className="el-summary">
        <div className="el-summary-card sc-active">
          <div className="count">{counts.active}</div>
          <div className="label">Active</div>
        </div>
        <div className="el-summary-card sc-expiring">
          <div className="count">{counts.expiring}</div>
          <div className="label">Expiring</div>
        </div>
        <div className="el-summary-card sc-expired">
          <div className="count">{counts.expired}</div>
          <div className="label">Expired</div>
        </div>
      </div>

      <div className="el-filter-bar">
        {(['all', 'active', 'expiring', 'expired'] as const).map((s) => (
          <button
            key={s}
            className={`el-filter-btn ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All' : s === 'active' ? 'Active' : s === 'expiring' ? 'Expiring' : 'Expired'}
          </button>
        ))}
      </div>

      <div className="el-search-bar">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agreement, client, or city…" />
      </div>

      <div className="el-view-toggle">
        {(['list', 'client'] as const).map((v) => (
          <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
            {v === 'client' ? 'By Client' : 'All'}
          </button>
        ))}
      </div>

      {showForm && (
        <form className="el-fab-form" onSubmit={addAgreement}>
          <div className="form-grid">
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Agreement name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Accounting Retainer Agreement" />
            </div>
            <div>
              <label>Client name</label>
              <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} required />
            </div>
            <div>
              <label>Agreement type</label>
              <select value={form.agreementType} onChange={(e) => setForm({ ...form, agreementType: e.target.value })}>
                {AGREEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label>City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label>Area / Locality</label>
              <input value={form.areaLocality} onChange={(e) => setForm({ ...form, areaLocality: e.target.value })} />
            </div>
            <div>
              <label>Amount (₹)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label>Start date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div>
              <label>End date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <div className="el-card-actions" style={{ marginTop: 12 }}>
            <button type="submit" disabled={saving} className="el-header-btn" style={{ background: 'var(--primary-dark)', flex: 1 }}>
              {saving ? 'Adding…' : 'Add agreement'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="el-list">
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 100, borderRadius: 16, background: '#fff7ed' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="el-empty-state">
          <span className="icon">📄</span>
          <p>{agreements.length === 0 ? 'No agreements yet — tap + New to add one.' : 'No agreements match your search.'}</p>
        </div>
      ) : view === 'client' ? (
        <div className="el-list">
          {byClient.map(([client, clientAgreements]) => (
            <div key={client}>
              <p className="el-group-label">{client} ({clientAgreements.length})</p>
              {clientAgreements.map((a) => (
                <AgreementCard key={a.id} a={a} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="el-list">
          {filtered.map((a) => (
            <AgreementCard key={a.id} a={a} />
          ))}
        </div>
      )}

      {detailsAgreement && (
        <div
          style={{ position: 'fixed', inset: 0, background: '#11182780', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 40, zIndex: 100, overflowY: 'auto' }}
          onClick={() => setDetailsId(null)}
        >
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%', padding: 22, margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, color: '#111' }}>{detailsAgreement.name}</h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{detailsAgreement.clientName}</p>
              </div>
              <button onClick={() => setDetailsId(null)} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>

            {(detailsAgreement.renewedFrom || detailsAgreement.renewals.length > 0) && (
              <div style={{ background: '#f8f4ff', borderRadius: 10, padding: 12, marginBottom: 14, border: '1px solid #e9d5ff' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--renewed)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>
                  Renewal chain
                </p>
                {detailsAgreement.renewedFrom && (
                  <p style={{ fontSize: 13, margin: '2px 0' }}>
                    ← Renewed from version ending {new Date(detailsAgreement.renewedFrom.endDate).toLocaleDateString()}{' '}
                    <button onClick={() => setDetailsId(detailsAgreement.renewedFrom!.id)} style={{ fontSize: 11, background: '#ffedd5', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>View</button>
                  </p>
                )}
                {detailsAgreement.renewals.map((r) => (
                  <p key={r.id} style={{ fontSize: 13, margin: '2px 0' }}>
                    → Renewed as version {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}{' '}
                    <button onClick={() => setDetailsId(r.id)} style={{ fontSize: 11, background: '#ffedd5', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>View</button>
                  </p>
                ))}
              </div>
            )}

            <div className="el-card-details" style={{ marginBottom: 14 }}>
              <div className="el-detail-item">
                <div className="el-detail-label">Start Date</div>
                <div className="el-detail-value">{new Date(detailsAgreement.startDate).toLocaleDateString()}</div>
              </div>
              <div className="el-detail-item">
                <div className="el-detail-label">End Date</div>
                <div className="el-detail-value">{new Date(detailsAgreement.endDate).toLocaleDateString()}</div>
              </div>
              <div className="el-detail-item">
                <div className="el-detail-label">Value</div>
                <div className="el-detail-value">{detailsAgreement.amount ? `₹${detailsAgreement.amount.toLocaleString()}` : '—'}</div>
              </div>
              <div className="el-detail-item">
                <div className="el-detail-label">Location</div>
                <div className="el-detail-value">{[detailsAgreement.areaLocality, detailsAgreement.city].filter(Boolean).join(', ') || '—'}</div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em', color: '#6b7280' }}>Renew this agreement</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input type="date" value={renewForm.startDate} onChange={(e) => setRenewForm({ ...renewForm, startDate: e.target.value })} placeholder="New start date" style={{ padding: '7px 9px', border: '1.5px solid #fed7aa', borderRadius: 8, fontSize: 13 }} />
                <input type="date" value={renewForm.endDate} onChange={(e) => setRenewForm({ ...renewForm, endDate: e.target.value })} placeholder="New end date" style={{ padding: '7px 9px', border: '1.5px solid #fed7aa', borderRadius: 8, fontSize: 13 }} />
              </div>
              <button
                onClick={() => renewAgreement(detailsAgreement.id)}
                disabled={renewing}
                style={{ marginTop: 8, background: 'var(--primary-dark)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                {renewing ? 'Renewing…' : 'Create renewal'}
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <AttachmentsSection entityType="agreement" entityId={detailsAgreement.id} accentClass="el-modal-btn" />
            </div>
            <div>
              <CommentsSection entityType="agreement" entityId={detailsAgreement.id} accentClass="el-modal-btn" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
