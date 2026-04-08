export type SignalRLogDirection = 'state' | 'action' | 'received' | 'error';

export interface SignalRDebugLogEntry {
  id: string;
  sessionId: string;
  timestamp: string;
  direction: SignalRLogDirection;
  event: string;
  payload?: unknown;
  metadata?: Record<string, unknown>;
}

export interface SignalRLogExportPayload {
  exportedAt: string;
  range: {
    start?: string;
    end?: string;
  };
  totalCount: number;
  logs: SignalRDebugLogEntry[];
}
