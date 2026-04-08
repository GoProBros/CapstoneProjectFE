export interface FrontendSystemLogEntry {
  id: string;
  timestamp: string;
  level: string;
  source: string;
  event: string;
  message: string;
  sessionId?: string;
  payload?: unknown;
  metadata?: Record<string, unknown>;
}

export interface FrontendSystemLogQueryResult {
  count: number;
  logs: FrontendSystemLogEntry[];
}
