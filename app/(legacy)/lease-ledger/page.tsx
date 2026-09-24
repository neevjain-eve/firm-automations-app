'use client';

// Literal copy of the standalone Lease Ledger app
// (github.com/neevjain-eve/pdka-lease-ledger, live at
// pdka-lease-ledger.vercel.app) -- byte-for-byte, zero modifications, same
// as the other legacy tracker embeds (Status Tracker, EL Tracker, To-Do
// List, e-Signature). It needs no SSO wiring: it has no login screen of its
// own (it was originally built as a Claude Artifact and keeps its data in
// this browser's localStorage/IndexedDB only, with no backend calls), so
// there's no separate account to bridge into -- the surrounding app's own
// login is the only gate.
export default function LeaseLedgerPage() {
  return (
    <iframe
      src="/legacy/lease-ledger/index.html"
      title="Lease Ledger"
      style={{ width: '100%', height: '100vh', border: 'none', background: '#fff' }}
    />
  );
}
