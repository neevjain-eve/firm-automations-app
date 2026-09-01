'use client';

import { useEffect, useRef, useState } from 'react';
import { Paperclip } from 'lucide-react';

type Attachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
  user: { name: string; email: string };
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentsSection({
  entityType,
  entityId,
  accentClass = 'bg-gradient-to-r from-accent-500 to-violet-600 hover:shadow-glow'
}: {
  entityType: string;
  entityId: string;
  accentClass?: string;
}) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/attachments?entityType=${entityType}&entityId=${entityId}`);
    setFiles(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function upload(file: File) {
    setError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    const res = await fetch('/api/attachments', { method: 'POST', body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? 'Upload failed.');
      return;
    }
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/attachments/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
        Attachments {files.length > 0 ? `(${files.length})` : ''}
      </p>
      {loading ? (
        <p className="text-xs text-zinc-600">Loading…</p>
      ) : files.length === 0 ? (
        <p className="mb-2 text-xs text-zinc-600">No files attached yet.</p>
      ) : (
        <div className="mb-2.5 flex flex-col gap-1.5">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <a
                href={f.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 truncate text-[13px] font-medium text-zinc-200 no-underline hover:text-accent-400"
              >
                {f.fileName}
              </a>
              <span className="text-[11px] text-zinc-600">{formatSize(f.fileSize)}</span>
              <button
                onClick={() => remove(f.id)}
                className="text-[11px] text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="mb-1.5 text-xs text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = '';
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold text-white transition-all disabled:opacity-50 ${accentClass}`}
      >
        {uploading ? 'Uploading…' : '+ Attach file'}
      </button>
    </div>
  );
}
