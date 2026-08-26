'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import './e-signature.css';
import AttachmentsSection from '@/components/AttachmentsSection';

type SignatureRow = {
  id: string;
  signedName: string;
  signedAt: string;
  user: { id: string; name: string; email: string };
};
type Policy = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: { name: string; email: string };
  signatures: SignatureRow[];
};

function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  function pos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    const ctx = canvas.getContext('2d')!;
    const { x, y } = pos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const { x, y } = pos(e, canvas);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#123f2b';
    ctx.lineTo(x, y);
    ctx.stroke();
    hasInk.current = true;
  }

  function end() {
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas && hasInk.current) onChange(canvas.toDataURL('image/png'));
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    onChange(null);
  }

  return (
    <div className="es-sig-pad-wrap">
      <canvas
        ref={canvasRef}
        width={400}
        height={140}
        style={{ width: '100%', touchAction: 'none', cursor: 'crosshair', background: '#fff', borderRadius: 6 }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <button type="button" onClick={clear} className="es-btn-secondary" style={{ marginTop: 6, fontSize: 12, padding: '5px 10px' }}>
        Clear signature
      </button>
    </div>
  );
}

export default function ESignaturePage() {
  const { data: session } = useSession();
  const myId = (session?.user as any)?.id as string | undefined;
  const myName = session?.user?.name ?? '';

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [signName, setSignName] = useState(myName);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signError, setSignError] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/e-signature');
    setPolicies(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (myName) setSignName(myName);
  }, [myName]);

  async function addPolicy(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    await fetch('/api/e-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setForm({ title: '', content: '' });
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function removePolicy(id: string) {
    await fetch(`/api/e-signature/${id}`, { method: 'DELETE' });
    load();
  }

  async function sign(policyId: string) {
    setSignError('');
    if (!signName.trim()) {
      setSignError('Enter your name.');
      return;
    }
    if (!signatureData) {
      setSignError('Draw your signature above.');
      return;
    }
    const res = await fetch(`/api/e-signature/${policyId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signedName: signName, signatureData })
    });
    const data = await res.json();
    if (!res.ok) {
      setSignError(data.error ?? 'Something went wrong.');
      return;
    }
    setSignatureData(null);
    load();
  }

  const withStatus = useMemo(
    () =>
      policies.map((p) => ({
        ...p,
        mySignature: p.signatures.find((s) => s.user.id === myId)
      })),
    [policies, myId]
  );

  const counts = useMemo(
    () => ({
      pending: withStatus.filter((p) => !p.mySignature).length,
      signed: withStatus.filter((p) => p.mySignature).length
    }),
    [withStatus]
  );

  return (
    <div className="es-scope">
      <div className="es-header">
        <h1>e-Signature</h1>
        <p>Company policies for staff to review and sign off on.</p>
      </div>

      <div className="es-wrap">
        <div className="es-card">
          <div className="es-row" style={{ justifyContent: 'space-between' }}>
            <div className="es-row">
              <span className={`es-status-pill ${counts.pending === 0 ? 'signed' : 'pending'}`}>
                {counts.pending} pending your signature
              </span>
              <span className="es-status-pill signed">{counts.signed} signed by you</span>
            </div>
            <button className="es-btn-primary" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Close' : '+ Post policy'}
            </button>
          </div>
        </div>

        {showForm && (
          <form className="es-card" onSubmit={addPolicy}>
            <h2>New policy</h2>
            <p className="hint">Staff will see this and can sign off with a typed name and drawn signature.</p>
            <label>Policy title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. Remote Work Policy 2026"
            />
            <label>Policy text</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              rows={6}
              placeholder="Paste or write the policy staff need to acknowledge…"
            />
            <button type="submit" disabled={saving} className="es-btn-primary" style={{ marginTop: 12 }}>
              {saving ? 'Posting…' : 'Post policy'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="es-card" style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>Loading…</div>
        ) : withStatus.length === 0 ? (
          <div className="es-card" style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
            No policies posted yet — add one above.
          </div>
        ) : (
          withStatus.map((p) => {
            const expanded = expandedId === p.id;
            return (
              <div key={p.id} className="es-card">
                <div className="es-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => setExpandedId(expanded ? null : p.id)}>
                    <p className="es-policy-title">{p.title}</p>
                    <p className="es-policy-meta">
                      Posted by {p.createdBy?.name ?? p.createdBy?.email} · {p.signatures.length} signed
                    </p>
                  </div>
                  <span className={`es-status-pill ${p.mySignature ? 'signed' : 'pending'}`}>
                    {p.mySignature ? 'Signed' : 'Pending'}
                  </span>
                </div>

                {expanded && (
                  <>
                    <div className="es-policy-content">{p.content}</div>

                    <div style={{ marginBottom: 14 }}>
                      <AttachmentsSection entityType="policy" entityId={p.id} accentClass="es-btn-secondary" />
                    </div>

                    <p style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--brand-dark)', marginBottom: 4 }}>
                      Signed by ({p.signatures.length})
                    </p>
                    {p.signatures.length === 0 ? (
                      <p style={{ fontSize: '.8rem', color: 'var(--muted)' }}>No one has signed yet.</p>
                    ) : (
                      <ul className="es-sign-list">
                        {p.signatures.map((s) => (
                          <li key={s.id}>
                            {s.signedName} ({s.user?.email}) — {new Date(s.signedAt).toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    )}

                    {p.mySignature ? (
                      <div className="es-msg ok" style={{ marginTop: 12 }}>
                        You signed this as &quot;{p.mySignature.signedName}&quot; on{' '}
                        {new Date(p.mySignature.signedAt).toLocaleString()}.
                      </div>
                    ) : (
                      <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                        <p style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--brand-dark)', marginBottom: 8 }}>
                          Sign this policy
                        </p>
                        <label>Your full name</label>
                        <input
                          type="text"
                          value={signName}
                          onChange={(e) => setSignName(e.target.value)}
                          placeholder="Your full name"
                        />
                        <label>Signature</label>
                        <SignaturePad onChange={setSignatureData} />
                        {signError && <p className="es-msg error">{signError}</p>}
                        <button onClick={() => sign(p.id)} className="es-btn-primary" style={{ marginTop: 10 }}>
                          Sign policy
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => removePolicy(p.id)}
                    className="es-btn-secondary"
                    style={{ fontSize: 12, color: 'var(--danger)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
