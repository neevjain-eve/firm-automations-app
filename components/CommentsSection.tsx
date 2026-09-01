'use client';

import { useEffect, useState } from 'react';

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  user: { name: string; email: string };
};

export default function CommentsSection({
  entityType,
  entityId,
  accentClass = 'bg-gradient-to-r from-accent-500 to-violet-600 hover:shadow-glow'
}: {
  entityType: string;
  entityId: string;
  accentClass?: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/comments?entityType=${entityType}&entityId=${entityId}`);
    setComments(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function addComment() {
    if (!draft.trim()) return;
    setPosting(true);
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, entityId, body: draft })
    });
    setDraft('');
    setPosting(false);
    load();
  }

  async function removeComment(id: string) {
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
        Comments {comments.length > 0 ? `(${comments.length})` : ''}
      </p>
      {loading ? (
        <p className="text-xs text-zinc-600">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-zinc-600">No comments yet.</p>
      ) : (
        <div className="mb-2.5 flex max-h-56 flex-col gap-2 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
              <div className="flex justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-zinc-200">
                  {c.user?.name ?? c.user?.email}
                </span>
                <span className="text-[11px] text-zinc-600">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-0.5 text-[13px] text-zinc-400">{c.body}</p>
              <button
                onClick={() => removeComment(c.id)}
                className="mt-1 text-[11px] text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') addComment();
          }}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 focus:border-accent-500/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
        />
        <button
          onClick={addComment}
          disabled={posting}
          className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white transition-all disabled:opacity-50 ${accentClass}`}
        >
          Post
        </button>
      </div>
    </div>
  );
}
