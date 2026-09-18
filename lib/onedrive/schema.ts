// One JSON collection per Prisma model in prisma/schema.prisma, plus the
// three legacy key-value stores kept as-is (they're already { key, value }
// shaped, so they map to plain objects instead of arrays -- see the "Legacy
// stores" section below).
//
// Dates are stored as ISO 8601 strings (JSON has no native Date type).
// Relations are NOT enforced by the storage layer -- e.g. StatusTaskRow.
// createdById is just a string that happens to match a UserRow.id. Joins,
// where needed, happen in application code by reading both collections and
// matching in memory. That's fine at this data volume (a single firm's
// records, not a multi-tenant SaaS) and keeps every file independently
// readable/writable without cross-file transactions, which OneDrive can't
// offer anyway.
//
// Collection name -> file name is automatic: readCollection('status-tasks')
// reads /PDKA Data/status-tasks.json. Keep these names in sync with the
// COLLECTIONS map below; nothing else should hardcode a file name.

export const COLLECTIONS = {
  users: 'users',
  comments: 'comments',
  attachments: 'attachments',
  automationRuns: 'automation-runs',
  statusTasks: 'status-tasks',
  agreements: 'agreements', // EL Tracker
  gstReconciliations: 'gst-reconciliations',
  leaseAgreements: 'lease-agreements',
  todoTasks: 'todo-tasks',
  todoAssignees: 'todo-assignees',
  todoWorkLogs: 'todo-worklogs',
  policies: 'policies',
  policySignatures: 'policy-signatures'
} as const;

// The three legacy trackers' backing stores (LegacyTodoStore,
// LegacyStatusStore, LegacyElTrackerStore in Prisma) are key-value, not
// row collections -- a handful of named JSON blobs each, not a table of
// records. They map to one JSON *object* file per tracker instead of one
// array file, keyed the same way the Prisma table was keyed.
export const LEGACY_STORE_FILES = {
  legacyTodoStore: 'legacy-todo-store',
  legacyStatusStore: 'legacy-status-store',
  legacyElTrackerStore: 'legacy-el-tracker-store'
} as const;

export type UserRow = {
  id: string;
  email: string;
  name: string;
  password: string | null;
  role: 'staff' | 'manager' | 'admin';
  allowedTrackers: string[];
  createdAt: string;
};

export type CommentRow = {
  id: string;
  entityType: string;
  entityId: string;
  body: string;
  createdAt: string;
  userId: string;
};

export type AttachmentRow = {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
  userId: string;
};

export type AutomationRunRow = {
  id: string;
  automationId: string;
  status: 'running' | 'success' | 'failed';
  input: unknown;
  output: unknown;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
  userId: string;
};

export type StatusTaskRow = {
  id: string;
  title: string;
  clientName: string | null;
  manager: string | null;
  teamMember: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'blocked' | 'on_hold' | 'completed';
  notes: string | null;
  blockers: string | null;
  actionPoints: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
};

export type AgreementRow = {
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
  createdAt: string;
  updatedAt: string;
  renewedFromId: string | null;
  createdById: string;
};

export type GstReconciliationRow = {
  id: string;
  period: string;
  returnType: 'GSTR-1' | 'GSTR-3B' | 'GSTR-2B' | 'Annual';
  status: 'pending' | 'matched' | 'mismatch';
  gstin: string | null;
  dueDate: string | null;
  filedBy: string | null;
  amountBooks: number | null;
  amountGst: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
};

export type LeaseAgreementRow = {
  id: string;
  propertyName: string;
  lessorName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  startDate: string;
  endDate: string;
  rentAmount: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
};

export type ToDoTaskRow = {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed';
  department: string | null;
  client: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
};

export type ToDoAssigneeRow = {
  id: string;
  taskId: string;
  userId: string;
};

export type ToDoWorkLogRow = {
  id: string;
  taskId: string;
  userId: string;
  description: string;
  logDate: string;
  createdAt: string;
};

export type PolicyRow = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
};

export type PolicySignatureRow = {
  id: string;
  policyId: string;
  userId: string;
  signedName: string;
  signatureData: string;
  signedAt: string;
};
