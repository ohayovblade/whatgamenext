// The backlog status set (per CLAUDE.md). Shared by client + server so the UI
// dropdown and the API validation can never drift apart. Pure module — no DB
// imports, safe to import from client components.

export const BACKLOG_STATUSES = [
  'Not Started',
  'Playing',
  'Completed',
  'Dropped',
] as const;

export type BacklogStatus = (typeof BACKLOG_STATUSES)[number];

export function isBacklogStatus(value: unknown): value is BacklogStatus {
  return (
    typeof value === 'string' &&
    (BACKLOG_STATUSES as readonly string[]).includes(value)
  );
}
