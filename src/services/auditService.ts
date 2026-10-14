import { adminGet } from '@/services/adminApi';

export interface AuditEntry {
  readonly id: string;
  readonly action: string;
  readonly user: string;
  readonly timestamp: number;
  readonly details: string;
}

interface AuditResponse {
  readonly logs: AuditEntry[];
  readonly count: number;
}

export const auditService = {
  async fetchRecentEntries(): Promise<AuditEntry[]> {
    const result = await adminGet<AuditResponse>('/api/admin/audit-logs');
    return result.logs;
  },
};
